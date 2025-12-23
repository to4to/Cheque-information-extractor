# Cheque Information Extractor

This application extracts various components from a cheque, namely signature, receiver, account, and amount using YOLO object detection. It also provides OCR functionality for account number recognition.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [Manual Setup](#manual-setup)
  - [Docker Setup](#docker-setup)
- [Running the Application](#running-the-application)
  - [Method 1: Manual Start (Development)](#method-1-manual-start-development)
  - [Method 2: Using Docker Compose (Recommended)](#method-2-using-docker-compose-recommended)
  - [Method 3: Using the Startup Script](#method-3-using-the-startup-script)
- [API Usage](#api-usage)
- [Frontend Usage](#frontend-usage)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Model Requirements](#model-requirements)
- [Troubleshooting](#troubleshooting)

## Features

- Object detection for cheque components using YOLO
- OCR for account number recognition using TrOCR
- FastAPI backend with Celery for asynchronous processing
- Modern web frontend with responsive design
- Docker support for easy deployment
- Health checks and logging
- Download functionality for extracted images

## Architecture

The application follows a microservices architecture with the following components:

1. **Frontend Service**: Serves the web interface for user interaction
2. **Backend API Service**: FastAPI application that handles requests and orchestrates processing
3. **Celery Worker**: Processes cheque extraction tasks asynchronously
4. **Redis**: Message broker for Celery and result storage
5. **YOLO Model**: Custom-trained model for cheque component detection
6. **TrOCR Model**: Pre-trained model for account number OCR

## Prerequisites

- Python 3.10+
- Redis server
- Docker and Docker Compose (for containerized deployment)
- At least 4GB RAM (due to machine learning models)
- YOLO model file (`models/YOLOfinetuned.pt`)

## Setup

### Manual Setup

1. Install dependencies:
   ```bash
   pip install -e .
   ```

2. Or install from requirements.txt:
   ```bash
   pip install -r requirements.txt
   ```

### Docker Setup

1. Build the Docker images:
   ```bash
   docker compose up --build
   ```

2. Start all services:
   ```bash
   docker compose up
   ```

## Running the Application

### Method 1: Manual Start (Development)

You need to start each service separately:

1. Start Redis server:
   ```bash
   redis-server
   ```

2. Start Celery worker:
   ```bash
   celery -A src.web.backend.celery_worker worker --loglevel=info
   ```

3. Start the FastAPI application:
   ```bash
   gunicorn src.web.backend.api:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --log-level info
   ```

4. Start the frontend server:
   ```bash
   python main.py
   ```

### Method 2: Using Docker Compose (Recommended)

```bash
docker compose up
```

This will start all services:
- Redis database on port 6379
- FastAPI backend on port 8000
- Celery worker for task processing
- Frontend server on port 8080

Access the application at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Method 3: Using the Startup Script

```bash
./start_all.sh
```

This script starts all services in the background and provides process management.

## API Usage

Once the backend is running, you can access:

- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Cheque Extraction: http://localhost:8000/extract

The `/extract` endpoint accepts:
- `file`: The cheque image file (PNG, JPG, JPEG, TIFF, BMP, GIF)
- `perform_ocr`: Boolean flag to enable OCR on account number
- `X-API-KEY`: Header with your API key (default: f64bdf6ae22c46efa50b0a98c322ded4)

Example using curl:
```bash
curl -X POST "http://localhost:8000/extract" \
  -H "X-API-KEY: f64bdf6ae22c46efa50b0a98c322ded4" \
  -F "file=@/path/to/cheque.jpg" \
  -F "perform_ocr=true"
```

## Frontend Usage

The web interface provides an easy-to-use interface for cheque processing:

1. Navigate to http://localhost:8080
2. Click "Choose a cheque image" to select a cheque image file
3. Optionally check "Perform OCR on account number"
4. Click "Extract Information"
5. View the results including:
   - Detected components with confidence scores
   - Cropped images for each component
   - Annotated cheque image
   - Account number (if OCR was performed)
6. Download individual images or all images at once

## Environment Variables

The following environment variables can be set:

- `API_KEY`: Required API key for authentication (default: f64bdf6ae22c46efa50b0a98c322ded4)
- `CELERY_BROKER_URL`: Redis URL for Celery (default: redis://localhost:6379/0)
- `CELERY_RESULT_BACKEND`: Redis URL for Celery results (default: redis://localhost:6379/1)

When using Docker, these are set in the `docker-compose.yml` file.

## Project Structure

```
.
├── src/
│   ├── models/
│   │   ├── detection/
│   │   │   └── detect.py        # YOLO detection logic
│   │   └── ocr/
│   │       └── ocr.py           # OCR processing logic
│   └── web/
│       ├── backend/
│       │   ├── api.py           # FastAPI application
│       │   ├── celery_worker.py # Celery configuration
│       │   ├── schemas.py       # Pydantic models
│       │   └── tasks.py         # Celery tasks
│       └── frontend/
│           ├── index.html       # Main page
│           ├── styles.css       # Styling
│           └── script.js        # Frontend logic
├── models/
│   └── YOLOfinetuned.pt         # YOLO model file (not included in repo)
├── logs/                        # Application logs
├── main.py                      # Frontend server
├── start_all.sh                 # Startup script
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose configuration
├── requirements.txt             # Python dependencies
└── pyproject.toml              # Project metadata and dependencies
```

## Model Requirements

The application requires two machine learning models:

1. **YOLO Model**: Custom-trained model for cheque component detection
   - File: `models/YOLOfinetuned.pt`
   - Place this file in the `models/` directory before running the application

2. **TrOCR Model**: Pre-trained model for account number OCR
   - Automatically downloaded during Docker build
   - For manual setup, the model will be downloaded on first run

## Troubleshooting

### Common Issues

1. **Permission denied when running start_all.sh**:
   ```bash
   chmod +x start_all.sh
   ```

2. **Models not found**:
   - Ensure `models/YOLOfinetuned.pt` exists
   - Check that the TrOCR model was downloaded successfully

3. **Docker services not starting**:
   ```bash
   docker-compose logs <service_name>
   ```

4. **Insufficient memory**:
   - Allocate at least 4GB RAM to Docker
   - Close other memory-intensive applications

### Health Checks

Each service includes health checks:
- Backend: http://localhost:8000/health

Check health status:
```bash
curl http://localhost:8000/health -H "X-API-KEY: ..."
```