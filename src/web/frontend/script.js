// API Configuration
const API_BASE_URL = 'http://localhost:8000';
const API_KEY = 'f64bdf6ae22c46efa50b0a98c322ded4'; // Replace with your actual API key

// DOM Elements
const uploadSection = document.getElementById('uploadSection');
const processingSection = document.getElementById('processingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const uploadForm = document.getElementById('uploadForm');
const uploadError = document.getElementById('uploadError');
const accountNumber = document.getElementById('accountNumber');
const ocrStatus = document.getElementById('ocrStatus');
const objectsGrid = document.getElementById('objectsGrid');
const labeledImage = document.getElementById('labeledImage');
const downloadLabeledBtn = document.getElementById('downloadLabeledBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const processAnotherBtn = document.getElementById('processAnotherBtn');
const retryBtn = document.getElementById('retryBtn');
const contactSupportBtn = document.getElementById('contactSupportBtn');
const errorMessage = document.getElementById('errorMessage');
const errorDetails = document.getElementById('errorDetails');
const errorDetailText = document.getElementById('errorDetailText');

// State variables
let taskId = null;
let pollInterval = null;
let extractionResult = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    uploadForm.addEventListener('submit', handleFileUpload);
    processAnotherBtn.addEventListener('click', showUploadSection);
    retryBtn.addEventListener('click', showUploadSection);
    contactSupportBtn.addEventListener('click', handleContactSupport);
    downloadLabeledBtn.addEventListener('click', downloadLabeledImage);
    downloadAllBtn.addEventListener('click', downloadAllImages);
    
    // Add file input change listener for visual feedback
    const fileInput = document.getElementById('cheque-image');
    const fileNameDisplay = document.getElementById('file-name');
    
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });
    
    // Check if we have a task ID in URL (for direct links to results)
    const urlParams = new URLSearchParams(window.location.search);
    const taskIdParam = urlParams.get('task_id');
    if (taskIdParam) {
        taskId = taskIdParam;
        showProcessingSection();
        startPolling();
    }
});

// Handle file upload
async function handleFileUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('cheque-image');
    const performOcrCheckbox = document.getElementById('perform-ocr');
    
    if (!fileInput.files.length) {
        showError('Please select a file to upload.');
        return;
    }
    
    const file = fileInput.files[0];
    const performOcr = performOcrCheckbox.checked;
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showError('Invalid file type. Please upload an image file (PNG, JPG, JPEG, TIFF, BMP, GIF).');
        return;
    }
    
    // Show processing section
    showProcessingSection();
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('perform_ocr', performOcr);
        
        // Submit file to backend
        const response = await fetch(`${API_BASE_URL}/extract`, {
            method: 'POST',
            headers: {
                'X-API-KEY': API_KEY
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to upload file');
        }
        
        const data = await response.json();
        taskId = data.task_id;
        
        // Start polling for results
        startPolling();
    } catch (error) {
        console.error('Upload error:', error);
        showErrorMessage('Failed to upload file', error.message);
    }
}

// Start polling for task results
function startPolling() {
    // Clear any existing interval
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    
    // Poll every 2 seconds
    pollInterval = setInterval(checkTaskStatus, 2000);
}

// Check task status
async function checkTaskStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/result/${taskId}`, {
            headers: {
                'X-API-KEY': API_KEY
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch task status');
        }
        
        const data = await response.json();
        
        switch (data.status) {
            case 'success':
                clearInterval(pollInterval);
                extractionResult = data.data;
                displayResults(data.data);
                showResultsSection();
                break;
            case 'failure':
                clearInterval(pollInterval);
                showErrorMessage('Processing failed', data.message || 'An error occurred during processing');
                break;
            case 'pending':
            case 'progress':
                // Continue polling
                break;
            default:
                // Continue polling
                break;
        }
    } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
        showErrorMessage('Failed to check task status', error.message);
    }
}

// Display results
function displayResults(result) {
    // Display account number and OCR status
    if (result.ocr_result) {
        accountNumber.textContent = result.ocr_result;
        ocrStatus.textContent = 'OCR Status: Successful';
        ocrStatus.classList.remove('error');
    } else {
        accountNumber.textContent = 'Not available';
        ocrStatus.textContent = 'OCR not performed or failed';
        ocrStatus.classList.add('error');
    }
    
    // Clear existing object cards
    objectsGrid.innerHTML = '';
    
    // Display detected objects
    if (result.detected_objects) {
        for (const [className, objectData] of Object.entries(result.detected_objects)) {
            const card = createObjectCard(className, objectData);
            objectsGrid.appendChild(card);
        }
    }
    
    // Display labeled image
    if (result.labeled_image) {
        labeledImage.src = `data:image/jpeg;base64,${result.labeled_image}`;
    } else {
        labeledImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"%3E%3Crect width="600" height="300" fill="%23eee"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23666"%3ELabeled Cheque Image%3C/text%3E%3C/svg%3E';
    }
}

// Create object card for detected object
function createObjectCard(className, objectData) {
    const card = document.createElement('div');
    card.className = 'object-card';
    
    const confidence = (objectData.confidence * 100).toFixed(2);
    
    card.innerHTML = `
        <h4>${className}</h4>
        <div class="confidence">Confidence: ${confidence}%</div>
        <div class="cropped-image-container">
            <img src="${objectData.cropped_image ? `data:image/jpeg;base64,${objectData.cropped_image}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"%3E%3Crect width="200" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23666"%3ECropped Image%3C/text%3E%3C/svg%3E'}" alt="${className}">
        </div>
        <button class="download-btn" data-class="${className}" data-image="${objectData.cropped_image || ''}">Download Image</button>
    `;
    
    // Add event listener to download button
    const downloadBtn = card.querySelector('.download-btn');
    downloadBtn.addEventListener('click', function() {
        downloadCroppedImage(className, objectData.cropped_image);
    });
    
    return card;
}

// Download cropped image
function downloadCroppedImage(className, imageData) {
    if (!imageData) {
        alert('No image data available for download.');
        return;
    }
    
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${imageData}`;
    link.download = `${className}_cropped.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download labeled image
function downloadLabeledImage(event) {
    event.preventDefault();
    
    if (!extractionResult || !extractionResult.labeled_image) {
        alert('No labeled image available for download.');
        return;
    }
    
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${extractionResult.labeled_image}`;
    link.download = 'labeled_cheque.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download all images
function downloadAllImages(event) {
    event.preventDefault();
    
    if (!extractionResult) {
        alert('No results available for download.');
        return;
    }
    
    // Create a temporary array to hold all images to download
    const imagesToDownload = [];
    
    // Add labeled image
    if (extractionResult.labeled_image) {
        imagesToDownload.push({
            name: 'labeled_cheque.jpg',
            data: extractionResult.labeled_image
        });
    }
    
    // Add cropped images
    if (extractionResult.detected_objects) {
        for (const [className, objectData] of Object.entries(extractionResult.detected_objects)) {
            if (objectData.cropped_image) {
                imagesToDownload.push({
                    name: `${className}_cropped.jpg`,
                    data: objectData.cropped_image
                });
            }
        }
    }
    
    // If we only have one image, download it directly
    if (imagesToDownload.length === 1) {
        const image = imagesToDownload[0];
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${image.data}`;
        link.download = image.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }
    
    // For multiple images, we'll trigger downloads with a small delay between each
    // to avoid browser popup blockers
    imagesToDownload.forEach((image, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = `data:image/jpeg;base64,${image.data}`;
            link.download = image.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 1000); // 1 second delay between downloads
    });
}

// Show upload section
function showUploadSection() {
    // Hide all sections
    uploadSection.classList.remove('hidden');
    processingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
    // Reset form
    uploadForm.reset();
    uploadError.style.display = 'none';
    
    // Clear state
    taskId = null;
    extractionResult = null;
    
    // Clear polling interval
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

// Show processing section
function showProcessingSection() {
    // Hide all sections
    uploadSection.classList.add('hidden');
    processingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
}

// Show results section
function showResultsSection() {
    // Hide all sections
    uploadSection.classList.add('hidden');
    processingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
}

// Show error section
function showErrorMessage(title, detail) {
    errorMessage.textContent = title;
    
    if (detail) {
        errorDetailText.textContent = detail;
        errorDetails.style.display = 'block';
    } else {
        errorDetails.style.display = 'none';
    }
    
    // Hide all sections
    uploadSection.classList.add('hidden');
    processingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.remove('hidden');
}

// Show simple error
function showError(message) {
    uploadError.querySelector('p').textContent = message;
    uploadError.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        uploadError.style.display = 'none';
    }, 5000);
}

// Handle contact support
function handleContactSupport() {
    alert('Please contact support at support@cheque-extractor.com with your task ID: ' + (taskId || 'N/A'));
}