from transformers import TrOCRProcessor, VisionEncoderDecoderModel


PROCESSOR = TrOCRProcessor.from_pretrained('microsoft/trocr-base-printed', use_fast=True)
OCR_MODEL = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-printed')

def ocr_image(image):
    pixel_values = PROCESSOR(images=image, return_tensors="pt").pixel_values
    generated_ids = OCR_MODEL.generate(pixel_values)
    generated_text = PROCESSOR.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return int(generated_text.replace(' ', ''))