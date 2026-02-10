/**
 * Custom Design Studio Module (V2 - Professional)
 * Powered by Fabric.js for Canva-like-Experience
 * Redeigned for "Youngin Custom Design Studio" Glassmorphism Look
 */

import { auth } from './firebase_config.js';
import { saveDesign, getDesigns } from './db_service.js';

let canvas = null;
let currentGarment = 'tshirt';
let isDrawingMode = false;
let history = []; // Stack for undo
let historyStep = -1; // Pointer for undo
let isSaving = false; // Prevent double saves

// Wrapper to load designs
async function loadSavedDesigns(app) {
    if (!auth.currentUser) return;

    // Show loading state?
    const grid = document.getElementById('history-thumbs');
    if (grid) grid.innerHTML = '<div class="loader-spinner"></div>';

    const designs = await getDesigns(auth.currentUser.uid);
    renderHistoryThumbnails(designs);
}

function renderHistoryThumbnails(designs) {
    const grid = document.getElementById('history-thumbs');
    if (!grid) return;
    grid.innerHTML = ''; // Clear

    if (designs.length === 0) {
        // grid.innerHTML = '<div class="empty-state-text">No saved designs yet.</div>';
        return;
    }

    designs.forEach(design => {
        const thumb = document.createElement('div');
        thumb.className = 'history-thumb-item';
        thumb.innerHTML = `<img src="${design.image}" loading="lazy">`;
        thumb.title = design.name;

        // Optional: Load logic on click
        thumb.addEventListener('click', () => {
            if (confirm(`Load "${design.name}"? Unsaved changes will be lost.`)) {
                if (design.fabricState) {
                    canvas.loadFromJSON(design.fabricState, () => {
                        canvas.renderAll();
                        currentGarment = design.garmentType;
                        // Sync selector
                        const sel = document.getElementById('garment-select-dropdown');
                        if (sel) sel.value = currentGarment;
                    });
                }
            }
        });

        grid.appendChild(thumb);
    });
}


// Centralized Garment Assets - Updated to PNG
const GARMENTS = {
    'tshirt': { color: '#ffffff', image: 'assets/tshirt.png', name: "T-Shirt" },
    'hoodie': { color: '#ffffff', image: 'assets/hoodie.png', name: "Hoodie" },
    'pants': { color: '#ffffff', image: 'assets/pants.png', name: "Pants" }
};

export function initCustomDesign(appInstance) {
    const container = document.querySelector('.studio-placeholder');
    if (!container) return;

    // Render Professional Studio UI (Glassmools Style)
    container.innerHTML = `
        <div class="studio-wrapper-glass">
            
            <!-- LEFT TOOLBAR (Floating Capsule) -->
            <div class="glass-toolbar-left">
                <div class="toolbar-capsule">
                    <button class="tool-btn-glass" id="tool-brush" title="Brush">
                        <span class="material-icons-round">brush</span>
                        <span class="label">Brush</span>
                    </button>
                    <button class="tool-btn-glass" id="tool-eraser" title="Eraser">
                        <span class="material-icons-round">auto_fix_normal</span>
                        <span class="label">Eraser</span>
                    </button>
                    <button class="tool-btn-glass" id="add-shape-btn" title="Shapes">
                        <span class="material-icons-round">category</span>
                        <span class="label">Shapes</span>
                    </button>
                    <button class="tool-btn-glass" id="add-text-btn" title="Text">
                        <span class="material-icons-round">title</span>
                        <span class="label">Text</span>
                    </button>
                    <!-- Color button removed - using right sidebar palette instead -->
                     <button class="tool-btn-glass" id="upload-img-btn-trigger" title="Upload">
                        <span class="material-icons-round">add_photo_alternate</span>
                        <span class="label">Upload</span>
                    </button>
                    <div class="toolbar-divider"></div>
                </div>
                <!-- Hidden Brush Controls -->
                <div id="brush-popup" class="glass-popup" style="display:none;">
                     <label>Size</label>
                     <input type="range" id="brush-width" min="1" max="50" value="5">
                </div>
            </div>

            <!-- CENTER CANVAS AREA -->
            <div class="studio-center-stage">
                <div class="canvas-header-glass">
                    <h2 class="studio-title">Youngin Custom Design Studio</h2>
                </div>

                <div class="canvas-container-glass">
                     <!-- Enforce Dimensions on specific ID for safety -->
                     <div class="canvas-frame" id="main-canvas-frame">
                        <!-- 1. Background Layer (Separate from Fabric) -->
                        <div id="garment-bg-layer"></div>
                        
                        <!-- 2. Drawing Canvas (Transparent) -->
                        <canvas id="c" width="500" height="600"></canvas>
                        
                        <!-- Floating Garment Selector -->
                        <div class="garment-selector-float">
                             <select id="garment-select-dropdown" class="glass-select">
                                <option value="tshirt" selected>T-Shirt</option>
                                <option value="hoodie">Hoodie</option>
                                <option value="pants">Pants</option>
                                <option value="custom">Custom (Upload)</option>
                             </select>
                        </div>
                     </div>
                </div>
            </div>

            <!-- RIGHT SIDEBAR (Glass Panel) -->
            <div class="glass-sidebar-right">
                <div class="sidebar-content">
                    
                    <!-- Section: Color Presets -->
                    <div class="panel-section">
                        <h4>Color Palette</h4>
                        <!-- Native Picker Trigger Integration -->
                        <div class="preset-grid">
                            <button class="color-dot active-ring" id="trigger-picker-btn" style="background:conic-gradient(red, yellow, lime, cyan, blue, magenta, red)">
                                <span class="material-icons-round" style="font-size:16px; color:white; text-shadow:0 0 5px black">add</span>
                            </button>
                            <button class="color-dot" style="background:#000000" data-color="#000000"></button>
                            <button class="color-dot" style="background:#ffffff" data-color="#ffffff"></button>
                            <button class="color-dot" style="background:#3b82f6" data-color="#3b82f6"></button>
                            <button class="color-dot" style="background:#ef4444" data-color="#ef4444"></button>
                            <button class="color-dot" style="background:#22c55e" data-color="#22c55e"></button>
                            <button class="color-dot" style="background:#facc15" data-color="#facc15"></button>
                            <button class="color-dot" style="background:#a855f7" data-color="#a855f7"></button>
                            <input type="color" id="native-color-picker" style="opacity:0; position:absolute; pointer-events:none;">
                            <input type="hidden" id="active-color-hex" value="#000000"> 
                        </div>
                    </div>

                    <!-- Section: History -->
                    <!-- Your Designs section removed for cleaner UI -->

                    <div class="sidebar-actions" style="margin-top:auto">
                         <div class="action-buttons-grid">
                             <button class="action-btn-glass" id="undo-btn" title="Undo">
                                <span class="material-icons-round">undo</span>
                             </button>
                             <button class="action-btn-glass" id="redo-btn" title="Redo">
                                <span class="material-icons-round">redo</span>
                             </button>
                             <button class="action-btn-glass" id="clear-btn" title="Clear Canvas">
                                <span class="material-icons-round">delete</span>
                             </button>
                             <button class="action-btn-glass" id="download-btn" title="Download">
                                <span class="material-icons-round">download</span>
                             </button>
                         </div>
                         
                         <button class="btn-primary gradient-btn full-width save-btn-large" id="save-design-btn" style="margin-top:15px;">
                            Save to Cloud
                        </button>
                    </div>
                </div>

                <!-- Decoration indicators -->
                 <div class="sidebar-decor-line"></div>
            </div>

            <!-- Hidden Inputs -->
             <input type="file" id="img-upload-hidden" accept="image/*" style="display:none">

        </div>
    `;

    // Robust Initialization with Retry
    const tryInit = (attempts = 0) => {
        const canvasEl = document.getElementById('c');
        if (canvasEl) {
            initFabricCanvas(appInstance);
        } else if (attempts < 10) {
            setTimeout(() => tryInit(attempts + 1), 100);
        }
    };
    // Ensure Fabric is loaded
    if (typeof fabric === 'undefined') {
        setTimeout(() => tryInit(), 500);
    } else {
        tryInit();
    }
}

function initFabricCanvas(app) {
    const canvasEl = document.getElementById('c');
    if (!canvasEl) return;

    // --- SETUP ---
    initialiseFabricContext();

    // Set Initial Background
    updateGarmentBackground(currentGarment);

    // Initial History State
    saveHistory();

    // --- TOOLBAR HANDLERS ---
    setupGarmentSelectors();
    setupDrawingTools();
    setupAddTools();
    setupColorTools(); // New dedicated handler
    setupCanvasActions(app); // undo/redo/save
    setupHistoryListener(); // Watch for canvas changes

    // Load Data
    loadSavedDesigns(app);

    // Initial Garment render
    setTimeout(() => {
        updateGarmentBackground(currentGarment);
    }, 100);
}

function initialiseFabricContext() {
    if (canvas) { canvas.dispose(); }

    canvas = new fabric.Canvas('c', {
        backgroundColor: 'transparent',
        selection: true,
        preserveObjectStacking: true,
        width: 500,
        height: 600
    });

    // Enhance selection style to match premium look
    fabric.Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#d946ef', // Neon pink/purple style
        borderColor: '#d946ef',
        cornerSize: 12,
        padding: 8,
        cornerStyle: 'circle',
        borderDashArray: [4, 4]
    });
}

function setupGarmentSelectors() {
    const selector = document.getElementById('garment-select-dropdown');

    selector.addEventListener('change', (e) => {
        const newGarment = e.target.value;
        if (currentGarment !== newGarment) {
            currentGarment = newGarment;
            updateGarmentBackground(currentGarment);
            saveHistory();
        }
    });

    // Sync selector if default is different?
    selector.value = currentGarment;
}

function updateGarmentBackground(type) {
    if (!canvas) return;
    const bgLayer = document.getElementById('garment-bg-layer');
    if (!bgLayer) return;

    // Handle Custom Upload
    if (type === 'custom') {
        // Trigger generic upload for background
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (f) => {
                    bgLayer.style.backgroundImage = `url(${f.target.result})`;
                    GARMENTS['custom'] = GARMENTS['custom'] || {}; // Ensure GARMENTS['custom'] exists
                    GARMENTS['custom'].image = f.target.result; // Cache it
                };
                reader.readAsDataURL(file);
            } else {
                // Revert if cancelled?
                document.getElementById('garment-select-dropdown').value = 'tshirt';
                currentGarment = 'tshirt'; // Also update currentGarment
                updateGarmentBackground('tshirt');
            }
        };
        input.click();
        return;
    }

    // Standard Garments
    const info = GARMENTS[type];
    if (info && info.image) {
        bgLayer.style.backgroundImage = `url(${info.image})`;
        bgLayer.style.backgroundSize = 'contain';
        bgLayer.style.backgroundRepeat = 'no-repeat';
        bgLayer.style.backgroundPosition = 'center';
    } else {
        // Clear background if no image info
        bgLayer.style.backgroundImage = 'none';
    }

    // Clear any old fabric objects that were backgrounds (no longer needed with div background)
    canvas.getObjects().forEach(obj => {
        if (obj.isGarmentBackground) canvas.remove(obj);
    });
    canvas.requestRenderAll();
}

function setupColorTools() {
    // New simplified color logic
    const colorDots = document.querySelectorAll('.color-dot[data-color]');
    const pickerTrigger = document.getElementById('trigger-picker-btn');
    const nativePicker = document.getElementById('native-color-picker');
    const hexInput = document.getElementById('active-color-hex');

    // 1. Preset Clicks
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            // Visual selection state
            document.querySelectorAll('.color-dot').forEach(d => d.style.border = 'none');
            dot.style.border = '2px solid white';

            const color = dot.dataset.color;
            applyColorToActive(color);
            hexInput.value = color;
        });
    });

    // 2. Custom Picker
    if (pickerTrigger) {
        pickerTrigger.addEventListener('click', () => {
            nativePicker.click();
        });
    }

    nativePicker.addEventListener('input', (e) => {
        applyColorToActive(e.target.value);
        hexInput.value = e.target.value;
    });
}

function applyColorToActive(color) {
    if (canvas.isDrawingMode) {
        canvas.freeDrawingBrush.color = color;
        // Visual feedback?
        return;
    }

    const activeObj = canvas.getActiveObject();
    if (activeObj) {
        activeObj.set('fill', color);
        // If it's a path or stroke object, maybe stroke?
        if (activeObj.type === 'path' && !activeObj.fill) {
            activeObj.set('stroke', color);
        }
        canvas.requestRenderAll();
        saveHistory();
    }
}


function setupDrawingTools() {
    const brushBtn = document.getElementById('tool-brush');
    const eraserBtn = document.getElementById('tool-eraser');
    const brushPopup = document.getElementById('brush-popup');
    const brushWidth = document.getElementById('brush-width');

    // Safety check
    if (!brushBtn || !eraserBtn || !brushPopup || !brushWidth) {
        console.error('Drawing tools not found!', { brushBtn, eraserBtn, brushPopup, brushWidth });
        return;
    }

    const resetTools = () => {
        canvas.isDrawingMode = false;
        document.querySelectorAll('.tool-btn-glass').forEach(b => b.classList.remove('active'));
        brushPopup.style.display = 'none';
        canvas.defaultCursor = 'default';
        canvas.selection = true; // Re-enable selection

        // Remove any eraser event listeners
        const eraserBtn = document.getElementById('tool-eraser');
        if (eraserBtn && eraserBtn._deleteHandler) {
            canvas.off('mouse:down', eraserBtn._deleteHandler);
            eraserBtn._deleteHandler = null;
        }
    };

    // 1. Brush
    brushBtn.addEventListener('click', () => {
        const isActive = brushBtn.classList.contains('active');

        // If already active, just deactivate
        if (isActive) {
            resetTools();
            return;
        }

        // Otherwise activate brush
        resetTools();
        brushBtn.classList.add('active');
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = document.getElementById('active-color-hex').value || '#000000';
        canvas.freeDrawingBrush.width = parseInt(brushWidth.value, 10);
        brushPopup.style.display = 'block';
    });

    // 2. Eraser - Uses EraserBrush to actually erase objects
    eraserBtn.addEventListener('click', () => {
        const isActive = eraserBtn.classList.contains('active');

        // If already active, just deactivate
        if (isActive) {
            resetTools();
            return;
        }

        // Otherwise activate eraser
        resetTools();
        eraserBtn.classList.add('active');
        canvas.isDrawingMode = true;

        // Use EraserBrush if available, otherwise use delete mode
        if (fabric.EraserBrush) {
            canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
            canvas.freeDrawingBrush.width = parseInt(brushWidth.value, 10) * 2;
        } else {
            // Fallback: Delete selected objects mode
            canvas.isDrawingMode = false;
            canvas.defaultCursor = 'not-allowed';
            const deleteMode = () => {
                const active = canvas.getActiveObject();
                if (active) {
                    canvas.remove(active);
                    saveHistory();
                }
            };
            canvas.on('mouse:down', deleteMode);
            // Store reference to remove later
            eraserBtn._deleteHandler = deleteMode;
        }
        brushPopup.style.display = 'block';
    });

    brushWidth.addEventListener('input', (e) => {
        if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = parseInt(e.target.value, 10);
        }
    });
}

function setupAddTools() {
    // Safety checks
    const textBtn = document.getElementById('add-text-btn');
    const shapeBtn = document.getElementById('add-shape-btn');
    const uploadBtn = document.getElementById('upload-img-btn-trigger');
    const imgInput = document.getElementById('img-upload-hidden');

    if (!textBtn || !shapeBtn || !uploadBtn || !imgInput) {
        console.error('Add tools not found!', { textBtn, shapeBtn, uploadBtn, imgInput });
        return;
    }

    // Get resetTools reference from setupDrawingTools scope
    const resetDrawingMode = () => {
        canvas.isDrawingMode = false;
        document.querySelectorAll('.tool-btn-glass').forEach(b => b.classList.remove('active'));
        const brushPopup = document.getElementById('brush-popup');
        if (brushPopup) brushPopup.style.display = 'none';
        canvas.defaultCursor = 'default';
        canvas.selection = true;
    };

    // 1. Text
    textBtn.addEventListener('click', () => {
        // Reset drawing mode if active
        resetDrawingMode();

        // Add visual feedback
        textBtn.classList.add('active');
        setTimeout(() => textBtn.classList.remove('active'), 300);

        const text = new fabric.IText('YOUNGIN', {
            left: canvas.width / 2,
            top: canvas.height / 3,
            fontFamily: 'Outfit',
            fill: document.getElementById('active-color-hex').value || '#000000',
            fontSize: 40,
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center',
            editable: true
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
        saveHistory();
    });

    // 2. Image
    uploadBtn.addEventListener('click', () => {
        // Add visual feedback
        uploadBtn.classList.add('active');
        setTimeout(() => uploadBtn.classList.remove('active'), 300);

        imgInput.click();
    });

    imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            const data = f.target.result;
            fabric.Image.fromURL(data, (img) => {
                img.scaleToWidth(150);
                img.set({
                    left: canvas.width / 2,
                    top: canvas.height / 2,
                    originX: 'center',
                    originY: 'center'
                });
                canvas.add(img);
                canvas.setActiveObject(img);
                imgInput.value = '';
                saveHistory();
            });
        };
        reader.readAsDataURL(file);
    });

    // 3. Shapes
    shapeBtn.addEventListener('click', () => {
        resetDrawingMode();

        // Add visual feedback
        shapeBtn.classList.add('active');
        setTimeout(() => shapeBtn.classList.remove('active'), 300);

        const circle = new fabric.Circle({
            radius: 50,
            fill: document.getElementById('active-color-hex').value || '#facc15',
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center'
        });
        canvas.add(circle);
        canvas.setActiveObject(circle);
        saveHistory();
    });
}

function setupCanvasActions(app) {
    // 1. Clear - No confirmation popup
    document.getElementById('clear-btn').addEventListener('click', () => {
        canvas.clear();
        updateGarmentBackground(currentGarment);
        saveHistory();
        // Show brief feedback
        const btn = document.getElementById('clear-btn');
        const oldHTML = btn.innerHTML;
        btn.innerHTML = '<span class="material-icons-round">check</span>';
        setTimeout(() => btn.innerHTML = oldHTML, 1000);
    });

    // 2. Download
    document.getElementById('download-btn').addEventListener('click', async () => {
        const btn = document.getElementById('download-btn');
        const oldText = btn.innerHTML;
        btn.innerHTML = '<span class="material-icons-round spin">sync</span>';
        btn.disabled = true;

        try {
            canvas.discardActiveObject();
            canvas.renderAll();

            // COMPOSITE SNAPSHOT (BG + Canvas)
            const box = document.getElementById('garment-bg-layer');
            const bgStyle = window.getComputedStyle(box);
            const composite = document.createElement('canvas');
            composite.width = canvas.width;
            composite.height = canvas.height;
            const ctx = composite.getContext('2d');

            // 1. Draw Background
            const urlMatch = bgStyle.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
            if (urlMatch && urlMatch[1]) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        // Simulate "contain"
                        const scale = Math.min(composite.width / img.width, composite.height / img.height);
                        const w = img.width * scale;
                        const h = img.height * scale;
                        const x = (composite.width - w) / 2;
                        const y = (composite.height - h) / 2;
                        ctx.drawImage(img, x, y, w, h);
                        resolve();
                    };
                    img.onerror = resolve;
                    img.src = urlMatch[1];
                });
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, composite.width, composite.height);
            }

            // 2. Draw Fabric
            const fabricData = canvas.toDataURL({ format: 'png', multiplier: 1 });
            await new Promise((resolve) => {
                const fImg = new Image();
                fImg.onload = () => {
                    ctx.drawImage(fImg, 0, 0);
                    resolve();
                };
                fImg.src = fabricData;
            });

            // 3. Download
            const dataURL = composite.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.download = `youngin-design-${Date.now()}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (err) {
            console.error("Download failed", err);
            if (window.app) window.app.showToast("Failed to generate download.", 'error');
        } finally {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    });

    // 3. UNDO / REDO
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);

    // 4. SAVE TO CLOUD
    document.getElementById('save-design-btn').addEventListener('click', async () => {
        if (!auth.currentUser) {
            if (window.app) window.app.showToast("Please Login to Save!", 'error');
            if (window.openAuthModal) window.openAuthModal('login');
            return;
        }

        if (isSaving) return;
        isSaving = true;
        const btn = document.getElementById('save-design-btn');
        const oldText = btn.innerText;
        btn.innerText = "Saving...";
        btn.disabled = true;

        try {
            canvas.discardActiveObject();
            canvas.requestRenderAll();

            // COMPOSITE SNAPSHOT (BG + Canvas)
            const box = document.getElementById('garment-bg-layer');
            const bgStyle = window.getComputedStyle(box);
            const composite = document.createElement('canvas');
            composite.width = canvas.width;
            composite.height = canvas.height;
            const ctx = composite.getContext('2d');

            // 1. Draw Background
            // Extract URL from style
            const urlMatch = bgStyle.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
            if (urlMatch && urlMatch[1]) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        // Simulate "contain"
                        const scale = Math.min(composite.width / img.width, composite.height / img.height);
                        const w = img.width * scale;
                        const h = img.height * scale;
                        const x = (composite.width - w) / 2;
                        const y = (composite.height - h) / 2;
                        ctx.drawImage(img, x, y, w, h);
                        resolve();
                    };
                    img.onerror = resolve; // Continue even if fail
                    img.src = urlMatch[1];
                });
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, composite.width, composite.height);
            }

            // 2. Draw Fabric
            // fabric's toDataURL creates a transparent png of drawings
            const fabricData = canvas.toDataURL({ format: 'png', multiplier: 1 });
            await new Promise((resolve) => {
                const fImg = new Image();
                fImg.onload = () => {
                    ctx.drawImage(fImg, 0, 0);
                    resolve();
                };
                fImg.src = fabricData;
            });

            const finalPreview = composite.toDataURL('image/png', 0.8);

            // 3. Save State
            const designPayload = {
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || "Youngin Designer",
                garmentType: currentGarment, // Store this to restore BG
                image: finalPreview,
                fabricState: JSON.stringify(canvas.toJSON()), // Just the strokes
                name: `Custom ${currentGarment} ${new Date().toLocaleDateString()}`,
                lastModified: Date.now()
            };

            await saveDesign(designPayload);

            // Show success feedback
            btn.innerText = "✓ Saved!";
            setTimeout(() => {
                btn.innerText = oldText;
            }, 2000);

            // Reload designs to show new one
            await loadSavedDesigns(app);

            // Add thumbnail
            addHistoryThumbnail(finalPreview);

        } catch (error) {
            console.error(error);
            if (window.app) window.app.showToast("Failed to save.", 'error');
        } finally {
            isSaving = false;
            btn.innerText = oldText;
            btn.disabled = false;
        }
    });
}

function addHistoryThumbnail(src) {
    const grid = document.getElementById('history-thumbs');
    if (!grid) return;
    const thumb = document.createElement('div');
    thumb.className = 'history-thumb-item added-now';
    thumb.innerHTML = `<img src="${src}">`;
    grid.prepend(thumb);
    if (grid.children.length > 3) grid.lastElementChild.remove();
}

/* --------------------
   HISTORY SYSTEM
   -------------------- */
function saveHistory() {
    if (!canvas) return;
    // Clear future history if we're not at the end
    if (historyStep < history.length - 1) {
        history = history.slice(0, historyStep + 1);
    }
    // Save current state
    const state = JSON.stringify(canvas.toJSON());
    history.push(state);
    historyStep++;
    // Limit history to 20 states
    if (history.length > 20) {
        history.shift();
        historyStep--; // Adjust pointer since we removed first item
    }
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        loadHistoryState(history[historyStep]);
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        loadHistoryState(history[historyStep]);
    }
}

function loadHistoryState(json) {
    canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        canvas.getObjects().forEach(obj => {
            if (obj.isGarmentBackground) {
                obj.set({ selectable: false, evented: false });
                canvas.sendToBack(obj);
            }
        });
    });
}

function setupHistoryListener() {
    canvas.on('object:modified', saveHistory);
    canvas.on('object:added', (e) => {
        // if (!e.target.isGarmentBackground) saveHistory();
    });
}

