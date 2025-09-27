# AI Agent

![AI Agent UI](imgs/ui_agent.png)

OpenAI GPT와 실시간 웹 검색이 통합된 차세대 AI 어시스턴트입니다.

## 주요 기능

- **대화형 에이전트**: OpenAI Chat 모델을 사용해 맥락 있는 답변을 제공합니다. 모델은 `.env`에서 바꿀 수 있습니다.
- **웹 검색 보조**: 최신 정보를 요구하는 질문이면 Tavily API를 통해 검색한 뒤 응답에 녹여줍니다. (API 키가 있을 때만 동작)
- **빠른 지시 프롬프트**: 자주 쓰는 시나리오를 버튼으로 제공해 바로 요청을 보낼 수 있습니다.
- **대화 관리**: 로컬 스토리지에 자동 저장되고, 필요하면 JSON으로 내보낼 수 있습니다.
- **키보드 단축키**: 새 대화, 내보내기 같은 자주 쓰는 액션을 단축키로 지원합니다.

## 시작하기

### 1. 프로젝트 클론

```bash
git clone https://github.com/yourusername/ai_agent.git
cd ai_agent
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_TAVILY_API_KEY=your_tavily_api_key_here
REACT_APP_LLM_MODEL=gpt-3.5-turbo
# 선택 사항: Python 백엔드 연동 시 사용
# REACT_APP_BACKEND_URL=https://your-backend.example.com
```

#### API 키 발급 방법

- **OpenAI API**: <https://platform.openai.com/api-keys>
- **Tavily Search API**: <https://tavily.com/>

### 4. 개발 서버 실행

```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 화면 구성

- 단일 카드 형태의 어두운 콘솔 레이아웃으로, 입력창과 대화 내역이 한 화면에 들어옵니다.
- 메시지 버블과 타이핑 인디케이터는 최소한의 장식만 남겨 톤을 맞췄습니다.
- 빠른 프롬프트 버튼과 내보내기/새 대화 버튼만 남겨 꼭 필요한 기능만 제공합니다.

## 📁 프로젝트 구조

```text
ai_agent/
├── public/
│   └── index.html
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── ChatBot.tsx     # 메인 채팅 인터페이스
│   │   ├── MessageBubble.tsx   # 메시지 버블
│   │   ├── TypingIndicator.tsx # 타이핑 표시
│   │   └── AIAgent.ts          # 에이전트 로직
│   ├── hooks/              # Custom React Hooks
│   │   └── useKeyboardShortcuts.ts
│   ├── services/           # 외부 서비스 연동
│   │   ├── apiService.ts   # OpenAI/Tavily API
│   │   └── storageService.ts # 로컬 저장소
│   ├── types.ts           # TypeScript 타입 정의
│   ├── index.css         # 글로벌 스타일
│   ├── index.tsx         # 앱 진입점
│   └── App.tsx          # 메인 앱 컴포넌트
├── .env                 # 환경변수 (git에서 제외)
├── package.json
└── README.md
```

## 🔧 기술 스택

### Frontend

- **React 18** - 최신 React 기능 활용
- **TypeScript** - 타입 안전성 보장
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Lucide React** - 아이콘 라이브러리

### APIs & Services

- **OpenAI API** - GPT 모델 활용
- **Tavily Search API** - 실시간 웹 검색
- **LocalStorage** - 클라이언트 데이터 저장

### 개발 도구

- **Create React App** - 프로젝트 부트스트래핑
- **ESLint** - 코드 품질 관리
- **PostCSS** - CSS 후처리

## 🎯 사용법

### 기본 사용 흐름

1. 하단 입력창에 요청을 적고 Enter를 누릅니다. (Shift+Enter는 줄바꿈)
2. 필요하면 빠른 프롬프트 버튼을 눌러 바로 실행할 수도 있습니다.
3. 결과가 마음에 들면 우측 상단의 내보내기 버튼으로 JSON을 내려받아 백엔드와 공유하세요.

### 키보드 단축키

- `Enter`: 메시지 전송
- `Shift + Enter`: 줄바꿈
- `Ctrl + E`: 대화 내역 내보내기
- `Ctrl + Backspace`: 대화 초기화

## 🔒 보안 고려사항

- API 키는 환경변수로만 관리
- `.env` 파일은 Git에서 자동 제외
- 클라이언트 사이드 API 호출 시 키 노출 주의
- 민감한 정보는 대화에 포함하지 않는 것을 권장

## 🤝 기여하기

1. 이 저장소를 Fork하세요
2. 새 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📞 문의 및 지원

- 버그 리포트: GitHub Issues를 이용해주세요
- 기능 제안: Discussions 탭을 활용해주세요
- 이메일: <ingu627@gmail.com>

## 🏆 업데이트 로그

### v1.0.0 (2025-09-23)

- ✨ OpenAI GPT 모델 통합
- 🔍 Tavily 웹 검색 API 연동
- 🎨 Notion 스타일 UI 구현
- 💾 로컬 저장소 기능
- ⌨️ 키보드 단축키 지원
- 📱 반응형 디자인
- 🌟 글래스모피즘 적용

---

⭐ 이 프로젝트가 유용했다면 Star를 눌러주세요!
