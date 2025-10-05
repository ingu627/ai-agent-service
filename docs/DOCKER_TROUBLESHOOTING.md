# Docker 트러블슈팅 가이드

## 일반적인 문제 해결

### 1. Backend 실행 오류: `__main__.__spec__ is None`

**문제:**
```
/usr/local/bin/python: Error while finding module specification for '__main__' (ValueError: __main__.__spec__ is None)
```

**원인:**
- `python -m __main__`은 패키지 구조가 필요함
- 현재 backend는 단순 모듈 구조로 되어있음

**해결책:**
✅ Dockerfile에서 `CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]` 사용

**대안:**
```dockerfile
# 방법 1: uvicorn 직접 실행 (현재 사용)
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]

# 방법 2: start.py 스크립트 실행
CMD ["python", "start.py"]

# 방법 3: __main__.py 직접 실행
CMD ["python", "__main__.py"]
```

### 2. 이미지 빌드 실패

**문제:**
```
ERROR: failed to solve: failed to compute cache key
```

**해결책:**
```bash
# 캐시 없이 빌드
docker-compose build --no-cache

# 또는 완전히 정리 후 빌드
docker system prune -a
docker-compose up --build
```

### 3. 환경변수가 적용되지 않음

**문제:**
Frontend에서 `REACT_APP_*` 환경변수가 undefined

**원인:**
React 앱은 빌드 시점에 환경변수가 주입됨

**해결책:**
```bash
# .env 파일 수정 후 반드시 재빌드
docker-compose down
docker-compose up --build
```

### 4. CORS 오류

**문제:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**해결책:**

Backend `.env` 파일에서:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost,http://localhost:80
```

또는 docker-compose.yml에서:
```yaml
environment:
  - ALLOWED_ORIGINS=http://localhost:3000,http://localhost
```

### 5. 컨테이너가 즉시 종료됨

**문제:**
```
ai-agent-backend exited with code 1
```

**디버깅:**
```bash
# 로그 확인
docker logs ai-agent-backend

# 컨테이너 내부 접속 (컨테이너가 실행 중일 때)
docker exec -it ai-agent-backend /bin/bash

# 컨테이너를 유지하면서 명령어 오버라이드
docker-compose run --rm backend /bin/bash
```

### 6. 포트 충돌

**문제:**
```
Error starting userland proxy: listen tcp 0.0.0.0:8000: bind: address already in use
```

**해결책:**
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :8000
lsof -i :80

# 프로세스 종료
kill -9 <PID>

# 또는 docker-compose.yml에서 포트 변경
ports:
  - "8001:8000"  # 호스트:컨테이너
```

### 7. 볼륨 권한 문제

**문제:**
```
PermissionError: [Errno 13] Permission denied
```

**해결책:**
```dockerfile
# Dockerfile에 사용자 추가
RUN useradd -m -u 1000 appuser
USER appuser
```

### 8. 빌드된 Frontend가 백엔드를 찾지 못함

**문제:**
Frontend가 `localhost:8000`에 연결할 수 없음

**원인:**
Docker 네트워크 내에서는 `localhost`가 컨테이너 자신을 가리킴

**해결책:**

**옵션 A: Nginx 프록시 사용 (권장)**
```nginx
location /api/ {
    proxy_pass http://backend:8000/;
}
```

Frontend에서:
```env
REACT_APP_BACKEND_URL=/api
```

**옵션 B: 서비스 이름 사용**
```env
REACT_APP_BACKEND_URL=http://backend:8000
```

### 9. Health check 실패

**문제:**
```
Health check failed
```

**디버깅:**
```bash
# Health check 수동 테스트
docker exec ai-agent-backend curl http://localhost:8000/healthz

# 또는
docker exec ai-agent-backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')"
```

### 10. 이미지 크기가 너무 큼

**해결책:**

**.dockerignore** 파일 생성:
```
# Backend
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.egg-info
dist
build
.pytest_cache
.coverage
htmlcov
.venv
venv

# Frontend
node_modules
build
.git
.env
.env.local
npm-debug.log*
```

**Multi-stage build 사용:**
```dockerfile
# Frontend Dockerfile은 이미 multi-stage build 사용 중
FROM node:18-alpine AS builder
# ... build ...
FROM nginx:alpine
# ... production ...
```

## 유용한 명령어

### Docker Compose

```bash
# 빌드 및 시작
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 특정 서비스만 시작
docker-compose up backend

# 로그 확인
docker-compose logs -f
docker-compose logs -f backend

# 중지 및 삭제
docker-compose down

# 볼륨까지 삭제
docker-compose down -v

# 재시작
docker-compose restart
docker-compose restart backend
```

### Docker 일반

```bash
# 실행 중인 컨테이너 확인
docker ps

# 모든 컨테이너 확인
docker ps -a

# 이미지 목록
docker images

# 컨테이너 로그
docker logs <container_id>
docker logs -f <container_id>  # 실시간

# 컨테이너 내부 접속
docker exec -it <container_id> /bin/bash
docker exec -it <container_id> /bin/sh  # Alpine Linux

# 컨테이너 중지/시작
docker stop <container_id>
docker start <container_id>
docker restart <container_id>

# 컨테이너/이미지 삭제
docker rm <container_id>
docker rmi <image_id>

# 정리
docker system prune        # 사용하지 않는 리소스
docker system prune -a     # 모든 사용하지 않는 이미지
docker volume prune        # 사용하지 않는 볼륨
```

### 디버깅

```bash
# 컨테이너 상태 확인
docker inspect <container_id>

# 네트워크 확인
docker network ls
docker network inspect ai-agent-network

# 리소스 사용량
docker stats

# 컨테이너 내부 프로세스
docker top <container_id>
```

## 빠른 재시작 절차

```bash
# 완전 정리 후 재시작
docker-compose down -v
docker system prune -f
docker-compose up --build -d

# 또는 간단히
docker-compose down
docker-compose up --build
```

## 프로덕션 체크리스트

- [ ] 환경변수 파일 (.env) 보안 확인
- [ ] API 키가 하드코딩되지 않았는지 확인
- [ ] CORS 설정이 적절한지 확인
- [ ] Health check가 작동하는지 확인
- [ ] 로그가 적절히 출력되는지 확인
- [ ] 이미지 크기 최적화
- [ ] 보안 업데이트 적용
- [ ] 리소스 제한 설정 (cpu, memory)
- [ ] 재시작 정책 설정 (restart: always)
- [ ] 백업 전략 수립

## 참고 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [FastAPI 배포 가이드](https://fastapi.tiangolo.com/deployment/docker/)
- [React 프로덕션 빌드](https://create-react-app.dev/docs/production-build/)
