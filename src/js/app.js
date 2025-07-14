// App State
const AppState = {
    apiKey: localStorage.getItem('openai_api_key') || '',
    isApiKeyValid: false,
    uploadedFiles: [],
    processedImages: [],
    isProcessing: false
};

// DOM Elements
const elements = {
    apiKey: document.getElementById('apiKey'),
    validateApiKey: document.getElementById('validateApiKey'),
    apiStatus: document.getElementById('apiStatus'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadStatus: document.getElementById('uploadStatus'),
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    debugSection: document.getElementById('debugSection'),
    debugContent: document.getElementById('debugContent'),
    debugToggle: document.getElementById('debugToggle'),
    resultsSection: document.getElementById('resultsSection'),
    resultsContainer: document.getElementById('resultsContainer'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    loadingSubtext: document.getElementById('loadingSubtext'),
    exportSection: document.getElementById('exportSection'),
    exportStats: document.getElementById('exportStats'),
    exportStatsContent: document.getElementById('exportStatsContent'),
    copyAllImagePrompts: document.getElementById('copyAllImagePrompts'),
    copyAllVideoPrompts: document.getElementById('copyAllVideoPrompts'),
    copyAllPrompts: document.getElementById('copyAllPrompts'),
    downloadAllPrompts: document.getElementById('downloadAllPrompts')
};

// Debug Console Functions
let isDebugVisible = false;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

function addDebugEntry(message, level = 'info', data = null) {
    if (!elements.debugContent) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `debug-entry ${level}`;
    
    let content = `<span class="debug-timestamp">[${timestamp}]</span><span class="debug-message">${message}</span>`;
    
    if (data) {
        content += `<div class="debug-data">${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}</div>`;
    }
    
    entry.innerHTML = content;
    elements.debugContent.appendChild(entry);
    
    // Auto-scroll to bottom
    elements.debugContent.scrollTop = elements.debugContent.scrollHeight;
    
    // Show debug section when first entry is added
    if (!isDebugVisible) {
        showDebugConsole();
    }
}

function showDebugConsole() {
    elements.debugSection.style.display = 'block';
    isDebugVisible = true;
    elements.debugToggle.textContent = 'Hide Debug';
}

function hideDebugConsole() {
    elements.debugSection.style.display = 'none';
    isDebugVisible = false;
    elements.debugToggle.textContent = 'Show Debug';
}

function clearDebugConsole() {
    elements.debugContent.innerHTML = '';
}

// Override console functions to also log to UI
console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    addDebugEntry(args.join(' '), 'info');
};

console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    addDebugEntry(args.join(' '), 'warning');
};

console.error = function(...args) {
    originalConsoleError.apply(console, args);
    addDebugEntry(args.join(' '), 'error');
};

// Debug-specific functions
function debugLog(message, data = null) {
    addDebugEntry(message, 'debug', data);
    originalConsoleLog(message, data);
}

function successLog(message, data = null) {
    addDebugEntry(message, 'success', data);
    originalConsoleLog(message, data);
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    // Configure PDF.js
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    
    initializeApp();
    setupEventListeners();
    setupDebugConsole();
    setupExportFeatures();
});

function initializeApp() {
    // Load saved API key
    if (AppState.apiKey) {
        elements.apiKey.value = AppState.apiKey;
        showStatus(elements.apiStatus, 'API Key tersimpan di browser', 'info');
    }
    
    debugLog('🚀 App initialized successfully');
}

function setupDebugConsole() {
    // Debug toggle functionality
    elements.debugToggle.addEventListener('click', function() {
        if (isDebugVisible) {
            hideDebugConsole();
        } else {
            showDebugConsole();
        }
    });
    
    debugLog('🔧 Debug console setup completed');
}

// Loading Animation Functions
function showLoading(text = 'Menganalisis file', subtext = 'Mohon tunggu, AI sedang memproses gambar Anda') {
    elements.loadingText.innerHTML = `${text}<span class="loading-dots"></span>`;
    elements.loadingSubtext.textContent = subtext;
    elements.loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

function updateLoadingText(text, subtext = null) {
    elements.loadingText.innerHTML = `${text}<span class="loading-dots"></span>`;
    if (subtext) {
        elements.loadingSubtext.textContent = subtext;
    }
}

// Export Functions
function setupExportFeatures() {
    // Copy All Image Prompts
    elements.copyAllImagePrompts.addEventListener('click', function() {
        copyPromptsToClipboard('image');
    });

    // Copy All Video Prompts
    elements.copyAllVideoPrompts.addEventListener('click', function() {
        copyPromptsToClipboard('video');
    });

    // Copy All Prompts
    elements.copyAllPrompts.addEventListener('click', function() {
        copyPromptsToClipboard('both');
    });

    // Download All Prompts
    elements.downloadAllPrompts.addEventListener('click', function() {
        downloadPromptsAsFile();
    });
}

function copyPromptsToClipboard(type) {
    if (AppState.processedImages.length === 0) {
        alert('Tidak ada prompt untuk disalin!');
        return;
    }

    let content = '';
    let count = 0;

    AppState.processedImages.forEach((result, index) => {
        const itemTitle = getResultTitle(result, index);
        
        if (type === 'image' || type === 'both') {
            content += `=== ${itemTitle} - IMAGE PROMPT ===\n`;
            content += `${result.imagePrompt}\n\n`;
            count++;
        }

        if (type === 'video' || type === 'both') {
            content += `=== ${itemTitle} - VIDEO PROMPT ===\n`;
            content += `${result.videoPrompt}\n\n`;
            count++;
        }
    });

    // Add summary
    const timestamp = new Date().toLocaleString();
    content = `PDF IMAGE TO PROMPT - EXPORTED ${type.toUpperCase()} PROMPTS\n`;
    content += `Generated on: ${timestamp}\n`;
    content += `Total items: ${AppState.processedImages.length}\n`;
    content += `Total prompts: ${count}\n\n`;
    content += `${'='.repeat(50)}\n\n${content}`;

    navigator.clipboard.writeText(content).then(() => {
        // Show success feedback
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '✅ Copied!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
        
        successLog(`📋 ${type.charAt(0).toUpperCase() + type.slice(1)} prompts copied to clipboard`);
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Gagal menyalin ke clipboard. Silakan coba lagi.');
    });
}

function downloadPromptsAsFile() {
    if (AppState.processedImages.length === 0) {
        alert('Tidak ada prompt untuk diunduh!');
        return;
    }

    let content = '';
    const timestamp = new Date().toLocaleString();
    
    // Header
    content += `PDF IMAGE TO PROMPT - COMPLETE EXPORT\n`;
    content += `Generated on: ${timestamp}\n`;
    content += `Total processed images: ${AppState.processedImages.length}\n`;
    content += `${'='.repeat(80)}\n\n`;

    // Content
    AppState.processedImages.forEach((result, index) => {
        const itemTitle = getResultTitle(result, index);
        
        content += `${'-'.repeat(60)}\n`;
        content += `${itemTitle}\n`;
        content += `${'-'.repeat(60)}\n\n`;
        
        content += `DESCRIPTION:\n${result.description}\n\n`;
        
        content += `IMAGE GENERATION PROMPT:\n${result.imagePrompt}\n\n`;
        
        content += `VIDEO GENERATION PROMPT:\n${result.videoPrompt}\n\n`;
    });

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    successLog('💾 Prompts downloaded as text file');
}

function getResultTitle(result, index) {
    if (result.isIndividualImage) {
        if (result.pageNumber) {
            return `Halaman ${result.pageNumber}, Gambar ${result.imageIndex}`;
        } else {
            return `${result.fileName} - Gambar ${result.imageIndex}`;
        }
    } else if (result.pageNumber) {
        return `${result.fileName} - Halaman ${result.pageNumber}`;
    } else {
        return `${result.fileName}`;
    }
}

function updateExportStats() {
    const imagePromptCount = AppState.processedImages.length;
    const videoPromptCount = AppState.processedImages.length;
    const totalPrompts = imagePromptCount + videoPromptCount;

    elements.exportStatsContent.innerHTML = `
        📊 <strong>${AppState.processedImages.length}</strong> images processed<br>
        🖼️ <strong>${imagePromptCount}</strong> image prompts available<br>
        🎬 <strong>${videoPromptCount}</strong> video prompts available<br>
        📋 <strong>${totalPrompts}</strong> total prompts ready for export
    `;
}

function setupEventListeners() {
    // API Key Events
    elements.validateApiKey.addEventListener('click', validateApiKey);
    elements.apiKey.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validateApiKey();
        }
    });

    // Upload Events
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Drag & Drop Events
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        elements.uploadArea.addEventListener(eventName, preventDefaults);
        document.body.addEventListener(eventName, preventDefaults);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragOver(e) {
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    elements.uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    processFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    processFiles(files);
}

function processFiles(files) {
    if (!AppState.isApiKeyValid) {
        showStatus(elements.uploadStatus, 'Harap validasi API Key terlebih dahulu', 'error');
        return;
    }

    const validFiles = Array.from(files).filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (!validTypes.includes(file.type)) {
            showStatus(elements.uploadStatus, `File ${file.name} tidak didukung`, 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            showStatus(elements.uploadStatus, `File ${file.name} terlalu besar (maksimal 50MB)`, 'error');
            return false;
        }
        
        return true;
    });

    if (validFiles.length === 0) {
        showStatus(elements.uploadStatus, 'Tidak ada file valid untuk diproses', 'error');
        return;
    }

    AppState.uploadedFiles = validFiles;
    showStatus(elements.uploadStatus, `${validFiles.length} file berhasil dipilih`, 'success');
    
    // Start processing
    startProcessing();
}

async function validateApiKey() {
    const apiKey = elements.apiKey.value.trim();
    
    if (!apiKey) {
        showStatus(elements.apiStatus, 'Harap masukkan API Key', 'error');
        return;
    }

    elements.validateApiKey.disabled = true;
    elements.validateApiKey.textContent = 'Validating...';
    
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            AppState.apiKey = apiKey;
            AppState.isApiKeyValid = true;
            localStorage.setItem('openai_api_key', apiKey);
            showStatus(elements.apiStatus, 'API Key valid dan tersimpan', 'success');
        } else {
            AppState.isApiKeyValid = false;
            showStatus(elements.apiStatus, 'API Key tidak valid', 'error');
        }
    } catch (error) {
        AppState.isApiKeyValid = false;
        showStatus(elements.apiStatus, 'Error validasi API Key: ' + error.message, 'error');
    } finally {
        elements.validateApiKey.disabled = false;
        elements.validateApiKey.textContent = 'Validate';
    }
}

async function startProcessing() {
    AppState.isProcessing = true;
    elements.progressSection.style.display = 'block';
    elements.resultsSection.style.display = 'none';
    elements.exportSection.style.display = 'none';
    clearDebugConsole(); // Clear previous debug entries
    
    // Show loading animation
    showLoading('Memulai pemrosesan', 'Menyiapkan file untuk analisis AI...');
    
    updateProgress(0);
    showStatus(elements.uploadStatus, 'Memulai pemrosesan file...', 'info');
    debugLog('📁 Starting file processing', { 
        fileCount: AppState.uploadedFiles.length,
        files: AppState.uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    try {
        await processFilesWithOpenAI();
        successLog('✅ File processing completed successfully');
        hideLoading();
    } catch (error) {
        console.error('Processing error:', error);
        showStatus(elements.uploadStatus, 'Error saat memproses file: ' + error.message, 'error');
        AppState.isProcessing = false;
        elements.progressSection.style.display = 'none';
        hideLoading();
    }
}

// Progress tracking state
const ProgressState = {
    totalSteps: 0,
    completedSteps: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    currentOperation: ''
};

function initializeProgress(files) {
    ProgressState.totalFiles = files.length;
    ProgressState.currentFileIndex = 0;
    ProgressState.completedSteps = 0;
    
    // Estimate total steps based on file types
    ProgressState.totalSteps = 0;
    files.forEach(file => {
        if (file.type === 'application/pdf') {
            // For PDF: loading + page analysis + processing (estimated 10 steps per PDF)
            ProgressState.totalSteps += 10;
        } else {
            // For images: analysis + processing (2 steps)
            ProgressState.totalSteps += 2;
        }
    });
    
    updateDetailedProgress(0, 'Memulai pemrosesan...');
}

function updateDetailedProgress(increment = 0, operation = '') {
    if (increment > 0) {
        ProgressState.completedSteps += increment;
    }
    
    if (operation) {
        ProgressState.currentOperation = operation;
    }
    
    const percentage = Math.min((ProgressState.completedSteps / ProgressState.totalSteps) * 100, 100);
    updateProgress(percentage);
    
    const fileInfo = ProgressState.totalFiles > 1 ? 
        ` (File ${ProgressState.currentFileIndex + 1}/${ProgressState.totalFiles})` : '';
    showStatus(elements.uploadStatus, `${ProgressState.currentOperation}${fileInfo}`, 'info');
    
    debugLog(`📊 Progress Update: ${percentage.toFixed(1)}% - ${ProgressState.currentOperation}`, {
        completedSteps: ProgressState.completedSteps,
        totalSteps: ProgressState.totalSteps,
        currentFile: ProgressState.currentFileIndex + 1,
        totalFiles: ProgressState.totalFiles
    });
}

async function processFilesWithOpenAI() {
    const results = [];
    initializeProgress(AppState.uploadedFiles);
    
    for (let i = 0; i < AppState.uploadedFiles.length; i++) {
        const file = AppState.uploadedFiles[i];
        ProgressState.currentFileIndex = i;
        
        updateDetailedProgress(0, `Memproses ${file.name}...`);
        updateLoadingText(`Memproses ${file.name}`, `Menganalisis ${file.type === 'application/pdf' ? 'PDF' : 'gambar'} dengan AI...`);
        
        try {
            if (file.type === 'application/pdf') {
                const pdfResults = await processPDFFile(file);
                results.push(...pdfResults);
            } else {
                updateDetailedProgress(1, `Menganalisis ${file.name}...`);
                updateLoadingText(`Menganalisis ${file.name}`, 'Mendeteksi apakah ini composite image...');
                
                // Try individual image detection for composite images first
                const individualImages = await detectIndividualImagesInFile(file);
                
                if (individualImages && individualImages.length > 1) {
                    // Found multiple individual images - use them
                    updateDetailedProgress(1, `Ditemukan ${individualImages.length} gambar individual dalam ${file.name}`);
                    results.push(...individualImages);
                } else {
                    // Single image or detection failed - process as single image
                    const imageResult = await processImageFile(file);
                    if (imageResult) {
                        results.push(imageResult);
                    }
                    updateDetailedProgress(1, `Selesai memproses ${file.name}`);
                }
            }
        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            showStatus(elements.uploadStatus, `Error memproses ${file.name}: ${error.message}`, 'error');
            updateDetailedProgress(1, `Error: ${file.name}`);
        }
    }
    
    updateDetailedProgress(0, 'Finalisasi hasil...');
    AppState.processedImages = results;
    completeProcessing();
}

async function detectIndividualImagesInFile(file) {
    try {
        debugLog(`🔍 Attempting individual image detection for: ${file.name}`);
        
        // Convert file to base64 for OpenAI analysis
        const base64Image = await convertFileToBase64(file);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this image and determine if it contains multiple individual images, photos, or visual elements that could be processed separately.

IDENTIFY IF THIS IS A COMPOSITE IMAGE CONTAINING:
- Multiple distinct photos or images arranged in a grid or collage
- Separate visual elements that could each be recreated individually
- Different scenes, objects, or subjects that are clearly distinct
- Gallery-style layouts with multiple images

IMPORTANT CRITERIA:
1) Only return multiple elements if they are truly SEPARATE and DISTINCT images
2) Do NOT split single images into parts (e.g., don't separate a person's face from their body)
3) Do NOT treat single scenes with multiple objects as separate images
4) DO identify actual separate photos arranged together (like a photo collage)
5) Each element should be recreatable as an independent image

For each distinct individual image/element you identify, provide:
1) A detailed description of what you see in that specific image
2) A comprehensive AI image generation prompt for DALL-E, Midjourney, or Stable Diffusion
3) A detailed AI video generation prompt for Runway or Pika Labs
4) Mark isMeaningful as true for substantial visual content

If this appears to be a SINGLE image (even with multiple objects), return only 1 element.
If this is clearly a COMPOSITE with multiple distinct images, return multiple elements.

CRITICAL: Return ONLY valid JSON without any markdown formatting, explanations, or code blocks.

Return your response as JSON with this structure:
{
    "totalImages": number,
    "isComposite": boolean,
    "debugInfo": "Brief explanation of what you found",
    "images": [
        {
            "index": number,
            "description": "detailed description",
            "imagePrompt": "detailed image generation prompt",
            "videoPrompt": "detailed video generation prompt",
            "isMeaningful": boolean
        }
    ]
}`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${file.type};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            const cleanContent = cleanJsonResponse(content);
            const analysis = JSON.parse(cleanContent);
            
            debugLog(`📊 Individual Image Detection Results:`, {
                totalImages: analysis.totalImages,
                isComposite: analysis.isComposite,
                debugInfo: analysis.debugInfo
            });

            // Only proceed if it's identified as a composite with multiple meaningful images
            if (!analysis.isComposite || !analysis.images || analysis.images.length <= 1) {
                debugLog(`ℹ️ Not a composite image - processing as single image`);
                return null;
            }

            const results = [];
            const meaningfulImages = analysis.images.filter(img => img.isMeaningful);
            
            debugLog(`🔍 Processing ${meaningfulImages.length} individual images from composite`);
            
            for (let i = 0; i < meaningfulImages.length; i++) {
                const imageData = meaningfulImages[i];
                
                const result = {
                    fileName: file.name,
                    fileType: file.type,
                    description: imageData.description,
                    imagePrompt: imageData.imagePrompt,
                    videoPrompt: imageData.videoPrompt,
                    imageIndex: imageData.index,
                    isIndividualImage: true
                };
                
                results.push(result);
                successLog(`✅ Individual image ${imageData.index}: ${imageData.description.substring(0, 60)}...`);
            }
            
            return results.length > 1 ? results : null;
            
        } catch (parseError) {
            debugLog('⚠️ Failed to parse individual image detection response:', parseError);
            return null;
        }
        
    } catch (error) {
        debugLog('⚠️ Individual image detection failed:', error.message);
        return null;
    }
}

async function processImageFile(file) {
    // Check cache first
    const cacheKey = await generateCacheKey(file);
    const cachedResult = getCachedResult(cacheKey);
    
    if (cachedResult) {
        showStatus(elements.uploadStatus, `Menggunakan cache untuk ${file.name}`, 'info');
        return cachedResult;
    }
    
    const base64Image = await convertFileToBase64(file);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AppState.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this image in detail and create specific prompts for recreating it. Please provide:\n\n1) A comprehensive description of what you see (objects, people, colors, composition, style, mood, lighting, etc.)\n2) A detailed AI image generation prompt optimized for DALL-E, Midjourney, or Stable Diffusion that would recreate this exact image\n3) A detailed AI video generation prompt optimized for Runway or Pika Labs that would create a video based on this image\n4) Determine if this is a meaningful image (not just icons, thumbnails, or insignificant graphics)\n\nIMPORTANT: Make the prompts very specific and detailed. Include art style, colors, composition, lighting, mood, and specific visual elements. The prompts should be comprehensive enough to recreate the image accurately.\n\nCRITICAL: Return ONLY valid JSON without any markdown formatting, explanations, or code blocks. Do not use backticks or code markers.\n\nFormat your response as JSON with keys: description, imagePrompt, videoPrompt, isMeaningful"
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${file.type};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
        const cleanContent = cleanJsonResponse(content);
        const result = JSON.parse(cleanContent);
        
        // Filter out non-meaningful images
        if (!result.isMeaningful) {
            return null;
        }
        
        const processedResult = {
            fileName: file.name,
            fileType: file.type,
            description: result.description,
            imagePrompt: result.imagePrompt,
            videoPrompt: result.videoPrompt
        };
        
        // Cache the result
        setCachedResult(cacheKey, processedResult);
        return processedResult;
    } catch (parseError) {
        console.warn('Failed to parse OpenAI response for image:', parseError);
        console.warn('Raw response:', content);
        
        // Fallback if JSON parsing fails
        const fallbackResult = {
            fileName: file.name,
            fileType: file.type,
            description: content,
            imagePrompt: `Generate an image based on: ${content}`,
            videoPrompt: `Create a video sequence based on: ${content}`
        };
        
        // Cache the fallback result
        setCachedResult(cacheKey, fallbackResult);
        return fallbackResult;
    }
}

async function processPDFFile(file) {
    try {
        updateDetailedProgress(1, `Memuat PDF: ${file.name}...`);
        const pdfBytes = await file.arrayBuffer();
        const results = [];
        
        updateDetailedProgress(1, `Menginisialisasi PDF dengan OpenAI Vision...`);
        
        // Initialize PDF.js
        const loadingTask = pdfjsLib.getDocument({data: pdfBytes});
        const pdfDoc = await loadingTask.promise;
        
        const totalPages = pdfDoc.numPages;
        updateDetailedProgress(1, `PDF dimuat - ${totalPages} halaman terdeteksi`);
        
        // Update total steps based on actual page count
        const stepsPerPage = Math.max(1, Math.floor(7 / totalPages)); // Distribute remaining 7 steps across pages
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            updateDetailedProgress(0, `Menganalisis halaman ${pageNum} dari ${totalPages}...`);
            
            try {
                const page = await pdfDoc.getPage(pageNum);
                updateDetailedProgress(stepsPerPage * 0.3, `Merender halaman ${pageNum}...`);
                
                // Render page as high-quality canvas
                const canvas = await renderPageAsCanvas(page, file.name, pageNum);
                
                if (canvas) {
                    const blob = await canvasToBlob(canvas);
                    const imageFile = new File([blob], `${file.name}_page_${pageNum}.png`, {
                        type: 'image/png'
                    });
                    
                    updateDetailedProgress(stepsPerPage * 0.3, `Mendeteksi gambar pada halaman ${pageNum}...`);
                    const individualImages = await detectAndProcessIndividualImages(imageFile, pageNum);
                    
                    if (individualImages && individualImages.length > 0) {
                        updateDetailedProgress(stepsPerPage * 0.4, `Ditemukan ${individualImages.length} gambar pada halaman ${pageNum}`);
                        results.push(...individualImages);
                    } else {
                        // Fallback: Process entire page as single image
                        updateDetailedProgress(stepsPerPage * 0.2, `Memproses halaman ${pageNum} sebagai satu gambar...`);
                        const result = await processImageWithOpenAI(imageFile, pageNum);
                        if (result) {
                            results.push(result);
                        }
                        updateDetailedProgress(stepsPerPage * 0.2, `Selesai memproses halaman ${pageNum}`);
                    }
                }
                
            } catch (pageError) {
                console.error(`Error processing page ${pageNum}:`, pageError);
                updateDetailedProgress(stepsPerPage, `Error pada halaman ${pageNum}`);
                continue;
            }
        }
        
        updateDetailedProgress(0, `Selesai memproses PDF: ${file.name}`);
        return results;
    } catch (error) {
        console.error('PDF processing error:', error);
        throw new Error(`Gagal memproses PDF: ${error.message}`);
    }
}

async function processImageWithOpenAI(imageFile, pageNum) {
    try {
        // Check cache first
        const cacheKey = await generateCacheKey(imageFile);
        const cachedResult = getCachedResult(cacheKey);
        
        if (cachedResult) {
            showStatus(elements.uploadStatus, `Menggunakan cache untuk halaman ${pageNum}`, 'info');
            return cachedResult;
        }
        
        const base64Image = await convertFileToBase64(imageFile);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this page from a PDF document in detail. Please provide:

1) A comprehensive description of what you see (text content, images, diagrams, tables, layouts, visual elements, etc.)
2) A detailed AI image generation prompt optimized for DALL-E, Midjourney, or Stable Diffusion that would recreate this exact page/visual content
3) A detailed AI video generation prompt optimized for Runway or Pika Labs that would create a video based on this page content
4) Determine if this page contains meaningful visual content (not just plain text or blank pages)

IMPORTANT: Make the prompts very specific and detailed. For the image prompt, include:
- Layout and composition details
- Color schemes and typography
- Specific visual elements, diagrams, or illustrations
- Style and formatting details
- Any visual hierarchy or design elements

For the video prompt, describe:
- How the content could be animated or presented
- Transitions and visual effects
- Camera movements or focus changes
- Any dynamic elements that could be emphasized

CRITICAL: Return ONLY valid JSON without any markdown formatting, explanations, or code blocks. Do not use backticks or code markers.

Format your response as JSON with keys: description, imagePrompt, videoPrompt, isMeaningful`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${imageFile.type};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1200
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            const cleanContent = cleanJsonResponse(content);
            const result = JSON.parse(cleanContent);
            
            // Process all pages, not just meaningful ones for PDFs
            const processedResult = {
                fileName: imageFile.name,
                fileType: imageFile.type,
                description: result.description,
                imagePrompt: result.imagePrompt,
                videoPrompt: result.videoPrompt,
                pageNumber: pageNum
            };
            
            // Cache the result
            setCachedResult(cacheKey, processedResult);
            return processedResult;
            
        } catch (parseError) {
            console.warn('Failed to parse OpenAI response for PDF page:', parseError);
            console.warn('Raw response:', content);
            
            // Fallback if JSON parsing fails
            const fallbackResult = {
                fileName: imageFile.name,
                fileType: imageFile.type,
                description: content,
                imagePrompt: `Generate an image based on the content of this PDF page: ${content}`,
                videoPrompt: `Create a video sequence based on this PDF page content: ${content}`,
                pageNumber: pageNum
            };
            
            // Cache the fallback result
            setCachedResult(cacheKey, fallbackResult);
            return fallbackResult;
        }
        
    } catch (error) {
        console.error('Error processing image with OpenAI:', error);
        return null;
    }
}

async function renderPageAsCanvas(page, fileName, pageNum) {
    try {
        const scale = 2.0; // Higher scale for better quality
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        return canvas;
        
    } catch (error) {
        console.error('Error rendering page as canvas:', error);
        return null;
    }
}

async function canvasToBlob(canvas) {
    return new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png', 0.95);
    });
}

function cleanJsonResponse(content) {
    // Clean the response - remove markdown formatting if present
    let cleanContent = content.trim();
    
    // Remove ```json and ``` markers if present
    if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return cleanContent;
}

async function detectAndProcessIndividualImages(pageImageFile, pageNum) {
    try {
        // First, ask OpenAI to analyze the page and identify individual images
        const base64Image = await convertFileToBase64(pageImageFile);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this PDF page and identify ALL visual content that could be recreated with AI. Be comprehensive for stock photos, thumbnails, and artistic content.

IDENTIFY ALL THESE TYPES OF VISUAL CONTENT:
- Photos and illustrations (including thumbnails and previews)
- Stock photos and professional photography
- Artwork, designs, and creative visuals
- Charts, graphs, diagrams, and data visualizations
- Screenshots and interface elements
- Logos, graphics, and visual designs
- Infographics and text-with-visual layouts
- Drawings, sketches, and artistic elements
- Any visual content with shape, color, or design
- Thumbnails, previews, and image galleries
- Colorful backgrounds and visual patterns

IMPORTANT INSTRUCTIONS:
1) Include ALL photos, illustrations, and stock images regardless of size
2) Include thumbnails, previews, and gallery images
3) Include artistic elements, designs, and visual patterns
4) ONLY exclude obvious navigation elements (page numbers, tiny dots, separators)
5) Mark isMeaningful as true for ANY visual content that has artistic or photographic value
6) Be especially inclusive for stock photo collections and image galleries

For each visual element you identify, provide:
1) A detailed description of what you see
2) A comprehensive AI image generation prompt for DALL-E, Midjourney, or Stable Diffusion
3) A detailed AI video generation prompt for Runway or Pika Labs
4) Mark isMeaningful as true for visual content, false only for pure text or navigation elements

CRITICAL: Return ONLY valid JSON without any markdown formatting, explanations, or code blocks. Do not use backticks or code markers.

Return your response as JSON with this structure:
{
    "totalImages": number,
    "debugInfo": "Brief explanation of what types of elements were found",
    "images": [
        {
            "index": number,
            "description": "detailed description",
            "imagePrompt": "detailed image generation prompt",
            "videoPrompt": "detailed video generation prompt",
            "isMeaningful": boolean
        }
    ]
}`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${pageImageFile.type};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
            const cleanContent = cleanJsonResponse(content);
            const analysis = JSON.parse(cleanContent);
            const results = [];
            
            // Log debug info if available
            if (analysis.debugInfo) {
                console.log(`Page ${pageNum} Detection Debug:`, analysis.debugInfo);
                showStatus(elements.uploadStatus, `Halaman ${pageNum}: ${analysis.debugInfo}`, 'info');
            }
            
            // Show detection statistics
            const totalFound = analysis.totalImages || 0;
            const meaningfulCount = analysis.images ? analysis.images.filter(img => img.isMeaningful).length : 0;
            console.log(`Page ${pageNum}: Found ${totalFound} elements, processing ${meaningfulCount} meaningful images`);
            
            // Enhanced debug logging - show all detected elements
            if (analysis.images && analysis.images.length > 0) {
                debugLog(`📊 Page ${pageNum} - Detection Summary`, {
                    totalFound: totalFound,
                    meaningfulCount: meaningfulCount,
                    debugInfo: analysis.debugInfo
                });
                
                debugLog(`🔍 Page ${pageNum} - All detected elements:`, analysis.images.map(img => ({
                    index: img.index,
                    meaningful: img.isMeaningful,
                    descLength: img.description?.length || 0,
                    description: img.description?.substring(0, 80) + '...'
                })));
            }
            
            if (analysis.images && analysis.images.length > 0) {
                // Process each identified image with more inclusive criteria
                for (let i = 0; i < analysis.images.length; i++) {
                    const imageData = analysis.images[i];
                    
                    // Smart processing - include meaningful content, filter only obvious decorative elements
                    const description = imageData.description?.toLowerCase() || '';
                    
                    // Include meaningful images and substantial visual content
                    const shouldInclude = imageData.isMeaningful || 
                                        imageData.description.length > 20 ||
                                        (description.includes('photograph') || description.includes('photo')) ||
                                        (description.includes('image') || description.includes('picture')) ||
                                        (description.includes('landscape') || description.includes('mountain')) ||
                                        (description.includes('chart') || description.includes('graph')) ||
                                        (description.includes('diagram') || description.includes('illustration')) ||
                                        (description.includes('stock') || description.includes('thumbnail')) ||
                                        (description.includes('colorful') || description.includes('visual')) ||
                                        (description.includes('artwork') || description.includes('design'));
                    
                    // Only exclude clearly decorative or navigation elements
                    const shouldExclude = (description.includes('bullet point') && description.includes('tiny')) ||
                                        (description.includes('separator') && description.includes('line')) ||
                                        (description.includes('small') && description.includes('dot')) ||
                                        (description.includes('tiny') && description.includes('icon') && description.includes('grey')) ||
                                        description.includes('page number') ||
                                        description.includes('navigation');
                    
                    if (shouldInclude && !shouldExclude) {
                        const result = {
                            fileName: pageImageFile.name,
                            fileType: pageImageFile.type,
                            description: imageData.description,
                            imagePrompt: imageData.imagePrompt,
                            videoPrompt: imageData.videoPrompt,
                            pageNumber: pageNum,
                            imageIndex: imageData.index,
                            isIndividualImage: true
                        };
                        
                        results.push(result);
                        successLog(`✅ Page ${pageNum}: INCLUDED element ${imageData.index}`, {
                            description: imageData.description.substring(0, 80),
                            isMeaningful: imageData.isMeaningful,
                            descLength: imageData.description?.length || 0
                        });
                    } else {
                        // Log what was filtered out with filtering reason
                        const filterReason = shouldExclude ? 'decorative/small element' : 'not meaningful enough';
                        debugLog(`❌ Page ${pageNum}: FILTERED OUT element ${imageData.index} (${filterReason})`, {
                            description: imageData.description,
                            isMeaningful: imageData.isMeaningful,
                            descLength: imageData.description?.length || 0,
                            shouldInclude: shouldInclude,
                            shouldExclude: shouldExclude
                        });
                    }
                }
            }
            
            return results;
            
        } catch (parseError) {
            console.warn('Failed to parse OpenAI response for individual images:', parseError);
            console.warn('Raw response:', content);
            return [];
        }
        
    } catch (error) {
        console.warn(`Failed to detect individual images from page ${pageNum}:`, error);
        return [];
    }
}



function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function updateProgress(percentage) {
    elements.progressFill.style.width = percentage + '%';
    elements.progressText.textContent = percentage + '%';
}

function completeProcessing() {
    AppState.isProcessing = false;
    
    // Ensure 100% progress before completing
    updateProgress(100);
    updateDetailedProgress(0, 'Pemrosesan selesai - Menampilkan hasil...');
    
    // Small delay to show completion
    setTimeout(() => {
        elements.progressSection.style.display = 'none';
        elements.resultsSection.style.display = 'block';
        
        // Show export section if we have results
        if (AppState.processedImages.length > 0) {
            elements.exportSection.style.display = 'block';
            updateExportStats();
        }
        
        showStatus(elements.uploadStatus, `Pemrosesan selesai - ${AppState.processedImages.length} gambar berhasil diproses`, 'success');
        successLog(`🎉 Processing completed successfully - ${AppState.processedImages.length} images processed`);
        
        // Generate sample results
        generateSampleResults();
    }, 500);
}

function generateSampleResults() {
    if (AppState.processedImages.length === 0) {
        elements.resultsContainer.innerHTML = '<p>Tidak ada gambar bermakna yang berhasil diproses.</p>';
        return;
    }
    
    displayResults(AppState.processedImages);
}

function createResultsSummary(results) {
    const summary = document.createElement('div');
    summary.className = 'results-summary';
    
    // Count individual images vs page images
    const individualImages = results.filter(r => r.isIndividualImage);
    const pageImages = results.filter(r => !r.isIndividualImage);
    
    let summaryText = `<h3>📊 Ringkasan Hasil</h3>`;
    
    if (individualImages.length > 0) {
        // Distinguish between PDF and regular image sources
        const fromPdf = individualImages.filter(img => img.pageNumber);
        const fromRegularImages = individualImages.filter(img => !img.pageNumber);
        
        if (fromPdf.length > 0) {
            summaryText += `<p>✅ Berhasil mengidentifikasi dan memproses <strong>${fromPdf.length}</strong> gambar individual dari PDF.</p>`;
            
            // Show breakdown by pages
            const pageBreakdown = {};
            fromPdf.forEach(img => {
                const page = img.pageNumber || 1;
                pageBreakdown[page] = (pageBreakdown[page] || 0) + 1;
            });
            
            const pageDetails = Object.entries(pageBreakdown)
                .map(([page, count]) => `Halaman ${page}: ${count} gambar`)
                .join(', ');
            summaryText += `<p>📊 Detail per halaman: ${pageDetails}</p>`;
        }
        
        if (fromRegularImages.length > 0) {
            summaryText += `<p>✅ Berhasil mengidentifikasi dan memproses <strong>${fromRegularImages.length}</strong> gambar individual dari composite image.</p>`;
            
            // Group by source file
            const fileBreakdown = {};
            fromRegularImages.forEach(img => {
                const fileName = img.fileName;
                fileBreakdown[fileName] = (fileBreakdown[fileName] || 0) + 1;
            });
            
            const fileDetails = Object.entries(fileBreakdown)
                .map(([fileName, count]) => `${fileName}: ${count} gambar`)
                .join(', ');
            summaryText += `<p>📊 Detail per file: ${fileDetails}</p>`;
        }
        
        summaryText += `<p>💡 <strong>Tip:</strong> Jika Anda mengharapkan lebih banyak gambar, periksa console browser (F12) untuk melihat detail deteksi gambar.</p>`;
    }
    
    if (pageImages.length > 0) {
        summaryText += `<p>📄 Memproses <strong>${pageImages.length}</strong> halaman sebagai gambar utuh.</p>`;
    }
    
    summaryText += `<p>🎯 Total: <strong>${results.length}</strong> hasil dengan prompt yang spesifik dan teroptimasi.</p>`;
    summaryText += `<p>💡 Setiap prompt dirancang khusus untuk memberikan hasil terbaik pada platform AI generation.</p>`;
    summaryText += `<p>🔍 Periksa console browser (F12) untuk detail deteksi yang lebih lengkap.</p>`;
    
    summary.innerHTML = summaryText;
    return summary;
}

function displayResults(results) {
    elements.resultsContainer.innerHTML = '';
    
    // Add summary first
    const summary = createResultsSummary(results);
    elements.resultsContainer.appendChild(summary);
    
    results.forEach((result, index) => {
        const resultElement = createResultElement(result, index);
        elements.resultsContainer.appendChild(resultElement);
    });
}

function createResultElement(result, index) {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    // Preview section removed as requested - not useful
    
    // Show page number and image index if it's from a PDF
    let titleText = `📁 ${result.fileName}`;
    let itemNumber = `Item ${index + 1}`;
    
    if (result.isIndividualImage) {
        if (result.pageNumber) {
            // Individual image from PDF
            titleText = `🖼️ ${result.fileName} - Gambar ${result.imageIndex}`;
            itemNumber = `Hal ${result.pageNumber}, Gambar ${result.imageIndex}`;
        } else {
            // Individual image from composite image
            titleText = `🖼️ ${result.fileName} - Gambar ${result.imageIndex}`;
            itemNumber = `Gambar ${result.imageIndex} dari ${result.fileName}`;
        }
    } else if (result.pageNumber) {
        titleText = `📄 ${result.fileName} - Halaman ${result.pageNumber}`;
        itemNumber = `Halaman ${result.pageNumber}`;
    }
    
    div.innerHTML = `
        <div class="result-header">
            <h3>${titleText}</h3>
            <span class="item-number">${itemNumber}</span>
        </div>
        
        <div class="prompt-section">
            <h4>📝 Deskripsi Gambar</h4>
            <div class="prompt-text description-text">${result.description}</div>
        </div>
        
        <div class="prompt-section">
            <h4>🎨 Prompt untuk Image Generation</h4>
            <p class="prompt-subtitle">Gunakan prompt ini untuk DALL-E, Midjourney, atau Stable Diffusion:</p>
            <div class="prompt-text image-prompt">${result.imagePrompt}</div>
            <button class="copy-button" onclick="copyToClipboard('${escapeQuotes(result.imagePrompt)}', this)">Copy Image Prompt</button>
        </div>
        
        <div class="prompt-section">
            <h4>🎬 Prompt untuk Video Generation</h4>
            <p class="prompt-subtitle">Gunakan prompt ini untuk Runway, Pika Labs, atau AI video generator lainnya:</p>
            <div class="prompt-text video-prompt">${result.videoPrompt}</div>
            <button class="copy-button" onclick="copyToClipboard('${escapeQuotes(result.videoPrompt)}', this)">Copy Video Prompt</button>
        </div>
    `;
    
    return div;
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#e74c3c';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Utility Functions
// Caching Functions
async function generateCacheKey(file) {
    const fileContent = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileContent);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${file.name}_${file.size}_${hashHex}`;
}

function getCachedResult(cacheKey) {
    try {
        const cached = localStorage.getItem(`cache_${cacheKey}`);
        if (cached) {
            const parsedCache = JSON.parse(cached);
            const now = Date.now();
            
            // Cache expires after 24 hours
            if (now - parsedCache.timestamp < 24 * 60 * 60 * 1000) {
                return parsedCache.result;
            } else {
                // Remove expired cache
                localStorage.removeItem(`cache_${cacheKey}`);
            }
        }
    } catch (error) {
        console.error('Error reading cache:', error);
    }
    return null;
}

function setCachedResult(cacheKey, result) {
    try {
        const cacheData = {
            timestamp: Date.now(),
            result: result
        };
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error setting cache:', error);
        // If storage is full, clear old cache entries
        clearOldCache();
    }
}

function clearOldCache() {
    try {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        
        cacheKeys.forEach(key => {
            try {
                const cached = JSON.parse(localStorage.getItem(key));
                const now = Date.now();
                
                // Remove entries older than 24 hours
                if (now - cached.timestamp > 24 * 60 * 60 * 1000) {
                    localStorage.removeItem(key);
                }
            } catch (error) {
                // Remove corrupted cache entries
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}

function escapeQuotes(text) {
    return text.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}