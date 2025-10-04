# Frontend-Backend 연동 가이드

이 문서는 AI Agent Service의 Frontend와 Backend를 연동하는 방법을 설명합니다.

## 아키텍처 개요

```
┌─────────────────┐      HTTP/HTTPS      ┌──────────────────┐
│                 │ ──────────────────►   │                  │
│   Frontend      │                       │    Backend       │
│  (React SPA)    │ ◄────────────────── │  (FastAPI)       │
│                 │      JSON Response     │                  │
└─────────────────┘                       └──────────────────┘
         │                                         │
         │ Direct API Call                         │
         │ (Optional)                              │
         ▼                                         ▼
┌─────────────────┐                       ┌──────────────────┐
│   OpenAI API    │                       │   OpenAI API     │
│  Perplexity API │                       │  Perplexity API  │
│   Tavily API    │                       │   Tavily API     │
└─────────────────┘                       └──────────────────┘
```

## 운영 모드

### Mode 1: Client-Side API 호출 (기본값)

Frontend가 직접 OpenAI/Perplexity API를 브라우저에서 호출합니다.

**장점:**
- 설정이 간단함
- Backend 서버 불필요
- 빠른 프로토타이핑

**단점:**
- API 키가 브라우저에 노출됨
- CORS 제한 가능성
- Rate limiting 관리 어려움

**설정:**
```env
# frontend/.env
REACT_APP_AI_PROVIDER=openai
REACT_APP_OPENAI_API_KEY=your_key_here
# REACT_APP_BACKEND_URL 설정 안 함 (또는 주석 처리)
```

### Mode 2: Backend를 통한 API 호출 (권장)

Frontend가 Backend API를 호출하고, Backend가 실제 LLM API를 호출합니다.

**장점:**
- API 키 보안
- Rate limiting 구현 가능
- 로깅 및 모니터링 중앙화
- 비즈니스 로직 추가 가능

**단점:**
- Backend 서버 운영 필요
- 약간의 레이턴시 추가

**설정:**
```env
# frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8000

# backend/.env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
TAVILY_API_KEY=your_tavily_key_here
```

## 연동 설정 단계

### 1. Backend 설정

```bash
cd backend

# 환경변수 설정
cp .env.example .env
# .env 파일 편집하여 API 키 입력

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python -m __main__
```

서버가 `http://localhost:8000`에서 실행됩니다.

### 2. Frontend 설정

```bash
cd frontend

# 환경변수 설정
cp .env.example .env
# .env 파일 편집

# Backend 사용 시
echo "REACT_APP_BACKEND_URL=http://localhost:8000" >> .env

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

Frontend가 `http://localhost:3000`에서 실행됩니다.

### 3. 연동 테스트

```bash
# Backend health check
curl http://localhost:8000/healthz

# Backend chat API 테스트
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "안녕하세요"}
    ],
    "useSearch": false
  }'

# 또는 제공된 테스트 스크립트 사용
cd backend
bash test_backend.sh
```

## API 명세

### POST /chat

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "질문 내용"}
  ],
  "useSearch": true
}
```

**Response:**
```json
{
  "reply": "AI의 응답 내용",
  "usedSearch": true,
  "model": "gpt-4o-mini",
  "latencyMs": 1234,
  "citations": ["https://example.com"]
}
```

## 환경변수 비교

| 설정 | Frontend | Backend | 설명 |
|------|----------|---------|------|
| AI Provider | `REACT_APP_AI_PROVIDER` | `LLM_PROVIDER` | openai 또는 perplexity |
| OpenAI Key | `REACT_APP_OPENAI_API_KEY` | `OPENAI_API_KEY` | OpenAI API 키 |
| Perplexity Key | `REACT_APP_PERPLEXITY_API_KEY` | `PERPLEXITY_API_KEY` | Perplexity API 키 |
| Tavily Key | `REACT_APP_TAVILY_API_KEY` | `TAVILY_API_KEY` | 검색 API 키 |
| Backend URL | `REACT_APP_BACKEND_URL` | - | Backend 사용 시 설정 |
| Model | `REACT_APP_LLM_MODEL` | `OPENAI_MODEL` | 사용할 모델명 |

## 트러블슈팅

### CORS 오류

Backend의 `ALLOWED_ORIGINS` 환경변수를 확인하세요:

```env
# backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Connection Refused

1. Backend 서버가 실행 중인지 확인
2. 포트 번호가 일치하는지 확인
3. 방화벽 설정 확인

### API 키 오류

1. `.env` 파일이 올바른 위치에 있는지 확인
2. API 키에 공백이나 따옴표가 없는지 확인
3. API 키가 유효한지 공식 문서에서 확인

### Import 오류 (Backend)

Backend는 독립적인 Python 모듈로 실행됩니다:

```bash
cd backend
python -m __main__  # 올바른 방법
```

패키지로 설치하려면:
```bash
pip install -e .
```

## 프로덕션 배포

### Frontend

```bash
cd frontend
npm run build
# build/ 폴더를 정적 호스팅 서비스에 배포
```

### Backend

```bash
cd backend
# 프로덕션 환경변수 설정
export APP_ENV=production

# Gunicorn 또는 다른 WSGI 서버 사용
pip install gunicorn
gunicorn api:app -w 4 -k uvicorn.workers.UvicornWorker
```

또는 Docker 사용:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 참고 자료

- [Frontend README](../frontend/README.md)
- [Backend README](../backend/README.md)
- [Main README](../README.md)
