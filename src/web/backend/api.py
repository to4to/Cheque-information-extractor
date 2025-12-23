import os
import sys
import hmac
import logging
import base64
from dotenv import load_dotenv
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Form
from fastapi.responses import JSONResponse

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.web.backend.tasks import get_cheque_information
from src.web.backend.celery_worker import celery_app
from src.web.backend.schemas import ChequeExtractionResponse

load_dotenv()

app = FastAPI(title="Cheque Information Extractor API", version="1.0.0", docs_url="/docs", redoc_url="/redoc", openapi_url="/openapi.json")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(lineno)d - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/api.log")
    ]
)

logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY_HEADER = APIKeyHeader(name="X-API-KEY")
API_KEY = os.getenv("API_KEY")

def verify_api_key(api_key: str = Depends(API_KEY_HEADER)):
    if not hmac.compare_digest(api_key, API_KEY):
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return api_key

@app.get("/health", tags=["Health Check"])
async def health_check(api_key: str = Depends(verify_api_key)):
    return {"status": "ok", "message": "Service is running"}

@app.post("/extract", tags=["Cheque Information Extraction"])
async def extract_cheque_info(
    file: UploadFile = File(...),
    perform_ocr: bool = Form(default=False),
    api_key: str = Depends(verify_api_key)
) -> JSONResponse:
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif', '.tif')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image file.")
    
    try:
        file_content = await file.read()
        task = get_cheque_information.delay(file_content, perform_ocr)
        logger.info(f"Task {task.id} submitted for file {file.filename}")
        return {"task_id": task.id}
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
@app.get("/result/{task_id}", response_model=ChequeExtractionResponse, tags=["Cheque Information Extraction"])
async def get_extraction_result(
    task_id: str,
    api_key: str = Depends(verify_api_key)
) -> JSONResponse:
    try:
        task = celery_app.AsyncResult(task_id)
        if task.state == 'PENDING':
            return {"status": "pending", "data": {}, "message": "Task is still processing"}
        elif task.state == 'FAILURE':
            return {"status": "failure", "data": {}, "message": str(task.info)}
        elif task.state == 'SUCCESS':
            result = task.result
            # Check if result contains an error
            if "error" in result:
                return {"status": "failure", "data": result, "message": result["error"]}
            else:
                return {"status": "success", "data": result}
        else:
            return {"status": task.state.lower(), "data": {}, "message": "Task is in progress"}
    except Exception as e:
        logger.error(f"Error fetching result for task {task_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")