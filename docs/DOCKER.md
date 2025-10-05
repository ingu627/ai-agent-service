# Docker 배포 가이드

이 문서는 AI Agent Service를 Docker를 사용하여 GitHub Container Registry (GHCR)에 배포하는 방법을 설명합니다.

## 📋 목차

- [사전 요구사항](#사전-요구사항)
- [로컬 Docker 빌드 및 실행](#로컬-docker-빌드-및-실행)
- [GHCR에 수동 푸시](#ghcr에-수동-푸시)
- [GitHub Actions 자동 배포](#github-actions-자동-배포)
- [프로덕션 배포](#프로덕션-배포)

## 사전 요구사항

- Docker 및 Docker Compose 설치
- GitHub 계정 및 저장소
- GitHub Personal Access Token (GHCR 접근용)

## 로컬 Docker 빌드 및 실행

### 1. 환경변수 설정

루트 디렉토리에 `.env` 파일 생성:

```bash
# .env 파일 생성
cat > .env << 'EOF'
# LLM Provider
LLM_PROVIDER=perplexity
REACT_APP_AI_PROVIDER=perplexity

# API Keys
OPENAI_API_KEY=your_openai_key_here
REACT_APP_OPENAI_API_KEY=your_openai_key_here

PERPLEXITY_API_KEY=your_perplexity_key_here
REACT_APP_PERPLEXITY_API_KEY=your_perplexity_key_here

TAVILY_API_KEY=your_tavily_key_here
REACT_APP_TAVILY_API_KEY=your_tavily_key_here

# Models
PERPLEXITY_MODEL=sonar-reasoning-pro
REACT_APP_PERPLEXITY_MODEL=sonar-reasoning-pro
REACT_APP_LLM_MODEL=gpt-3.5-turbo

# Backend URL
REACT_APP_BACKEND_URL=http://localhost:8000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost
EOF
```

### 2. Docker Compose로 실행

```bash
# 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

### 3. 접속

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **Backend API Docs**: http://localhost:8000/docs

## GHCR에 수동 푸시

### 1. GitHub Personal Access Token 생성

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. 권한 선택:
   - `write:packages` - 패키지 업로드
   - `read:packages` - 패키지 다운로드
   - `delete:packages` - 패키지 삭제 (선택)
4. Token 복사 및 안전하게 보관

### 2. GHCR 로그인

```bash
# GitHub username과 token으로 로그인
export CR_PAT=YOUR_GITHUB_TOKEN
echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 3. 이미지 빌드

```bash
# Backend 빌드
docker build -t ghcr.io/ingu627/ai-agent-service/backend:latest ./backend

# Frontend 빌드
docker build -t ghcr.io/ingu627/ai-agent-service/frontend:latest \
  --build-arg REACT_APP_BACKEND_URL=http://your-backend-url:8000 \
  ./frontend
```

### 4. 이미지 푸시

```bash
# Backend 푸시
docker push ghcr.io/ingu627/ai-agent-service/backend:latest

# Frontend 푸시
docker push ghcr.io/ingu627/ai-agent-service/frontend:latest
```

### 5. 이미지 공개 설정 (선택)

1. GitHub → 해당 저장소 → Packages
2. 각 패키지 클릭 → Package settings
3. "Change visibility" → Public 선택

## GitHub Actions 자동 배포

### 1. GitHub Actions 설정

`.github/workflows/docker-publish.yml` 파일이 이미 생성되어 있습니다.

### 2. 자동 빌드 트리거

**다음 상황에서 자동으로 빌드 및 푸시:**

- `main` 브랜치에 push
- `v*` 태그 생성 (예: `v1.0.0`)
- Pull Request 생성 (빌드만, 푸시 안 함)
- 수동 실행 (workflow_dispatch)

### 3. 버전 태그 배포

```bash
# 버전 태그 생성 및 푸시
git tag v1.0.0
git push origin v1.0.0

# 자동으로 다음 태그로 이미지 생성:
# - ghcr.io/ingu627/ai-agent-service/backend:v1.0.0
# - ghcr.io/ingu627/ai-agent-service/backend:1.0
# - ghcr.io/ingu627/ai-agent-service/backend:latest
```

### 4. 수동 실행

1. GitHub → Actions → "Build and Push to GHCR"
2. "Run workflow" 클릭
3. 브랜치 선택 후 실행

## 프로덕션 배포

### 1. 서버에서 이미지 Pull

```bash
# GHCR 로그인
echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# 이미지 Pull
docker pull ghcr.io/ingu627/ai-agent-service/backend:latest
docker pull ghcr.io/ingu627/ai-agent-service/frontend:latest
```

### 2. Docker Compose로 프로덕션 실행

프로덕션용 `docker-compose.prod.yml` 생성:

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/ingu627/ai-agent-service/backend:latest
    container_name: ai-agent-backend
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
      - LLM_PROVIDER=${LLM_PROVIDER}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    restart: always
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: ghcr.io/ingu627/ai-agent-service/frontend:latest
    container_name: ai-agent-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

실행:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Nginx 리버스 프록시 (선택)

프로덕션 환경에서 HTTPS 사용:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 유용한 Docker 명령어

```bash
# 실행 중인 컨테이너 확인
docker ps

# 로그 확인
docker logs ai-agent-backend
docker logs ai-agent-frontend

# 컨테이너 재시작
docker restart ai-agent-backend
docker restart ai-agent-frontend

# 컨테이너 중지
docker stop ai-agent-backend ai-agent-frontend

# 컨테이너 삭제
docker rm ai-agent-backend ai-agent-frontend

# 이미지 삭제
docker rmi ghcr.io/ingu627/ai-agent-service/backend:latest
docker rmi ghcr.io/ingu627/ai-agent-service/frontend:latest

# 빌드 캐시 정리
docker builder prune

# 사용하지 않는 리소스 정리
docker system prune -a
```

## 트러블슈팅

### GHCR 푸시 권한 오류

```bash
# Token 권한 확인
# write:packages 권한이 있는지 확인

# 다시 로그인
docker logout ghcr.io
echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 이미지가 업데이트되지 않음

```bash
# 캐시 없이 빌드
docker-compose build --no-cache

# 이미지 강제 Pull
docker-compose pull
```

### 환경변수가 적용되지 않음

Frontend는 빌드 시점에 환경변수가 주입되므로:

```bash
# .env 파일 수정 후 반드시 재빌드
docker-compose up --build
```

## 보안 권장사항

1. **API 키 관리**
   - `.env` 파일을 Git에 커밋하지 마세요
   - GitHub Secrets 사용 (Actions용)
   - 프로덕션에서는 Secret Manager 사용

2. **이미지 보안**
   - 정기적으로 이미지 업데이트
   - 취약점 스캔: `docker scan`
   - 최소 권한 원칙

3. **네트워크 보안**
   - HTTPS 사용
   - CORS 설정 확인
   - Rate limiting 적용

---

작성일: 2025-10-04
작성자: GitHub Copilot
