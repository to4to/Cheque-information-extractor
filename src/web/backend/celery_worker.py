import os
import celery

os.environ.setdefault("FASTAPI_SETTINGS_MODULE", "src.web.backend.api")

celery_app = celery.Celery(
    "Cheque Information Extractor",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
    include=['src.web.backend.tasks']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata',
    enable_utc=True,
    result_expires=3600
)