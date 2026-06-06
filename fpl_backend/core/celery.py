import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fpl_backend.settings')

app = Celery('fpl_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
