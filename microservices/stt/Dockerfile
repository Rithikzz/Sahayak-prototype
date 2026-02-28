FROM python:3.11-slim

WORKDIR /app

# Whisper requires ffmpeg for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

# The first run will download the base model, so we preload it
RUN python -c "import whisper; whisper.load_model('base')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
