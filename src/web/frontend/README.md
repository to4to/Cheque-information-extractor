# Cheque Information Extractor Frontend

This directory contains the frontend interface for the Cheque Information Extractor application.

## Files

- `index.html` - Main upload page where users can select a cheque image and choose to perform OCR
- `styles.css` - Stylesheet for all pages
- `script.js` - JavaScript file that handles all frontend functionality

## Features

1. **Image Upload**: Users can select a cheque image file (PNG, JPG, JPEG, TIFF, BMP, GIF, TIF)
2. **OCR Option**: Checkbox to enable OCR processing on the account number
3. **Results Display**: 
   - Account number extracted via OCR
   - Detected objects with confidence scores
   - Cropped images for each detected object
   - Labeled cheque image with all detections marked
4. **Download Options**:
   - Download individual cropped images
   - Download the labeled cheque image
   - Download all images at once
5. **Responsive Design**: Works on desktop and mobile devices

## How to Run

1. Run the complete application:
   ```
   ./start_all.sh
   ```
   
   This will start all services:
   - FastAPI backend on port 8000
   - Celery worker for task processing
   - Frontend server on port 8080

2. Open your browser and navigate to http://localhost:8080

## Implementation Details

- Uses HTML, CSS, and JavaScript for a complete frontend experience
- Connects to the FastAPI backend via fetch API
- Handles file upload, task submission, and result polling
- Dynamically displays results as they become available
- Provides download functionality for all extracted images

## API Integration

The frontend communicates with the backend API through two main endpoints:

1. **POST /extract** - Uploads the cheque image and starts processing
2. **GET /result/{task_id}** - Polls for processing results

The frontend automatically polls the backend every 2 seconds until results are ready.

## Main Application Structure

- `main.py` - Serves the frontend files
- `start_all.sh` - Script that starts all services (backend API, Celery worker, and frontend)