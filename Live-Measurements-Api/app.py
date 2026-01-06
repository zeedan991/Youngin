import warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="timm.models.layers")

import cv2
import numpy as np
import mediapipe as mp
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch.nn.functional as F

import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes

mp_pose = mp.solutions.pose
mp_holistic = mp.solutions.holistic
pose = mp_pose.Pose(model_complexity=2)  # Improved accuracy
holistic = mp_holistic.Holistic()  # For refining pose

KNOWN_OBJECT_WIDTH_CM = 21.0  # A4 paper width in cm
FOCAL_LENGTH = 600  # Default focal length
DEFAULT_HEIGHT_CM = 152.0  # Default height if not provided

# Load depth estimation model
def load_depth_model():
    model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small")
    model.eval()
    return model

depth_model = load_depth_model()

def calibrate_focal_length(image, real_width_cm, detected_width_px):
    """Dynamically calibrates focal length using a known object."""
    return (detected_width_px * FOCAL_LENGTH) / real_width_cm if detected_width_px else FOCAL_LENGTH



def detect_reference_object(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest_contour)
        focal_length = calibrate_focal_length(image, KNOWN_OBJECT_WIDTH_CM, w)
        scale_factor = KNOWN_OBJECT_WIDTH_CM / w
        return scale_factor, focal_length
    return 0.05, FOCAL_LENGTH

def estimate_depth(image):
    """Uses AI-based depth estimation to improve circumference calculations."""
    input_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) / 255.0
    input_tensor = torch.tensor(input_image, dtype=torch.float32).permute(2, 0, 1).unsqueeze(0)
    
    # Resize input to match MiDaS model input size
    input_tensor = F.interpolate(input_tensor, size=(384, 384), mode="bilinear", align_corners=False)

    with torch.no_grad():
        depth_map = depth_model(input_tensor)
    
    return depth_map.squeeze().numpy()

def calculate_distance_using_height(landmarks, image_height, user_height_cm):
    """Calculate distance using the user's known height."""
    top_head = landmarks[mp_pose.PoseLandmark.NOSE.value].y * image_height
    bottom_foot = max(
        landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y,
        landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y
    ) * image_height
    
    person_height_px = abs(bottom_foot - top_head)
    
    # Using the formula: distance = (actual_height_cm * focal_length) / height_in_pixels
    distance = (user_height_cm * FOCAL_LENGTH) / person_height_px
    
    # Calculate more accurate scale_factor based on known height
    scale_factor = user_height_cm / person_height_px
    
    return distance, scale_factor

def get_body_width_at_height(frame, height_px, center_x):
    """Scan horizontally at a specific height to find body edges."""
    # Convert to grayscale and apply threshold
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 50, 255, cv2.THRESH_BINARY)
    
    # Ensure height_px is within image bounds
    if height_px >= frame.shape[0]:
        height_px = frame.shape[0] - 1
    
    # Get horizontal line at the specified height
    horizontal_line = thresh[height_px, :]
    
    # Find left and right edges starting from center
    center_x = int(center_x * frame.shape[1])
    left_edge, right_edge = center_x, center_x
    
    # Scan from center to left
    for i in range(center_x, 0, -1):
        if horizontal_line[i] == 0:  # Found edge (black pixel)
            left_edge = i
            break
    
    # Scan from center to right
    for i in range(center_x, len(horizontal_line)):
        if horizontal_line[i] == 0:  # Found edge (black pixel)
            right_edge = i
            break
            
    width_px = right_edge - left_edge
    
    # If width is unreasonably small, apply a minimum width
    min_width = 0.1 * frame.shape[1]  # Minimum width as 10% of image width
    if width_px < min_width:
        width_px = min_width
        
    return width_px

def calculate_measurements(results, scale_factor, image_width, image_height, depth_map, frame=None, user_height_cm=None):
    landmarks = results.pose_landmarks.landmark

    # If user's height is provided, use it to get a more accurate scale factor
    if user_height_cm:
        _, scale_factor = calculate_distance_using_height(landmarks, image_height, user_height_cm)

    def pixel_to_cm(value):
        return round(value * scale_factor, 2)
    
    def calculate_circumference(width_px, depth_ratio=1.0):
        """Estimate circumference using width and depth adjustment."""
        # Using a simplified elliptical approximation: C ≈ 2π * sqrt((a² + b²)/2)
        # where a is half the width and b is estimated depth
        width_cm = width_px * scale_factor
        estimated_depth_cm = width_cm * depth_ratio * 0.5  # Depth is typically ~50% of width for torso
        half_width = width_cm / 2
        half_depth = estimated_depth_cm / 2
        return round(2 * np.pi * np.sqrt((half_width**2 + half_depth**2) / 2), 2)

    measurements = {}

    # Shoulder Width
    left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    shoulder_width_px = abs(left_shoulder.x * image_width - right_shoulder.x * image_width)
    
    # Apply a slight correction factor for shoulders (they're usually detected well)
    shoulder_correction = 1.1  # 10% wider
    shoulder_width_px *= shoulder_correction
    
    measurements["shoulder_width"] = pixel_to_cm(shoulder_width_px)

    # Chest/Bust Measurement
    chest_y_ratio = 0.15  # Approximately 15% down from shoulder to hip
    chest_y = left_shoulder.y + (landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y - left_shoulder.y) * chest_y_ratio
    
    chest_correction = 1.15  # 15% wider than detected width
    chest_width_px = abs((right_shoulder.x - left_shoulder.x) * image_width) * chest_correction
    
    if frame is not None:
        chest_y_px = int(chest_y * image_height)
        center_x = (left_shoulder.x + right_shoulder.x) / 2
        detected_width = get_body_width_at_height(frame, chest_y_px, center_x)
        if detected_width > 0:
            chest_width_px = max(chest_width_px, detected_width)
    
    chest_depth_ratio = 1.0
    if depth_map is not None:
        chest_x = int(((left_shoulder.x + right_shoulder.x) / 2) * image_width)
        chest_y_px = int(chest_y * image_height)
        scale_y = 384 / image_height
        scale_x = 384 / image_width
        chest_y_scaled = int(chest_y_px * scale_y)
        chest_x_scaled = int(chest_x * scale_x)
        if 0 <= chest_y_scaled < 384 and 0 <= chest_x_scaled < 384:
            chest_depth = depth_map[chest_y_scaled, chest_x_scaled]
            max_depth = np.max(depth_map)
            chest_depth_ratio = 1.0 + 0.5 * (1.0 - chest_depth / max_depth)
    
    measurements["chest_width"] = pixel_to_cm(chest_width_px)
    measurements["chest_circumference"] = calculate_circumference(chest_width_px, chest_depth_ratio)
    

    # Waist Measurement
    left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]

    # Adjust waist_y_ratio to better reflect the natural waistline
    waist_y_ratio = 0.35  # 35% down from shoulder to hip (higher than before)
    waist_y = left_shoulder.y + (left_hip.y - left_shoulder.y) * waist_y_ratio

    # Use contour detection to dynamically estimate waist width
    if frame is not None:
        waist_y_px = int(waist_y * image_height)
        center_x = (left_hip.x + right_hip.x) / 2
        detected_width = get_body_width_at_height(frame, waist_y_px, center_x)
        if detected_width > 0:
            waist_width_px = detected_width
        else:
            # Fallback to hip width if contour detection fails
            waist_width_px = abs(right_hip.x - left_hip.x) * image_width * 0.9  # 90% of hip width
    else:
        # Fallback to hip width if no frame is provided
        waist_width_px = abs(right_hip.x - left_hip.x) * image_width * 0.9  # 90% of hip width

    # Apply 30% correction factor to waist width
    waist_correction = 1.16  # 30% wider
    waist_width_px *= waist_correction

    # Get depth adjustment for waist if available
    waist_depth_ratio = 1.0
    if depth_map is not None:
        waist_x = int(((left_hip.x + right_hip.x) / 2) * image_width)
        waist_y_px = int(waist_y * image_height)
        scale_y = 384 / image_height
        scale_x = 384 / image_width
        waist_y_scaled = int(waist_y_px * scale_y)
        waist_x_scaled = int(waist_x * scale_x)
        if 0 <= waist_y_scaled < 384 and 0 <= waist_x_scaled < 384:
            waist_depth = depth_map[waist_y_scaled, waist_x_scaled]
            max_depth = np.max(depth_map)
            waist_depth_ratio = 1.0 + 0.5 * (1.0 - waist_depth / max_depth)

    measurements["waist_width"] = pixel_to_cm(waist_width_px)
    measurements["waist"] = calculate_circumference(waist_width_px, waist_depth_ratio)
    # Hip Measurement
    hip_correction = 1.05  # Hips are slightly wider than detected landmarks
    hip_width_px = abs(left_hip.x * image_width - right_hip.x * image_width) * hip_correction
    
    # DISABLED: Contour detection was inflating hip measurements
    # if frame is not None:
    #     hip_y_offset = 0.1  # 10% down from hip landmarks
    #     hip_y = left_hip.y + (landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y - left_hip.y) * hip_y_offset
    #     hip_y_px = int(hip_y * image_height)
    #     center_x = (left_hip.x + right_hip.x) / 2
    #     detected_width = get_body_width_at_height(frame, hip_y_px, center_x)
    #     if detected_width > 0:
    #         hip_width_px = max(hip_width_px, detected_width)
    
    hip_depth_ratio = 1.0
    if depth_map is not None:
        hip_x = int(((left_hip.x + right_hip.x) / 2) * image_width)
        hip_y_px = int(left_hip.y * image_height)
        hip_y_scaled = int(hip_y_px * scale_y)
        hip_x_scaled = int(hip_x * scale_x)
        if 0 <= hip_y_scaled < 384 and 0 <= hip_x_scaled < 384:
            hip_depth = depth_map[hip_y_scaled, hip_x_scaled]
            max_depth = np.max(depth_map)
            hip_depth_ratio = 1.0 + 0.5 * (1.0 - hip_depth / max_depth)
    
    measurements["hip_width"] = pixel_to_cm(hip_width_px)
    measurements["hip"] = calculate_circumference(hip_width_px, hip_depth_ratio)

    # Other measurements (unchanged)
    neck = landmarks[mp_pose.PoseLandmark.NOSE.value]
    left_ear = landmarks[mp_pose.PoseLandmark.LEFT_EAR.value]
    neck_width_px = abs(neck.x * image_width - left_ear.x * image_width) * 2.0
    measurements["neck"] = calculate_circumference(neck_width_px, 1.0)
    measurements["neck_width"] = pixel_to_cm(neck_width_px)

    left_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value]
    sleeve_length_px = abs(left_shoulder.y * image_height - left_wrist.y * image_height)
    measurements["arm_length"] = pixel_to_cm(sleeve_length_px)

    shirt_length_px = abs(left_shoulder.y * image_height - left_hip.y * image_height) * 1.2
    measurements["shirt_length"] = pixel_to_cm(shirt_length_px)

     # Thigh Circumference (improved with depth information)
    thigh_y_ratio = 0.2  # 20% down from hip to knee
    left_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value]
    thigh_y = left_hip.y + (left_knee.y - left_hip.y) * thigh_y_ratio
    
    # Apply correction factor for thigh width
    thigh_correction = 1.2  # Thighs are typically wider than what can be estimated from front view
    thigh_width_px = hip_width_px * 0.5 * thigh_correction  # Base thigh width on hip width
    
    # Use contour detection if frame is available
    if frame is not None:
        thigh_y_px = int(thigh_y * image_height)
        thigh_x = left_hip.x * 0.9  # Move slightly inward from hip
        detected_width = get_body_width_at_height(frame, thigh_y_px, thigh_x)
        if detected_width > 0 and detected_width < hip_width_px:  # Sanity check
            thigh_width_px = detected_width  # Use detected width
    
    # If depth map is available, use it for thigh measurement
    thigh_depth_ratio = 1.0
    if depth_map is not None:
        thigh_x = int(left_hip.x * image_width)
        thigh_y_px = int(thigh_y * image_height)
        
        # Scale coordinates to match depth map size
        thigh_y_scaled = int(thigh_y_px * scale_y)
        thigh_x_scaled = int(thigh_x * scale_x)
        
        if 0 <= thigh_y_scaled < 384 and 0 <= thigh_x_scaled < 384:
            thigh_depth = depth_map[thigh_y_scaled, thigh_x_scaled]
            max_depth = np.max(depth_map)
            thigh_depth_ratio = 1.0 + 0.5 * (1.0 - thigh_depth / max_depth)
    
    measurements["thigh"] = pixel_to_cm(thigh_width_px)
    measurements["thigh_circumference"] = calculate_circumference(thigh_width_px, thigh_depth_ratio)


    left_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    trouser_length_px = abs(left_hip.y * image_height - left_ankle.y * image_height)
    measurements["trouser_length"] = pixel_to_cm(trouser_length_px)

    return measurements


def validate_front_image(image_np):
    """
    Basic validation for front image to ensure:
    - There is a person in the image
    - Not just a face/selfie (upper body visible)
    - Key upper landmarks are detected
    """
    try:
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        image_height, image_width = image_np.shape[:2]
        
        # Process with MediaPipe Holistic (Higher complexity for accuracy)
        with mp_holistic.Holistic(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            refine_face_landmarks=False) as holistic:
            
            results = holistic.process(rgb_frame)
        
        if not hasattr(results, 'pose_landmarks') or not results.pose_landmarks:
            return False, "No person detected. Please make sure you're clearly visible in the frame."

        # Minimum required upper body landmarks (Reduced strictness)
        # We focus on having a TORSO. Limbs can be partially obscured in worse case.
        MINIMUM_LANDMARKS = [
            mp_holistic.PoseLandmark.NOSE,
            mp_holistic.PoseLandmark.LEFT_SHOULDER,
            mp_holistic.PoseLandmark.RIGHT_SHOULDER
        ]
        
        # Verify minimum landmarks are detected
        missing_upper = []
        for landmark in MINIMUM_LANDMARKS:
            landmark_data = results.pose_landmarks.landmark[landmark]
            # Lower threshold to 0.3 for better tolerance
            if (landmark_data.visibility < 0.3 or 
                landmark_data.x < 0 or 
                landmark_data.x > 1 or
                landmark_data.y < 0 or 
                landmark_data.y > 1):
                missing_upper.append(landmark.name.replace('_', ' '))
        
        if missing_upper:
            logger.debug(f"Validation Failed. Missing: {missing_upper}")
            return False, f"Couldn't detect full upper body. Please make sure your head and shoulders are visible."

        # Check if this might be just a face/selfie (no torso)
        nose = results.pose_landmarks.landmark[mp_holistic.PoseLandmark.NOSE]
        left_shoulder = results.pose_landmarks.landmark[mp_holistic.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = results.pose_landmarks.landmark[mp_holistic.PoseLandmark.RIGHT_SHOULDER]
        
        # Calculate approximate upper body size
        shoulder_width = abs(left_shoulder.x - right_shoulder.x) * image_width
        head_to_shoulder = abs(left_shoulder.y - nose.y) * image_height
        
        # If the shoulder width is small compared to head size, likely a selfie
        if shoulder_width < head_to_shoulder * 1.2:
            return False, "Please step back to show more of your upper body, not just your face."

        return True, "Validation passed - proceeding with measurements"
        
    except Exception as e:
        logger.error(f"Error validating body image: {e}")
        return False, "You arent providing images correctly. Please try again."
    
@app.route("/measurements", methods=["POST"])
def upload_images():
    # Create a mutable copy of files
    files = request.files.copy()
    
    if "front" not in files:
        # Fallback to checking 'front_image' key if 'front' is missing
        if "front_image" in files:
             files["front"] = files["front_image"] # normalize
        else:
             return jsonify({"error": "Missing front image for reference."}), 400
    
    front_image_file = files["front"]
    front_image_np = np.frombuffer(front_image_file.read(), np.uint8)
    front_image_file.seek(0)  # Reset file pointer
    
    is_valid, error_msg = validate_front_image(cv2.imdecode(front_image_np, cv2.IMREAD_COLOR))
    
    if not is_valid:
        return jsonify({
            "error": error_msg,
            "pose": "front",
            "code": "INVALID_POSE"
        }), 400
    
    # Get user height if provided, otherwise use default
    user_height_cm = request.form.get('height_cm')
    
    # Normalize height param
    if not user_height_cm:
        user_height_cm = request.form.get('height')

    logger.info(f"Processing measurement request - Height: {user_height_cm}cm")

    if user_height_cm:
        try:
            user_height_cm = float(user_height_cm)
        except ValueError:
            user_height_cm = DEFAULT_HEIGHT_CM
    else:
        user_height_cm = DEFAULT_HEIGHT_CM
    
    # Also check for 'side_image' mapped to 'left_side'
    if "side_image" in files:
        files["left_side"] = files["side_image"]

    received_images = {pose_name: files[pose_name] for pose_name in ["front", "left_side"] if pose_name in files}
    measurements, scale_factor, focal_length, results = {}, None, FOCAL_LENGTH, {}
    frames = {}
    
    for pose_name, image_file in received_images.items():
        image_np = np.frombuffer(image_file.read(), np.uint8)
        frame = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
        if frame is None:
            logger.error(f"Could not decode image for {pose_name}")
            continue # Skip invalid files instead of crashing
            
        frames[pose_name] = frame  # Store the frame for contour detection
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Use context manager for a fresh instance per request to prevent crashes/state issues
        with mp_holistic.Holistic(static_image_mode=True, model_complexity=2) as holistic_scoped:
            results[pose_name] = holistic_scoped.process(rgb_frame)
            
        image_height, image_width, _ = frame.shape
        
        if pose_name == "front":
            # Always use height for calibration (default or provided)
            if results[pose_name].pose_landmarks:
                _, scale_factor = calculate_distance_using_height(
                    results[pose_name].pose_landmarks.landmark,
                    image_height,
                    user_height_cm
                )
            else:
                # Fallback to object detection only if pose landmarks aren't detected
                scale_factor, focal_length = detect_reference_object(frame)
        
        depth_map = estimate_depth(frame) if pose_name in ["front", "left_side"] else None
        
        if results[pose_name].pose_landmarks:
            if pose_name == "front":
                measurements.update(calculate_measurements(
                    results[pose_name], 
                    scale_factor, 
                    image_width, 
                    image_height, 
                    depth_map,
                    frames[pose_name],  # Pass the frame for contour detection
                    user_height_cm
                ))
    
    # Debug information to help troubleshoot measurements
    debug_info = {
        "scale_factor": float(scale_factor) if scale_factor else None,
        "focal_length": float(focal_length),
        "user_height_cm": float(user_height_cm)
    }

    logger.info(f"Measurements calculated successfully")
    
    # Convert numpy types to native python types for JSON serialization
    def convert_numpy(obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: convert_numpy(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_numpy(i) for i in obj]
        return obj

    return jsonify(convert_numpy(measurements))

# --- GEMINI CHATBOT INTEGRATION ---
from google import genai
from google.genai import types

# Configure Gemini API from environment variable
GENAI_API_KEY = os.getenv('GENAI_API_KEY')
if not GENAI_API_KEY:
    logger.warning("GENAI_API_KEY not found in environment variables. Chatbot will not work.")
    client = None
else:
    client = genai.Client(api_key=GENAI_API_KEY)

# System Instruction
sys_instruction = """You are YOUNGIN's AI Assistant—representing a world-class fashion technology platform.

**Communication Style:**
- Ultra-professional, concise, and sophisticated
- Responses under 3 sentences when possible
- Clear, actionable information
- No technical jargon unless requested

**Platform Knowledge:**

**AI Sizing**
- Instant body measurements from one photo using computer vision
- 98% accuracy with tight-fitting clothing
- Privacy-first: photos processed in seconds, never stored

**Design Studio**
- Custom t-shirts, hoodies, and pants
- Real-time design with drag-and-drop tools
- Premium fabric rendering

**Quality & Production**
- Sustainable fabrics: Organic Cotton, Bamboo, Italian Silk
- Made-to-order based on your exact measurements
- Ships in 3-5 business days

**Response Rules:**
1. Keep answers brief and direct
2. Use bullet points for clarity
3. For unknowns: "Contact support@youngin.com for assistance"
4. Never mention backend technologies

**Tone:** Think Apple meets haute couture—premium, minimal, precise.
"""

# Keep a simple history wrapper or just send context each time for stateless simplicity
chat_history = [
    types.Content(role="user", parts=[types.Part.from_text(text="Who are you?")]),
    types.Content(role="model", parts=[types.Part.from_text(text="I am the Youngin AI Assistant, here to help you design your legacy.")])
]

@app.route("/chat", methods=["POST"])
def chat_endpoint():
    if not client:
        return jsonify({"error": "Chatbot service is currently unavailable"}), 503
    try:
        data = request.json
        user_message = data.get("message", "")
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        try:
            response = client.models.generate_content(
                model='gemini-flash-latest', 
                config=types.GenerateContentConfig(
                    system_instruction=sys_instruction,
                    temperature=0.7
                ),
                contents=[user_message]
            )
            
            if response.text:
                bot_reply = response.text
                return jsonify({"reply": bot_reply})
            else:
                return jsonify({"error": "I couldn't generate a response. Please try rephrasing."}), 500

        except Exception as api_err:
            logger.error(f"Gemini API Error: {api_err}")
            return jsonify({"error": "I am currently experiencing high traffic. Please try again later."}), 500
        
    except Exception as e:
        logger.error(f"Server Error in /chat: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
