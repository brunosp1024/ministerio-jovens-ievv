FROM python:3.11-slim

WORKDIR /app

COPY ./backend/app/core/config.py ./core/config.py
COPY ./backend/app/core/__init__.py ./core/__init__.py
COPY ./deploy/webhook/webhook_deploy.py ./webhook_deploy.py

COPY ./deploy/webhook/requirements-webhook.txt ./requirements-webhook.txt

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements-webhook.txt

ENV PYTHONPATH="/app"

CMD ["uvicorn", "webhook_deploy:app", "--host", "0.0.0.0", "--port", "5000"]
