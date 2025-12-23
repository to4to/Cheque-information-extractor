from pydantic import BaseModel
from typing import Optional, Dict, Any, Union


class ChequeExtractionRequest(BaseModel):
    perform_ocr: bool = False


class DetectedObject(BaseModel):
    confidence: float
    cropped_image: Optional[str]  # Base64 encoded image


class DetectionResult(BaseModel):
    detected_objects: Dict[str, DetectedObject]
    labeled_image: Optional[str]  # Base64 encoded image
    ocr_result: Optional[str] = None


class ChequeExtractionResponse(BaseModel):
    status: str
    data: Union[DetectionResult, Dict[str, Any]]  # Can be DetectionResult or error dict
    message: Optional[str] = None

