# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 환경변수를 빌드 시점에 주입하기 위한 ARG
ARG REACT_APP_AI_PROVIDER
ARG REACT_APP_OPENAI_API_KEY
ARG REACT_APP_PERPLEXITY_API_KEY
ARG REACT_APP_PERPLEXITY_MODEL
ARG REACT_APP_TAVILY_API_KEY
ARG REACT_APP_LLM_MODEL
ARG REACT_APP_BACKEND_URL

# 빌드
RUN npm run build

# Production stage - Nginx로 정적 파일 서빙
FROM nginx:alpine

# Nginx 설정 복사
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
