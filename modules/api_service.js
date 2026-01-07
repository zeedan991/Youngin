/**
 * API Service Module
 * Communicates with the Python Flask backend
 */

const API_URL = 'http://localhost:5000';  // Will update to production URL after backend deployment

/**
 * Sends images and height to the local AI backend for measurement.
 * @param {File} frontImage - The front body image file.
 * @param {File} sideImage - The side body image file (optional).
 * @param {number} heightCm - The user's height in centimeters.
 * @returns {Promise<Object>} - The measurement results.
 */
export async function calculateMeasurements(frontImage, sideImage, heightCm) {
    try {
        const formData = new FormData();
        formData.append('front', frontImage);  // Backend expects 'front' not 'front_image'
        if (sideImage) {
            formData.append('left_side', sideImage);  // Backend expects 'left_side' not 'side_image'
        }
        formData.append('height_cm', String(heightCm));

        console.log("Sending request to Local AI...", { heightCm, apiUrl: `${API_URL}/measurements` });

        const response = await fetch(`${API_URL}/measurements`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Processing Failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Local API Error:", error);
        throw error;
    }
}
