// App State
const AppState = {
    apiProvider: localStorage.getItem('api_provider') || 'openai',
    openaiApiKey: localStorage.getItem('openai_api_key') || '',
    geminiApiKey: localStorage.getItem('gemini_api_key') || '',
    openrouterApiKey: localStorage.getItem('openrouter_api_key') || '',
    openrouterModel: localStorage.getItem('openrouter_model') || 'google/gemini-flash-1.5',
    isApiKeyValid: false,
    uploadedFiles: [],
    processedImages: [],
    isProcessing: false
};

// DOM Elements
const elements = {
    // API Elements
    openaiApiKey: document.getElementById('openaiApiKey'),
    geminiApiKey: document.getElementById('geminiApiKey'),
    openrouterApiKey: document.getElementById('openrouterApiKey'),
    openrouterModel: document.getElementById('openrouterModel'),
    validateOpenaiKey: document.getElementById('validateOpenaiKey'),
    validateGeminiKey: document.getElementById('validateGeminiKey'),
    validateOpenrouterKey: document.getElementById('validateOpenrouterKey'),
    openaiStatus: document.getElementById('openaiStatus'),
    geminiStatus: document.getElementById('geminiStatus'),
    openrouterStatus: document.getElementById('openrouterStatus'),
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    pasteArea: document.getElementById('pasteArea'),
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
    downloadImagePrompts: document.getElementById('downloadImagePrompts'),
    downloadVideoPrompts: document.getElementById('downloadVideoPrompts'),
    downloadAllPrompts: document.getElementById('downloadAllPrompts'),
    floatingDonation: document.getElementById('floatingDonation'),
    guideSection: document.getElementById('guideSection'),
    hideGuideBtn: document.getElementById('hideGuideBtn')
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
    // Load saved API keys
    if (AppState.openaiApiKey) {
        elements.openaiApiKey.value = AppState.openaiApiKey;
        showStatus(elements.openaiStatus, 'OpenAI API Key tersimpan di browser', 'info');
    }
    
    if (AppState.geminiApiKey) {
        elements.geminiApiKey.value = AppState.geminiApiKey;
        showStatus(elements.geminiStatus, 'Gemini API Key tersimpan di browser', 'info');
    }
    
    if (AppState.openrouterApiKey) {
        elements.openrouterApiKey.value = AppState.openrouterApiKey;
        showStatus(elements.openrouterStatus, 'OpenRouter API Key tersimpan di browser', 'info');
    }
    
    // Load saved OpenRouter model
    if (AppState.openrouterModel && elements.openrouterModel) {
        elements.openrouterModel.value = AppState.openrouterModel;
    }
    
    // Setup API tabs
    setupApiTabs();
    
    debugLog('🚀 App initialized successfully');
    
    // Setup floating donation button
    setupFloatingDonation();
}

function setupApiTabs() {
    const tabs = document.querySelectorAll('.api-tab');
    const panels = document.querySelectorAll('.api-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const provider = this.dataset.provider;
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update panels
            panels.forEach(p => p.classList.remove('active'));
            document.getElementById(provider + 'Panel').classList.add('active');
            
            // Update app state
            AppState.apiProvider = provider;
            localStorage.setItem('api_provider', provider);
            
            debugLog(`🔄 Switched to ${provider} API provider`);
        });
    });
    
    // Set initial active tab based on saved preference without triggering click event
    const activeTab = document.querySelector(`[data-provider="${AppState.apiProvider}"]`);
    if (activeTab) {
        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        activeTab.classList.add('active');
        
        // Update panels
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById(AppState.apiProvider + 'Panel').classList.add('active');
    }
}

// Floating Donation Button
function setupFloatingDonation() {
    let lastScrollTop = 0;
    let isVisible = false;

    function showFloatingButton() {
        if (!isVisible) {
            elements.floatingDonation.classList.add('visible');
            isVisible = true;
        }
    }

    function hideFloatingButton() {
        if (isVisible) {
            elements.floatingDonation.classList.remove('visible');
            isVisible = false;
        }
    }

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Show button after scrolling down 200px
        if (scrollTop > 200) {
            showFloatingButton();
        } else {
            hideFloatingButton();
        }
        
        lastScrollTop = scrollTop;
    });

    // Show button when results are visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const resultsSection = elements.resultsSection;
                if (resultsSection.style.display !== 'none' && !isVisible) {
                    setTimeout(showFloatingButton, 1000); // Show after 1 second when results appear
                }
            }
        });
    });

    if (elements.resultsSection) {
        observer.observe(elements.resultsSection, { attributes: true });
    }
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
    elements.copyAllImagePrompts.addEventListener('click', function(event) {
        copyPromptsToClipboard('image', event);
    });

    // Copy All Video Prompts
    elements.copyAllVideoPrompts.addEventListener('click', function(event) {
        copyPromptsToClipboard('video', event);
    });

    // Download Image Prompts Only
    elements.downloadImagePrompts.addEventListener('click', function() {
        downloadPromptsAsFile('image');
    });

    // Download Video Prompts Only
    elements.downloadVideoPrompts.addEventListener('click', function() {
        downloadPromptsAsFile('video');
    });

    // Download All Prompts
    elements.downloadAllPrompts.addEventListener('click', function() {
        downloadPromptsAsFile('complete');
    });

    // Guide Section Toggle
    if (elements.hideGuideBtn) {
        elements.hideGuideBtn.addEventListener('click', function() {
            toggleGuideSection();
        });
    }

    // Allow clicking on collapsed guide header to expand
    if (elements.guideSection) {
        elements.guideSection.addEventListener('click', function(e) {
            if (elements.guideSection.classList.contains('collapsed') && e.target.tagName === 'H2') {
                toggleGuideSection();
            }
        });
    }
}

function getAllVariantPrompts(type) {
    const variants = [];
    
    try {
        const variantContainers = document.querySelectorAll('.variants-container');
        
        variantContainers.forEach(container => {
            const promptSection = container.closest('.prompt-section');
            if (!promptSection) return;
            
            const isImageSection = promptSection.querySelector('.image-prompt');
            const isVideoSection = promptSection.querySelector('.video-prompt');
            
            // Check if this container matches the requested type
            if ((type === 'image' && isImageSection) || (type === 'video' && isVideoSection) || type === 'both') {
                const variantItems = container.querySelectorAll('.variant-item .prompt-text');
                variantItems.forEach(item => {
                    if (item && item.textContent) {
                        variants.push(item.textContent.trim());
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error in getAllVariantPrompts:', error);
    }
    
    return variants;
}

function copyPromptsToClipboard(type, event) {
    if (AppState.processedImages.length === 0) {
        alert('Tidak ada prompt untuk disalin!');
        return;
    }

    let content = '';
    let count = 0;

    // Add original prompts
    AppState.processedImages.forEach((result, index) => {
        if (type === 'image' || type === 'both') {
            content += `${result.imagePrompt}\n\n`;
            count++;
        }

        if (type === 'video' || type === 'both') {
            content += `${result.videoPrompt}\n\n`;
            count++;
        }
    });
    
    // Add variant prompts
    const imageVariants = getAllVariantPrompts('image');
    const videoVariants = getAllVariantPrompts('video');
    
    if (type === 'image' || type === 'both') {
        imageVariants.forEach(variant => {
            content += `${variant}\n\n`;
            count++;
        });
    }
    
    if (type === 'video' || type === 'both') {
        videoVariants.forEach(variant => {
            content += `${variant}\n\n`;
            count++;
        });
    }

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
        
        const variantInfo = imageVariants.length + videoVariants.length > 0 ? ` (including ${imageVariants.length + videoVariants.length} variants)` : '';
        successLog(`📋 ${type.charAt(0).toUpperCase() + type.slice(1)} prompts copied to clipboard${variantInfo}`);
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert('Gagal menyalin ke clipboard. Silakan coba lagi.');
    });
}

function downloadPromptsAsFile(type = 'complete') {
    if (AppState.processedImages.length === 0) {
        alert('Tidak ada prompt untuk diunduh!');
        return;
    }

    let content = '';
    let filename = '';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    // Get variant prompts
    const imageVariants = getAllVariantPrompts('image');
    const videoVariants = getAllVariantPrompts('video');
    
    if (type === 'image') {
        // Simple newline-separated image prompts
        AppState.processedImages.forEach((result, index) => {
            content += result.imagePrompt + '\n';
        });
        
        // Add image variants
        imageVariants.forEach(variant => {
            content += variant + '\n';
        });
        
        filename = `image_prompts_${timestamp}.txt`;
        const totalCount = AppState.processedImages.length + imageVariants.length;
        const variantInfo = imageVariants.length > 0 ? ` (including ${imageVariants.length} variants)` : '';
        successLog(`💾 Downloaded ${totalCount} image prompts${variantInfo}`);
        
    } else if (type === 'video') {
        // Simple newline-separated video prompts
        AppState.processedImages.forEach((result, index) => {
            content += result.videoPrompt + '\n';
        });
        
        // Add video variants
        videoVariants.forEach(variant => {
            content += variant + '\n';
        });
        
        filename = `video_prompts_${timestamp}.txt`;
        const totalCount = AppState.processedImages.length + videoVariants.length;
        const variantInfo = videoVariants.length > 0 ? ` (including ${videoVariants.length} variants)` : '';
        successLog(`💾 Downloaded ${totalCount} video prompts${variantInfo}`);
        
    } else {
        // Complete detailed export (original format)
        const fullTimestamp = new Date().toLocaleString();
        
        // Header
        content += `PDF IMAGE TO PROMPT - COMPLETE EXPORT\n`;
        content += `Generated on: ${fullTimestamp}\n`;
        content += `Total processed images: ${AppState.processedImages.length}\n`;
        content += `Total image variants: ${imageVariants.length}\n`;
        content += `Total video variants: ${videoVariants.length}\n`;
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
        
        // Add variants section if any exist
        if (imageVariants.length > 0 || videoVariants.length > 0) {
            content += `${'='.repeat(80)}\n`;
            content += `GENERATED VARIANTS\n`;
            content += `${'='.repeat(80)}\n\n`;
            
            if (imageVariants.length > 0) {
                content += `IMAGE PROMPT VARIANTS (${imageVariants.length}):\n`;
                content += `${'-'.repeat(40)}\n`;
                imageVariants.forEach((variant, index) => {
                    content += `${index + 1}. ${variant}\n\n`;
                });
            }
            
            if (videoVariants.length > 0) {
                content += `VIDEO PROMPT VARIANTS (${videoVariants.length}):\n`;
                content += `${'-'.repeat(40)}\n`;
                videoVariants.forEach((variant, index) => {
                    content += `${index + 1}. ${variant}\n\n`;
                });
            }
        }
        
        filename = `complete_prompts_${timestamp}.txt`;
        const totalVariants = imageVariants.length + videoVariants.length;
        const variantInfo = totalVariants > 0 ? ` and ${totalVariants} variants` : '';
        successLog(`💾 Downloaded complete export with ${AppState.processedImages.length} results${variantInfo}`);
    }

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function toggleGuideSection() {
    if (!elements.guideSection || !elements.hideGuideBtn) return;
    
    const isCollapsed = elements.guideSection.classList.contains('collapsed');
    
    if (isCollapsed) {
        elements.guideSection.classList.remove('collapsed');
        elements.hideGuideBtn.textContent = '⬆️ Sembunyikan Panduan';
        successLog('📚 User guide expanded');
    } else {
        elements.guideSection.classList.add('collapsed');
        elements.hideGuideBtn.textContent = '⬇️ Tampilkan Panduan';
        successLog('📚 User guide collapsed');
    }
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
    // Check if elements.exportStatsContent exists before updating
    if (!elements.exportStatsContent) {
        return;
    }
    
    const imagePromptCount = AppState.processedImages.length;
    const videoPromptCount = AppState.processedImages.length;
    
    // Get variant counts safely
    let imageVariants = [];
    let videoVariants = [];
    
    try {
        imageVariants = getAllVariantPrompts('image');
        videoVariants = getAllVariantPrompts('video');
    } catch (error) {
        console.warn('Error getting variant prompts:', error);
    }
    
    const totalOriginalPrompts = imagePromptCount + videoPromptCount;
    const totalVariants = imageVariants.length + videoVariants.length;
    const grandTotal = totalOriginalPrompts + totalVariants;

    elements.exportStatsContent.innerHTML = `
        📊 <strong>${AppState.processedImages.length}</strong> images processed<br>
        🖼️ <strong>${imagePromptCount}</strong> image prompts + <strong>${imageVariants.length}</strong> variants<br>
        🎬 <strong>${videoPromptCount}</strong> video prompts + <strong>${videoVariants.length}</strong> variants<br>
        📋 <strong>${grandTotal}</strong> total prompts ready for export<br><br>
        💡 <strong>Export Options:</strong><br>
        • Individual TXT files with simple newline format<br>
        • Complete detailed export with descriptions<br>
        • All exports now include generated variants
    `;
}

function setupEventListeners() {
    // API Key Events - OpenAI
    elements.validateOpenaiKey.addEventListener('click', () => validateApiKey('openai'));
    elements.openaiApiKey.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validateApiKey('openai');
        }
    });
    
    // API Key Events - Gemini
    elements.validateGeminiKey.addEventListener('click', () => validateApiKey('gemini'));
    elements.geminiApiKey.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validateApiKey('gemini');
        }
    });
    
    // API Key Events - OpenRouter
    elements.validateOpenrouterKey.addEventListener('click', () => validateApiKey('openrouter'));
    elements.openrouterApiKey.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            validateApiKey('openrouter');
        }
    });
    
    // OpenRouter Model Selection
    elements.openrouterModel.addEventListener('change', function() {
        AppState.openrouterModel = this.value;
        localStorage.setItem('openrouter_model', this.value);
        debugLog(`🔄 OpenRouter model changed to: ${this.value}`);
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

    // Clipboard Events
    elements.pasteArea.addEventListener('click', () => {
        elements.pasteArea.focus();
        showStatus(elements.uploadStatus, 'Area paste difokuskan. Tekan Ctrl+V untuk paste gambar', 'info');
    });
    
    // Global paste event listener
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'v') {
            elements.pasteArea.classList.add('paste-active');
            setTimeout(() => {
                elements.pasteArea.classList.remove('paste-active');
            }, 300);
        }
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

function handlePaste(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    const items = clipboardData.items;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.indexOf('image') !== -1) {
            e.preventDefault();
            
            const blob = item.getAsFile();
            const fileName = `pasted-image-${Date.now()}.${item.type.split('/')[1]}`;
            
            // Create a File object from the blob with a proper name
            const file = new File([blob], fileName, { type: item.type });
            
            showStatus(elements.uploadStatus, `Gambar dari clipboard berhasil di-paste: ${fileName}`, 'success');
            debugLog(`📋 Image pasted from clipboard: ${fileName} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
            
            // Process the pasted image
            processFiles([file]);
            
            // Visual feedback
            elements.pasteArea.classList.add('paste-active');
            setTimeout(() => {
                elements.pasteArea.classList.remove('paste-active');
            }, 1000);
            
            break;
        }
    }
    
    // If no image found in clipboard
    if (!Array.from(items).some(item => item.type.indexOf('image') !== -1)) {
        showStatus(elements.uploadStatus, 'Clipboard tidak mengandung gambar. Copy gambar terlebih dahulu dari browser lain.', 'warning');
    }
}

function processFiles(files) {
    if (!isCurrentProviderValid()) {
        showStatus(elements.uploadStatus, `Harap validasi ${AppState.apiProvider.toUpperCase()} API Key terlebih dahulu`, 'error');
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

async function validateApiKey(provider) {
    let apiKeyElement, statusElement, buttonElement;
    
    switch (provider) {
        case 'openai':
            apiKeyElement = elements.openaiApiKey;
            statusElement = elements.openaiStatus;
            buttonElement = elements.validateOpenaiKey;
            break;
        case 'gemini':
            apiKeyElement = elements.geminiApiKey;
            statusElement = elements.geminiStatus;
            buttonElement = elements.validateGeminiKey;
            break;
        case 'openrouter':
            apiKeyElement = elements.openrouterApiKey;
            statusElement = elements.openrouterStatus;
            buttonElement = elements.validateOpenrouterKey;
            break;
        default:
            console.error('Unknown provider:', provider);
            return;
    }
    
    const apiKey = apiKeyElement.value.trim();
    
    if (!apiKey) {
        showStatus(statusElement, 'Harap masukkan API Key', 'error');
        return;
    }

    buttonElement.disabled = true;
    buttonElement.textContent = 'Validating...';
    
    try {
        let response;
        
        if (provider === 'openai') {
            response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
        } else if (provider === 'gemini') {
            // Gemini API validation
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } else if (provider === 'openrouter') {
            // OpenRouter API validation
            response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
        }

        if (response.ok) {
            if (provider === 'openai') {
                AppState.openaiApiKey = apiKey;
                localStorage.setItem('openai_api_key', apiKey);
                showStatus(statusElement, 'OpenAI API Key valid! Siap untuk memproses gambar', 'success');
                debugLog('✅ OpenAI API Key validated successfully');
            } else if (provider === 'gemini') {
                AppState.geminiApiKey = apiKey;
                localStorage.setItem('gemini_api_key', apiKey);
                showStatus(statusElement, 'Gemini API Key valid! Siap untuk memproses gambar', 'success');
                debugLog('✅ Gemini API Key validated successfully');
            } else if (provider === 'openrouter') {
                AppState.openrouterApiKey = apiKey;
                localStorage.setItem('openrouter_api_key', apiKey);
                showStatus(statusElement, 'OpenRouter API Key valid! Siap untuk memproses gambar', 'success');
                debugLog('✅ OpenRouter API Key validated successfully');
            }
            
            // Update global validation state if current provider is validated
            if (AppState.apiProvider === provider) {
                AppState.isApiKeyValid = true;
            }
        } else {
            const errorData = await response.json();
            throw new Error(`API validation failed: ${errorData.error?.message || errorData.error?.details || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`${provider} API Key validation error:`, error);
        showStatus(statusElement, `Validation gagal: ${error.message}`, 'error');
        
        if (AppState.apiProvider === provider) {
            AppState.isApiKeyValid = false;
        }
    } finally {
        buttonElement.disabled = false;
        const buttonTexts = {
            'openai': 'Validate OpenAI',
            'gemini': 'Validate Gemini',
            'openrouter': 'Validate OpenRouter'
        };
        buttonElement.textContent = buttonTexts[provider];
    }
}

// Helper function to get current API key
function getCurrentApiKey() {
    switch (AppState.apiProvider) {
        case 'openai':
            return AppState.openaiApiKey;
        case 'gemini':
            return AppState.geminiApiKey;
        case 'openrouter':
            return AppState.openrouterApiKey;
        default:
            return '';
    }
}

// Helper function to check if current provider is validated
function isCurrentProviderValid() {
    const apiKey = getCurrentApiKey();
    return apiKey && apiKey.length > 0;
}

// Generic API call function that supports both OpenAI and Gemini
async function callVisionAPI(imageData, promptText, maxTokens = 1000) {
    const apiKey = getCurrentApiKey();
    
    if (AppState.apiProvider === 'openai') {
        return await callOpenAIAPI(imageData, promptText, maxTokens, apiKey);
    } else if (AppState.apiProvider === 'gemini') {
        return await callGeminiAPI(imageData, promptText, maxTokens, apiKey);
    } else if (AppState.apiProvider === 'openrouter') {
        return await callOpenRouterAPI(imageData, promptText, maxTokens, apiKey);
    } else {
        throw new Error('Invalid API provider');
    }
}

// OpenAI API call
async function callOpenAIAPI(imageData, promptText, maxTokens, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: promptText },
                    { type: "image_url", image_url: { url: imageData } }
                ]
            }],
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Gemini API call
async function callGeminiAPI(imageData, promptText, maxTokens, apiKey) {
    // Convert data URL to base64 without the data:image/jpeg;base64, prefix
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.split(';')[0].split(':')[1];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: promptText },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// OpenRouter API call
async function callOpenRouterAPI(imageData, promptText, maxTokens, apiKey) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: AppState.openrouterModel,
            messages: [{
                role: "user",
                content: [
                    { type: "text", text: promptText },
                    { type: "image_url", image_url: { url: imageData } }
                ]
            }],
            max_tokens: maxTokens,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Generic text-only API call function that supports OpenAI, Gemini, and OpenRouter
async function callTextAPI(promptText, maxTokens = 1000, temperature = 0.7) {
    const apiKey = getCurrentApiKey();
    
    if (AppState.apiProvider === 'openai') {
        return await callOpenAITextAPI(promptText, maxTokens, temperature, apiKey);
    } else if (AppState.apiProvider === 'gemini') {
        return await callGeminiTextAPI(promptText, maxTokens, temperature, apiKey);
    } else if (AppState.apiProvider === 'openrouter') {
        return await callOpenRouterTextAPI(promptText, maxTokens, temperature, apiKey);
    } else {
        throw new Error('Invalid API provider');
    }
}

// OpenAI text-only API call
async function callOpenAITextAPI(promptText, maxTokens, temperature, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: promptText
            }],
            max_tokens: maxTokens,
            temperature: temperature
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Gemini text-only API call
async function callGeminiTextAPI(promptText, maxTokens, temperature, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: promptText }]
            }],
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature: temperature
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// OpenRouter text-only API call
async function callOpenRouterTextAPI(promptText, maxTokens, temperature, apiKey) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: AppState.openrouterModel,
            messages: [{
                role: "user",
                content: promptText
            }],
            max_tokens: maxTokens,
            temperature: temperature
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenRouter API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
        await processFilesWithAI();
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

async function processFilesWithAI() {
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
                    debugLog(`🖼️ Processing single image: ${file.name}`);
                    const imageResult = await processImageFile(file);
                    debugLog(`📊 Single image result:`, imageResult);
                    if (imageResult) {
                        results.push(imageResult);
                        successLog(`✅ Single image processed: ${file.name}`);
                    } else {
                        debugLog(`❌ No result returned for single image: ${file.name}`);
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
        
        // Convert file to base64 for analysis
        const base64Image = await convertFileToBase64(file);
        const imageDataUrl = `data:${file.type};base64,${base64Image}`;
        
        const promptText = `ULTRA-COMPREHENSIVE COMPOSITE IMAGE DETECTION:

MISSION: Identify and analyze EVERY individual image, photo, or visual element in this collage/grid layout. Count each separate visual piece meticulously.

🎯 DETECTION TARGETS (Be EXTREMELY thorough):
✅ PHOTOGRAPHS: Every individual photo, no matter how small
✅ ARTWORK: Any illustration, drawing, or artistic piece  
✅ SCREENSHOTS: App interfaces, website captures, UI elements
✅ PRODUCT IMAGES: Items, objects, or commercial photos
✅ PORTRAITS: People photos, headshots, character images
✅ LANDSCAPES: Nature scenes, cityscapes, architectural photos
✅ ABSTRACT VISUALS: Patterns, textures, color compositions
✅ DESIGN ELEMENTS: Logos, graphics, decorative images
✅ THUMBNAILS: Even small preview images count as separate items

ULTRA-SENSITIVE COUNTING:
- Look at EVERY corner and section of the image
- Count even tiny individual elements if they're distinct images
- If you see a grid of 4x5 photos, that's 20 individual images
- Each separate visual piece = +1 to the count
- Be generous with detection - err on the side of finding MORE images

ANALYSIS DEPTH for EACH detected image:
1) ULTRA-DETAILED description: Every visual element, color, style, mood, composition, lighting, objects, people, setting, atmosphere, artistic style
2) MASTER-LEVEL image prompt: Hyper-specific details for perfect AI recreation including camera settings, lighting setup, artistic style, materials, textures, colors, composition rules, mood, technical specifications
3) CINEMATIC video prompt: Professional camera movements, lighting transitions, motion dynamics, cinematic techniques, storytelling approach
4) Mark isMeaningful=true for ANY visual content with substance

CRITICAL SUCCESS METRICS:
- If this is a collage with ~20 images, detect close to 20 individual pieces
- Each analysis should be as thorough as if that image was uploaded alone
- Zero tolerance for missing individual images in grids/collages

RETURN ONLY valid JSON without markdown formatting.

IMPORTANT: Set isComposite=true if you detect 2 or more separate visual elements.

JSON Structure:
{
    "totalImages": number,
    "isComposite": boolean,
    "debugInfo": "Brief explanation of what type of image this is and how many distinct images found",
    "images": [
        {
            "index": number,
            "description": "very detailed description",
            "imagePrompt": "comprehensive image generation prompt",
            "videoPrompt": "detailed video generation prompt",
            "isMeaningful": boolean
        }
    ]
}`;

        const content = await callVisionAPI(imageDataUrl, promptText, 6000);
        
        try {
            const cleanContent = cleanJsonResponse(content);
            const analysis = JSON.parse(cleanContent);
            
            debugLog(`📊 Individual Image Detection Results:`, {
                totalImages: analysis.totalImages,
                isComposite: analysis.isComposite,
                debugInfo: analysis.debugInfo
            });

            // Enhanced composite detection logic - be more inclusive
            const meaningfulCount = analysis.images ? analysis.images.filter(img => img.isMeaningful).length : 0;
            
            // Process as composite if:
            // 1) Explicitly marked as composite, OR
            // 2) Multiple meaningful images detected (≥2), OR  
            // 3) High total image count (≥3) regardless of isComposite flag
            const shouldProcessAsComposite = (
                analysis.isComposite || 
                meaningfulCount >= 2 || 
                (analysis.totalImages && analysis.totalImages >= 3)
            );
            
            if (!shouldProcessAsComposite || !analysis.images || analysis.images.length === 0) {
                debugLog(`ℹ️ Not detected as composite - isComposite: ${analysis.isComposite}, meaningful: ${meaningfulCount}, total: ${analysis.totalImages}`);
                return null;
            }
            
            debugLog(`🎯 Processing as composite - meaningful: ${meaningfulCount}, total: ${analysis.totalImages}, isComposite: ${analysis.isComposite}`);

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
    
    const promptText = "Analyze this image thoroughly and create detailed prompts for AI generation. Treat ALL images as potentially meaningful - including photographs, screenshots, UI interfaces, artwork, designs, and visual content.\n\nPlease provide:\n1) A comprehensive description of what you see (objects, people, interface elements, colors, composition, style, mood, lighting, etc.)\n2) A detailed AI image generation prompt optimized for DALL-E, Midjourney, or Stable Diffusion that captures the essence and visual elements\n3) A detailed AI video generation prompt for Runway or Pika Labs that could animate or create motion from this image\n4) Mark as meaningful unless it's purely decorative icons or basic geometric shapes\n\nFOR SCREENSHOTS/UI: Describe the interface layout, colors, design elements, and create prompts that capture the visual design.\nFOR PHOTOS: Focus on subjects, composition, lighting, mood, and setting.\nFOR GRAPHICS/ARTWORK: Describe style, colors, elements, and artistic approach.\n\nIMPORTANT: Be very descriptive and specific in prompts. Include visual details, colors, composition, style, and mood.\n\nCRITICAL: Return ONLY valid JSON without markdown formatting. Use this exact structure:\n{\"description\": \"detailed description\", \"imagePrompt\": \"comprehensive prompt\", \"videoPrompt\": \"detailed video prompt\", \"isMeaningful\": true/false}";
    
    const imageDataUrl = `data:${file.type};base64,${base64Image}`;
    const content = await callVisionAPI(imageDataUrl, promptText, 1000);
    
    try {
        const cleanContent = cleanJsonResponse(content);
        const result = JSON.parse(cleanContent);
        debugLog(`🔍 ${AppState.apiProvider.toUpperCase()} response received for ${file.name}`);
        
        // More lenient filtering for single images - only filter truly empty or very short descriptions
        if (!result.description || result.description.trim().length < 10) {
            debugLog(`❌ Filtered out image with insufficient description: ${result.description || 'null'}`);
            return null;
        }
        
        // Accept image even if marked as not meaningful, as long as it has substantial description
        if (!result.isMeaningful) {
            debugLog(`⚠️ Image marked as not meaningful but has description, processing anyway: ${file.name}`);
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
                        const result = await processImageWithAPI(imageFile, pageNum);
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

async function processImageWithAPI(imageFile, pageNum) {
    try {
        // Check cache first
        const cacheKey = await generateCacheKey(imageFile);
        const cachedResult = getCachedResult(cacheKey);
        
        if (cachedResult) {
            showStatus(elements.uploadStatus, `Menggunakan cache untuk halaman ${pageNum}`, 'info');
            return cachedResult;
        }
        
        const base64Image = await convertFileToBase64(imageFile);
        
        const promptText = `Analyze this page from a PDF document in detail. Please provide:

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

Format your response as JSON with keys: description, imagePrompt, videoPrompt, isMeaningful`;

        const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`;
        const content = await callVisionAPI(imageDataUrl, promptText, 1200);
        
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
        // First, analyze the page and identify individual images
        const base64Image = await convertFileToBase64(pageImageFile);
        const imageDataUrl = `data:${pageImageFile.type};base64,${base64Image}`;
        
        const promptText = `ULTRA-THOROUGH PDF VISUAL CONTENT EXTRACTION:

MISSION: Scan every millimeter of this PDF page and catalog EVERY individual visual element. Miss nothing - be obsessively thorough.

🔍 HYPER-DETECTION CATEGORIES:
📸 PHOTOGRAPHS (Count each separately):
- Every individual photo, portrait, landscape shot
- Stock photography and commercial images
- Product photos and item pictures  
- Thumbnail images and preview pictures
- Screenshots and interface captures
- Personal photos and professional headshots

🎨 ARTISTIC CONTENT (Each piece counts):
- Individual illustrations and artwork pieces
- Graphics, logos, and brand visuals
- Decorative elements and design graphics
- Charts, infographics, and data visualizations
- Color patterns and textural backgrounds
- Icons and visual symbols

📱 DIGITAL VISUALS (Every element):
- App interface screenshots
- Website layout captures
- Digital artwork and computer graphics
- UI elements and design mockups

🎯 ULTRA-DETECTION PROTOCOL:
✅ COUNT SEPARATELY: Every distinct visual piece, even if tiny
✅ INCLUDE ALL: Photos, graphics, artwork, designs, meaningful patterns
✅ SCAN SYSTEMATICALLY: Top-left to bottom-right, corner to corner
✅ BE GENEROUS: When in doubt, count it as a separate element
✅ MARK MEANINGFUL: ANY visual content with artistic/photographic value
❌ EXCLUDE ONLY: Pure text, page numbers, tiny decorative dots

ANALYSIS REQUIREMENTS for EACH visual element:
1) EXHAUSTIVE description: Every detail - objects, people, colors, lighting, style, mood, composition, setting, atmosphere, artistic approach
2) MASTER-CLASS image prompt: Ultra-specific recreation details including camera settings, lighting setup, artistic style, materials, textures, color grading, composition techniques, technical specifications
3) PROFESSIONAL video prompt: Cinematic camera work, lighting transitions, motion dynamics, storytelling approach, technical cinematography
4) Mark isMeaningful=true for ANY substantial visual content

DETECTION SUCCESS TARGET: If there are 20+ visual elements visible, detect close to that number.

RETURN ONLY valid JSON without markdown formatting.

JSON Structure:
{
    "totalImages": number,
    "debugInfo": "Explanation of visual content found",
    "images": [
        {
            "index": number,
            "description": "detailed description",
            "imagePrompt": "comprehensive prompt",
            "videoPrompt": "detailed video prompt",
            "isMeaningful": boolean
        }
    ]
}`;

        const content = await callVisionAPI(imageDataUrl, promptText, 6000);
        
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
            <div class="prompt-actions">
                <button class="copy-button" onclick="copyToClipboard('${escapeQuotes(result.imagePrompt)}', this)">Copy Image Prompt</button>
                <div class="variant-controls">
                    <input type="number" class="variant-count" min="1" max="5" value="1" placeholder="Jumlah">
                    <button class="variant-button" data-prompt-type="image" data-result-index="${index}">🔄 New Variant</button>
                </div>
            </div>
            <div class="variants-container" id="image-variants-${index}"></div>
        </div>
        
        <div class="prompt-section">
            <h4>🎬 Prompt untuk Video Generation</h4>
            <p class="prompt-subtitle">Gunakan prompt ini untuk Runway, Pika Labs, atau AI video generator lainnya:</p>
            <div class="prompt-text video-prompt">${result.videoPrompt}</div>
            <div class="prompt-actions">
                <button class="copy-button" onclick="copyToClipboard('${escapeQuotes(result.videoPrompt)}', this)">Copy Video Prompt</button>
                <div class="variant-controls">
                    <input type="number" class="variant-count" min="1" max="5" value="1" placeholder="Jumlah">
                    <button class="variant-button" data-prompt-type="video" data-result-index="${index}">🔄 New Variant</button>
                </div>
            </div>
            <div class="variants-container" id="video-variants-${index}"></div>
        </div>
    `;
    
    // Store the original prompts as data attributes for safe access
    div.dataset.imagePrompt = result.imagePrompt;
    div.dataset.videoPrompt = result.videoPrompt;
    
    // Add event listeners for variant buttons
    const variantButtons = div.querySelectorAll('.variant-button');
    variantButtons.forEach(button => {
        button.addEventListener('click', function() {
            const promptType = this.dataset.promptType;
            const resultIndex = this.dataset.resultIndex;
            const originalPrompt = promptType === 'image' ? div.dataset.imagePrompt : div.dataset.videoPrompt;
            generateVariant(originalPrompt, promptType, this);
        });
    });
    
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

async function generateVariant(originalPrompt, promptType, button) {
    // Check if API key is valid
    if (!isCurrentProviderValid()) {
        alert('Silakan validasi API key terlebih dahulu!');
        return;
    }
    
    // Get variant count from input
    const variantCountInput = button.parentElement.querySelector('.variant-count');
    const variantCount = parseInt(variantCountInput.value) || 1;
    
    if (variantCount < 1 || variantCount > 5) {
        alert('Jumlah variant harus antara 1-5!');
        return;
    }
    
    // Show loading state
    const originalText = button.textContent;
    button.textContent = '⏳ Generating...';
    button.disabled = true;
    
    try {
        // Find the variants container
        const promptSection = button.closest('.prompt-section');
        const variantsContainer = promptSection.querySelector('.variants-container');
        
        // Generate variants using AI
        const variants = await generatePromptVariants(originalPrompt, promptType, variantCount);
        
        // Display variants
        displayVariants(variants, variantsContainer, promptType);
        
        successLog(`✅ Generated ${variants.length} ${promptType} prompt variants`);
        
    } catch (error) {
        console.error('Error generating variants:', error);
        alert('Gagal generate variant. Silakan coba lagi.');
    } finally {
        // Reset button state
        button.textContent = originalText;
        button.disabled = false;
    }
}

async function generatePromptVariants(originalPrompt, promptType, count) {
    const systemPrompt = `You are an expert AI prompt engineer. Your task is to create ${count} creative variants of the given ${promptType} generation prompt.

Rules:
1. Each variant should maintain the core concept and visual elements of the original prompt
2. Vary the style, composition, mood, or artistic approach
3. Keep variants specific and detailed for optimal AI generation results
4. For image prompts: focus on different artistic styles, compositions, or visual treatments
5. For video prompts: focus on different camera movements, transitions, or animation styles
6. Each variant should be unique and creative while staying true to the original concept
7. Return ONLY a JSON array of strings, no additional text

Original ${promptType} prompt: "${originalPrompt}"

Generate ${count} creative variants:`;

    const response = await callTextAPI(systemPrompt, 1500, 0.8);
    
    try {
        // Try to parse as JSON array
        const variants = JSON.parse(response);
        if (Array.isArray(variants)) {
            return variants;
        }
    } catch (e) {
        // If JSON parsing fails, try to extract variants from text
        const lines = response.split('\n').filter(line => line.trim());
        const variants = [];
        
        for (const line of lines) {
            const cleaned = line.replace(/^\d+\.\s*/, '').replace(/^"-*/, '').replace(/"$/, '').trim();
            if (cleaned && cleaned.length > 20) {
                variants.push(cleaned);
            }
        }
        
        if (variants.length > 0) {
            return variants.slice(0, count);
        }
    }
    
    // Fallback: return original prompt with slight modifications
    return [originalPrompt + ' with enhanced details and improved composition'];
}

function displayVariants(variants, container, promptType) {
    container.innerHTML = '';
    
    if (variants.length === 0) {
        container.innerHTML = '<p class="no-variants">Tidak ada variant yang berhasil dibuat.</p>';
        return;
    }
    
    const variantsHeader = document.createElement('div');
    variantsHeader.className = 'variants-header';
    variantsHeader.innerHTML = `<h5>🎲 Generated Variants (${variants.length})</h5>`;
    container.appendChild(variantsHeader);
    
    variants.forEach((variant, index) => {
        const variantDiv = document.createElement('div');
        variantDiv.className = 'variant-item';
        
        const promptClass = promptType === 'image' ? 'image-prompt' : 'video-prompt';
        
        variantDiv.innerHTML = `
            <div class="variant-header">
                <span class="variant-number">Variant ${index + 1}</span>
            </div>
            <div class="prompt-text ${promptClass}">${variant}</div>
            <button class="copy-button variant-copy">Copy Variant</button>
        `;
        
        // Add event listener for copy button
        const copyButton = variantDiv.querySelector('.variant-copy');
        copyButton.addEventListener('click', function() {
            copyToClipboard(variant, this);
        });
        
        container.appendChild(variantDiv);
    });
    
    // Update export stats to reflect new variants
    updateExportStats();
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