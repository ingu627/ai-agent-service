#!/bin/bash

# AI Agent Service - Docker 빌드 및 GHCR 푸시 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 변수 설정
GITHUB_USERNAME="${GITHUB_USERNAME:-ingu627}"
REGISTRY="ghcr.io"
REPO_NAME="ai-agent-service"
VERSION="${VERSION:-latest}"

echo -e "${GREEN}🐳 AI Agent Service Docker 빌드 시작${NC}"
echo "================================================"
echo "Registry: $REGISTRY"
echo "Username: $GITHUB_USERNAME"
echo "Version: $VERSION"
echo "================================================"

# GitHub Token 확인
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ GITHUB_TOKEN 환경변수가 설정되지 않았습니다.${NC}"
    echo "다음 명령어로 설정하세요:"
    echo "export GITHUB_TOKEN=your_github_token"
    exit 1
fi

# GHCR 로그인
echo -e "\n${YELLOW}🔐 GHCR 로그인 중...${NC}"
echo $GITHUB_TOKEN | docker login $REGISTRY -u $GITHUB_USERNAME --password-stdin

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ GHCR 로그인 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ GHCR 로그인 성공${NC}"

# Backend 빌드
echo -e "\n${YELLOW}🏗️  Backend 이미지 빌드 중...${NC}"
docker build \
    -t $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/backend:$VERSION \
    -t $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/backend:latest \
    ./backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend 빌드 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend 빌드 완료${NC}"

# Backend 푸시
echo -e "\n${YELLOW}📤 Backend 이미지 푸시 중...${NC}"
docker push $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/backend:$VERSION
docker push $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/backend:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend 푸시 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend 푸시 완료${NC}"

# Frontend 빌드
echo -e "\n${YELLOW}🏗️  Frontend 이미지 빌드 중...${NC}"
docker build \
    -t $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/frontend:$VERSION \
    -t $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/frontend:latest \
    --build-arg REACT_APP_BACKEND_URL=/api \
    ./frontend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend 빌드 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend 빌드 완료${NC}"

# Frontend 푸시
echo -e "\n${YELLOW}📤 Frontend 이미지 푸시 중...${NC}"
docker push $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/frontend:$VERSION
docker push $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/frontend:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend 푸시 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend 푸시 완료${NC}"

# 완료
echo -e "\n${GREEN}🎉 모든 이미지가 성공적으로 빌드 및 푸시되었습니다!${NC}"
echo ""
echo "배포된 이미지:"
echo "- $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/backend:$VERSION"
echo "- $REGISTRY/$GITHUB_USERNAME/$REPO_NAME/frontend:$VERSION"
echo ""
echo "다음 명령어로 실행할 수 있습니다:"
echo "docker-compose -f docker-compose.prod.yml up -d"
