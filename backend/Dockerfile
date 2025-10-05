# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 환경변수 기본값 설정 (실행 시 오버라이드 가능)
ENV APP_ENV=production
ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=8000

# 포트 노출
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')" || exit 1

# 앱 실행 - uvicorn을 직접 실행
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
