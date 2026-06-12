FROM python:3.12-slim

WORKDIR /app

# System deps for Playwright + psycopg
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (needed for automation agent)
RUN playwright install chromium

COPY . .

EXPOSE 8000
