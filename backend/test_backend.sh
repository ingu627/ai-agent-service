#!/bin/bash

# AI Agent Service - Backend 테스트 스크립트

echo "🚀 AI Agent Backend 테스트 시작..."

# Backend 디렉토리로 이동
cd "$(dirname "$0")"

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo "❌ .env 파일이 없습니다. .env.example을 복사하여 .env 파일을 생성하세요."
    echo "   cp .env.example .env"
    exit 1
fi

# 필수 환경변수 확인
source .env

if [ "$LLM_PROVIDER" = "openai" ] && [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY가 설정되지 않았습니다."
    exit 1
fi

if [ "$LLM_PROVIDER" = "perplexity" ] && [ -z "$PERPLEXITY_API_KEY" ]; then
    echo "❌ PERPLEXITY_API_KEY가 설정되지 않았습니다."
    exit 1
fi

echo "✅ 환경변수 확인 완료"
echo "   LLM_PROVIDER: $LLM_PROVIDER"

# Health check
echo ""
echo "🏥 Health Check 테스트..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/healthz 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Backend 서버가 실행 중입니다."
    echo "   응답: $HEALTH_RESPONSE"
else
    echo "❌ Backend 서버에 연결할 수 없습니다."
    echo "   서버를 먼저 실행하세요: python -m __main__"
    exit 1
fi

# Chat API 테스트
echo ""
echo "💬 Chat API 테스트..."

CHAT_RESPONSE=$(curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "안녕하세요! 간단히 인사해주세요."}
    ],
    "useSearch": false
  }')

if [ $? -eq 0 ]; then
    echo "✅ Chat API 테스트 성공"
    echo "   응답 미리보기:"
    echo "$CHAT_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20
else
    echo "❌ Chat API 테스트 실패"
    exit 1
fi

echo ""
echo "🎉 모든 테스트 완료!"
