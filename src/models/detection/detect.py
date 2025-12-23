from ultralytics import YOLO
import cv2 as cv

def detect_components(model: YOLO, image_path: str = None, image = None):
    """
    Detects components in an image using a YOLO model and returns detected objects and a labeled image.

    Args:
        model (YOLO): The YOLO model used for object detection.
        image_path (str, optional): Path to the input image. Provide either `image_path` or `image`, not both.
        image (numpy.ndarray, optional): Image array. Provide either `image_path` or `image`, not both.

    Returns:
        dict: A dictionary containing:
            - "detected_objects": A dictionary mapping class names to their detection confidence and cropped image.
            - "labeled_image": The image with detected objects labeled (as returned by `predictions[0].plot()`).

    Raises:
        AssertionError: If both `image_path` and `image` are provided or both are None.
    """
    assert (image_path is None) != (image is None), "Provide either image_path or image, not both or neither."

    if image_path:
        predictions = model.predict(image_path)
    else:
        predictions = model(image)

    if image is None:
        image = cv.imread(image_path)

    image = cv.threshold(image, 127, 255, cv.THRESH_BINARY)[1]

    detected_objects = {}

    class_names = model.names

    for box in predictions[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].int().tolist()
        cropped_img = image[y1:y2, x1:x2]
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        class_name = class_names[cls]

        detected_objects[class_name] = {
            "confidence": conf,
            "cropped_image": cropped_img
        }

    return {
        "detected_objects": detected_objects,
        "labeled_image": predictions[0].plot()
    }