import os
import sys
import logging
import cv2 as cv
import numpy as np
from ultralytics import YOLO
import base64

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from celery_worker import celery_app
from src.models.detection.detect import detect_components
from src.models.ocr.ocr import ocr_image

# Get the directory of the current file
current_dir = os.path.dirname(os.path.abspath(__file__))
# Construct the path to the model file
model_path = os.path.join(current_dir, "..", "..", "..", "models", "YOLOfinetuned.pt")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(lineno)d - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/tasks.log")
    ]
)

logger = logging.getLogger(__name__)

# Load the model once when the module is imported
try:
    model = YOLO(model_path)
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {e}")
    model = None

def encode_image_to_base64(image):
    """Convert numpy image array to base64 string"""
    try:
        # Encode image to JPEG format
        success, buffer = cv.imencode('.jpg', image)
        if not success:
            return None
        # Convert to base64
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        return jpg_as_text
    except Exception as e:
        logger.error(f"Error encoding image to base64: {e}")
        return None

@celery_app.task
def get_cheque_information(cheque_img_bytes: bytes, perform_ocr: bool = False) -> dict:
    """
    Extract cheque information using the YOLO model and optionally perform OCR on account number.
    
    Args:
        cheque_img_bytes: The cheque image as bytes
        perform_ocr: Whether to perform OCR on the account number
        
    Returns:
        dict: Extracted information including detected objects, cropped images, labeled image, and optionally OCR result
    """
    if model is None:
        logger.error("Model not loaded")
        return {"error": "Model not loaded"}
    
    try:
        # Convert bytes to numpy array
        cheque_img_array = np.frombuffer(cheque_img_bytes, np.uint8)
        # Decode the image
        image = cv.imdecode(cheque_img_array, cv.IMREAD_COLOR)
        
        if image is None:
            logger.error("Failed to decode image")
            return {"error": "Failed to decode image"}
        
        # Detect components
        result = detect_components(model, image=image)
        detected_objects = result["detected_objects"]
        labeled_image = result["labeled_image"]
        
        # Prepare response with all detection data
        response_data = {
            "detected_objects": {},
            "labeled_image": encode_image_to_base64(labeled_image)
        }
        
        # Process detected objects with cropped images
        for class_name, data in detected_objects.items():
            response_data["detected_objects"][class_name] = {
                "confidence": data["confidence"],
                "cropped_image": encode_image_to_base64(data["cropped_image"])
            }
        
        # Perform OCR if requested and account is detected
        ocr_result = None
        if perform_ocr and "account" in detected_objects:
            try:
                account_image = detected_objects["account"]["cropped_image"]
                ocr_result = ocr_image(account_image)
            except Exception as e:
                logger.error(f"OCR failed: {e}")
                ocr_result = None
        
        response_data["ocr_result"] = ocr_result
        return response_data
        
    except Exception as e:
        logger.error(f"Error in get_cheque_information: {e}")
        return {"error": str(e)}