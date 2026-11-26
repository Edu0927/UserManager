FROM python:3.12-alpine

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY pipeline_monitor.py .

RUN mkdir -p /data

CMD ["python", "pipeline_monitor.py"]
