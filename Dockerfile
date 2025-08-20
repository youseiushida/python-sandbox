FROM python:3.12-slim

WORKDIR /app
COPY container_src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY container_src/app ./app

EXPOSE 8080
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
