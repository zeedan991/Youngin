import { calculateMeasurements } from './api_service.js';
import { auth } from './firebase_config.js';
import { saveMeasurements } from './db_service.js';

let isScanning = false; // Prevent rapid clicks

export function initAiSizing() {
    console.log("AI Sizing Module Loaded");

    const startBtn = document.getElementById('start-scan-btn');
    const scanResults = document.getElementById('scan-results');
    const scannerUI = document.querySelector('.scanner-ui');
    const container = document.querySelector('.ai-container');

    if (!startBtn) return;

    // Create File Input (if not exists)
    let fileInput = document.getElementById('ai-image-upload');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'ai-image-upload';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }

    // Clone button to remove old listeners
    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);

    newBtn.addEventListener('click', () => {
        if (isScanning) return;
        fileInput.value = ''; // Reset input to ensure change event fires even for same file
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // ---------------------------------------------------------
            // 1. SHOW HEIGHT INPUT UI (Custom styling, no prompt)
            // ---------------------------------------------------------
            scannerUI.innerHTML = `
                <div class="height-input-container animated-entry">
                    <span class="material-icons-round huge-icon" style="color:var(--primary); margin-bottom:20px;">straighten</span>
                    <h3>One Last Thing</h3>
                    <p>We need your height to calibrate the measurements precisely.</p>
                    
                    <div class="input-group" style="max-width: 300px; margin: 0 auto;">
                        <input type="number" id="user-height-input" placeholder="Height in CM (e.g. 175)" style="text-align:center;">
                    </div>

                    <button class="btn-primary full-width" id="confirm-height-btn" style="margin-top:20px;">
                        Start Analysis
                    </button>
                    <button class="btn-text" id="cancel-scan-btn" style="margin-top:10px;">Cancel</button>
                </div>
            `;

            // Handle Input Logic
            const confirmBtn = document.getElementById('confirm-height-btn');
            const cancelBtn = document.getElementById('cancel-scan-btn');
            const heightInput = document.getElementById('user-height-input');

            // Focus input
            setTimeout(() => { if (heightInput) heightInput.focus(); }, 100);

            cancelBtn.onclick = () => {
                // Reset UI
                location.reload(); // Simplest way to reset state cleanly for MVP
            };

            confirmBtn.onclick = async () => {
                const heightVal = heightInput.value;
                if (!heightVal || isNaN(heightVal) || heightVal < 50 || heightVal > 300) {
                    if (window.app) window.app.showToast("Please enter a valid height (50-300cm).", 'error');
                    return;
                }

                // 2. SHOW LOADING STATE
                isScanning = true;
                scannerUI.innerHTML = `
                    <div class="loader"></div>
                    <h3>Scanning...</h3>
                    <p>Analyzing body proportions with AI...</p>
                `;

                // Visualize Scan Line
                const scanLine = document.querySelector('.scan-line');
                if (scanLine) scanLine.classList.add('scanning-active');

                try {
                    // 3. CALL LOCAL API
                    console.log("Uploading to Local Python Server...");
                    const data = await calculateMeasurements(file, null, parseFloat(heightVal));
                    console.log("AI Response:", data);

                    // SAVE TO FIREBASE
                    if (auth.currentUser) {
                        saveMeasurements(auth.currentUser.uid, data).catch(err => console.error("Save Failed", err));
                    }

                    displayResults(data, scannerUI, container);
                    isScanning = false;

                } catch (error) {
                    console.error("AI Error:", error);
                    isScanning = false;

                    let errorMsg = "Scanning Failed. Is the Python server running?";
                    if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))) {
                        errorMsg = "❌ Connection Refused. Please run 'python app.py' locally.";
                    } else {
                        errorMsg = error.message;
                    }

                    scannerUI.innerHTML = `
                        <span class="material-icons-round huge-icon" style="color: #ef4444">error_outline</span>
                        <h3>Scan Failed</h3>
                        <p>${errorMsg}</p>
                        <button class="btn-primary" onclick="location.reload()">Try Again</button>
                        <small style="display:block; margin-top:10px; opacity:0.6; font-size:11px;">${error.message}</small>
                    `;
                }
            };
        }
    });
}

// Make function globally available so onclick works
window.app = window.app || {};

function displayResults(data, ui, container) {
    // Determine Recommended Size (Enhanced Logic)
    // Determine Recommended Size (Standard Chart)
    const chest = data.chest_circumference || data.chest || 0;

    // Chart Source: Standard "Average" Sizing (converted to CM)
    // S: 34-36" (86-91cm)
    // M: 38-40" (96-101cm)
    // L: 41-43" (104-109cm)
    // XL: 44-46" (112-117cm)
    // XXL: 47-50" (119-127cm)
    // 3XL: 51-54" (130-137cm)

    let size = "3XL";

    // Logic: Upper bound checks
    if (chest < 86) size = "XS";
    else if (chest <= 93) size = "S";      // Cover gap 36-38 roughly here
    else if (chest <= 103) size = "M";     // Cover gap 40-41 roughly here
    else if (chest <= 111) size = "L";     // Cover gap 43-44
    else if (chest <= 119) size = "XL";    // Cover gap 46-47
    else if (chest <= 129) size = "XXL";   // Cover gap 50-51
    else size = "3XL";

    // Determine Body Type
    const waist = data.waist || data.waist_circumference || 0;
    const hip = data.hip || data.hip_circumference || 0;
    let bodyType = "Regular";
    if (chest > 0 && waist > 0) {
        const ratio = chest / waist;
        if (ratio > 1.3) bodyType = "Athletic";
        else if (ratio < 1.1) bodyType = "Slim";
        else bodyType = "Regular";
    }

    // Calculate confidence score (based on data completeness)
    const measurements = [
        data.chest_circumference, data.waist, data.hip,
        data.shoulder_width, data.arm_length, data.trouser_length,
        data.thigh, data.neck
    ];
    const validCount = measurements.filter(m => m && m > 0).length;
    const confidence = Math.min(98, Math.round((validCount / measurements.length) * 100));

    if (ui) ui.style.display = 'none';

    // Helper to safely format numbers
    const fmt = (val) => (val || 0).toFixed(1);

    const resultsHTML = `
        <div class="ai-results-premium glass-panel animated-entry">
            <!-- Hero Section -->
            <div class="size-hero">
                <h2 class="gradient-text">Your Perfect Fit</h2>
                <div class="size-badge-huge">${size}</div>
                <p class="based-on">Based on 12 body measurement points</p>
                
                <!-- Confidence Score -->
                <div class="confidence-container">
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidence}%"></div>
                    </div>
                    <span class="confidence-text">${confidence}% Match for Classic Tee</span>
                </div>
            </div>

            <!-- Body Type Card Removed as per request -->

            <!-- Measurements Grid -->
            <div class="measurements-section">
                <h3 class="section-title">
                    <span class="material-icons-round">straighten</span>
                    Detailed Measurements
                </h3>
                
                <div class="measurements-grid-premium">
                    <!-- Upper Body -->
                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">checkroom</span>
                        <div class="m-content">
                            <label>Chest</label>
                            <strong>${fmt(data.chest_circumference || data.chest)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">accessibility</span>
                        <div class="m-content">
                            <label>Waist</label>
                            <strong>${fmt(data.waist || data.waist_circumference)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">fitness_center</span>
                        <div class="m-content">
                            <label>Hips</label>
                            <strong>${fmt(data.hip || data.hip_circumference)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">height</span>
                        <div class="m-content">
                            <label>Shoulder</label>
                            <strong>${fmt(data.shoulder_width || data.shoulder)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">back_hand</span>
                        <div class="m-content">
                            <label>Arm Length</label>
                            <strong>${fmt(data.arm_length)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">straighten</span>
                        <div class="m-content">
                            <label>Inseam</label>
                            <strong>${fmt(data.trouser_length)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <!-- Additional Measurements -->
                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">sports_martial_arts</span>
                        <div class="m-content">
                            <label>Thigh</label>
                            <strong>${fmt(data.thigh || data.thigh_circumference)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">face</span>
                        <div class="m-content">
                            <label>Neck</label>
                            <strong>${fmt(data.neck || 0)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">straighten</span>
                        <div class="m-content">
                            <label>Shirt Length</label>
                            <strong>${fmt(data.shirt_length || data.torso_length)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">directions_walk</span>
                        <div class="m-content">
                            <label>Leg Length</label>
                            <strong>${fmt(data.leg_length || data.trouser_length)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">sports</span>
                        <div class="m-content">
                            <label>Bicep</label>
                            <strong>${fmt(data.bicep || 0)} <span class="unit">cm</span></strong>
                        </div>
                    </div>

                    <div class="measurement-card">
                        <span class="material-icons-round m-icon">sports_gymnastics</span>
                        <div class="m-content">
                            <label>Calf</label>
                            <strong>${fmt(data.calf || 0)} <span class="unit">cm</span></strong>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="ai-actions-premium">
                <button class="btn-primary gradient-btn full-width glow-on-hover" onclick="window.app.navigateTo('custom-design')">
                    <span class="material-icons-round">brush</span>
                    Start Designing
                </button>
                <div class="secondary-actions">
                    <button class="btn-outline" id="redo-scan-btn">
                        <span class="material-icons-round">refresh</span>
                        Redo Scan
                    </button>
                    <button class="btn-outline" id="export-measurements-btn">
                        <span class="material-icons-round">download</span>
                        Export PDF
                    </button>
                </div>
            </div>
        </div>
    `;

    const resultsDiv = document.getElementById('scan-results');
    resultsDiv.innerHTML = resultsHTML;
    resultsDiv.classList.remove('hidden');
    resultsDiv.style.display = 'block';

    // Bind event listeners
    document.getElementById('redo-scan-btn').onclick = () => {
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'none';

        if (ui) {
            ui.style.display = 'flex';
            ui.innerHTML = `
                <div class="scan-animation">
                    <div class="scanner-line"></div>
                    <span class="material-icons-round huge-icon">qr_code_scanner</span>
                </div>
                <h3>AI Body Scanner</h3>
                <p>Upload a front-facing photo to get your exact measurements instantly.</p>
                <div class="scan-actions">
                    <button class="btn-primary" id="start-scan-btn-retry">Start Body Scan</button>
                    <button class="btn-text">How it works</button>
                </div>
            `;

            const retryBtn = document.getElementById('start-scan-btn-retry');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    const fileInput = document.getElementById('ai-image-upload');
                    if (fileInput) {
                        fileInput.value = '';
                        fileInput.click();
                    }
                });
            }
        }
    };

    // Export functionality - Generate PDF
    document.getElementById('export-measurements-btn').onclick = () => {
        try {
            // Create PDF content as text (simple approach without library)
            const pdfContent = `
YOUNGIN - Body Measurements Report
${'='.repeat(50)}

Recommended Size: ${size}
Body Type: ${bodyType} Build
Confidence Score: ${confidence}%

Detailed Measurements:
${'-'.repeat(50)}
Chest: ${fmt(data.chest_circumference || data.chest)} cm
Waist: ${fmt(data.waist || data.waist_circumference)} cm
Hips: ${fmt(data.hip || data.hip_circumference)} cm
Shoulder: ${fmt(data.shoulder_width || data.shoulder)} cm
Arm Length: ${fmt(data.arm_length)} cm
Inseam: ${fmt(data.trouser_length)} cm
Thigh: ${fmt(data.thigh || data.thigh_circumference)} cm
Neck: ${fmt(data.neck || 0)} cm
Shirt Length: ${fmt(data.shirt_length || data.torso_length)} cm
Leg Length: ${fmt(data.leg_length || data.trouser_length)} cm
Bicep: ${fmt(data.bicep || 0)} cm
Calf: ${fmt(data.calf || 0)} cm

${'='.repeat(50)}
Generated: ${new Date().toLocaleString()}
YOUNGIN.com - Custom Clothing Design
            `;

            // Create downloadable text file (works without external library)
            const blob = new Blob([pdfContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `YOUNGIN_Measurements_${size}_${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success feedback
            const btn = document.getElementById('export-measurements-btn');
            const oldHTML = btn.innerHTML;
            btn.innerHTML = '<span class="material-icons-round">check</span> Downloaded!';
            setTimeout(() => {
                btn.innerHTML = oldHTML;
            }, 2000);

            console.log('Measurements exported:', data);
        } catch (error) {
            console.error('Export error:', error);
            if (window.app) window.app.showToast('Export failed. Please try again.', 'error');
        }
    };
}
