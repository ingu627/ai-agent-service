# AI Agent Backend

FastAPI 기반의 **AI Agent 백엔드** 프로젝트입니다. OpenAI 또는 Perplexity Chat Completions를 활용해 프론트엔드와 통신하며, 필요 시 Tavily 검색을 병행해 최신 정보를 포함한 답변을 제공합니다.


## 목차

- [AI Agent Backend](#ai-agent-backend)
  - [목차](#목차)
  - [요구 사항](#요구-사항)
  - [빠른 시작](#빠른-시작)
  - [환경 변수](#환경-변수)
    - [LLM 공급자 전환](#llm-공급자-전환)
  - [로컬 서버 실행](#로컬-서버-실행)
  - [API 개요](#api-개요)
    - [`GET /healthz`](#get-healthz)
    - [`POST /chat`](#post-chat)
      - [요청 예시](#요청-예시)
      - [응답 예시](#응답-예시)
  - [프론트엔드 연동](#프론트엔드-연동)
  - [테스트](#테스트)
  - [프로젝트 구조](#프로젝트-구조)
  - [배포 팁](#배포-팁)


## 요구 사항

- Python 3.10 이상
- pip 또는 conda
- OpenAI API Key (OpenAI 사용 시 필수)
- Perplexity API Key (Perplexity 사용 시 필수)
- Tavily API Key (선택: 검색 기능 활성화 시)


## 빠른 시작

```bash
# 1) 프로젝트 루트로 이동
cd backend

# 2) Python 가상환경 생성 (선택)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3) 의존성 설치
pip install -r requirements.txt

# 또는 pyproject.toml 사용
pip install -e .

# (선택) 테스트 도구까지 설치하려면
pip install -e .[test]
```


## 환경 변수

`.env` 파일을 프로젝트 루트에 두면 자동으로 로드됩니다. 기본값과 용도는 아래와 같습니다.

| 변수 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `LLM_PROVIDER` |  | `openai` | 사용할 LLM 공급자 (`openai`, `perplexity`) |
| `OPENAI_API_KEY` | ✅ (OpenAI) | 없음 | LLM_PROVIDER가 `openai`일 때 필수인 OpenAI API Key |
| `OPENAI_MODEL` |  | `gpt-4o-mini` | OpenAI 사용 시 모델 이름 |
| `PERPLEXITY_API_KEY` | ✅ (Perplexity) | 없음 | LLM_PROVIDER가 `perplexity`일 때 필수인 Perplexity API Key |
| `PERPLEXITY_MODEL` |  | `llama-3.1-sonar-large-128k-online` | Perplexity 사용 시 모델 이름 |
| `PERPLEXITY_BASE_URL` |  | `https://api.perplexity.ai` | Perplexity API Base URL (특수 프록시 사용 시 변경) |
| `TAVILY_API_KEY` |  | 없음 | Tavily 검색 API Key (검색 기능 사용 시 필요) |
| `ENABLE_SEARCH` |  | `True` | `False`로 설정하면 검색을 건너뜁니다 |
| `BACKEND_HOST` |  | `0.0.0.0` | Uvicorn 바인딩 호스트 |
| `BACKEND_PORT` |  | `8000` | Uvicorn 포트 |
| `ALLOWED_ORIGINS` |  | `['http://localhost:3000']` | CORS 허용 Origin (콤마 구분 문자열) |
| `LOG_LEVEL` |  | `INFO` | 로그 레벨 |
| `LOG_JSON` |  | `False` | `True`로 설정 시 JSON 포맷 로그 |
| `FASTMCP_TRANSPORT` |  | `http` | FastMCP 전송 방식 (`stdio`, `http`, `sse`) |
| `FASTMCP_HTTP_PATH` |  | `/mcp` | HTTP FastMCP 엔드포인트 경로 |
| `FASTMCP_HTTP_URL` |  | 없음 | 외부에서 FastMCP HTTP 엔드포인트에 접근할 URL |

### LLM 공급자 전환

1. `.env`에 `LLM_PROVIDER=perplexity`를 설정합니다.
2. `PERPLEXITY_API_KEY`와 (필요하다면) `PERPLEXITY_MODEL` 값을 채웁니다. 기본값 `llama-3.1-sonar-large-128k-online`은 온라인 검색이 포함된 최신 Sonar 모델입니다.
3. OpenAI 자격 증명이 더 이상 필요 없다면 `OPENAI_API_KEY`를 제거하거나 비워두세요.
4. 서버를 재시작하면 백엔드가 Perplexity API를 통해 `/chat` 요청을 처리합니다.

## 로컬 서버 실행

```bash
# 환경 변수 준비
cp .env.example .env
# .env 파일을 열어서 API 키들을 입력하세요

# 개발 서버 실행 (방법 1 - 간단)
python -m __main__

# 개발 서버 실행 (방법 2 - uvicorn 직접 사용)
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

서버가 뜨면 `http://localhost:8000/docs`에서 OpenAPI 문서를 확인할 수 있습니다.


## API 개요

### `GET /healthz`

- 헬스 체크 엔드포인트. `{ "status": "ok" }` 응답.

### `POST /chat`

사용자 메시지 목록을 받아 OpenAI 응답과 검색 정보를 반환합니다.

#### 요청 예시

```json
{
  "messages": [
    { "role": "user", "content": "AI 에이전트 백엔드를 소개해줘" }
  ],
  "useSearch": true
}
```

#### 응답 예시

```json
{
  "reply": "...", 
  "usedSearch": true,
  "model": "gpt-4o-mini",
  "latencyMs": 732,
  "citations": ["https://example.com"]
}
```

- `useSearch`가 `true`이면서 Tavily 키가 설정되어 있으면 검색 스니펫을 system 메시지로 추가합니다.
- `messages`가 비어 있거나 `user` 역할 메시지가 없으면 400 에러를 반환합니다.


## 프론트엔드 연동

`ai-agent-frontend` 저장소와 연동하려면 다음 단계를 따르세요.

- 백엔드 서버를 `http://localhost:8000`에서 실행합니다.
- 프론트엔드 저장소(`https://github.com/ingu627/ai-agent-frontend`)에서 `.env.local` 또는 환경 설정에 백엔드 URL을 지정합니다.  
  예시 (`.env.local`):

  ```bash
  REACT_APP_BACKEND_URL=http://localhost:8000
  # 선택: 백엔드 기본 모델을 덮어쓰고 싶다면
  # REACT_APP_LLM_MODEL=gpt-4o-mini
  ```

  `REACT_APP_BACKEND_URL`가 설정되어 있으면 프론트엔드는 OpenAI/Tavily 키 대신 백엔드 `/chat` 엔드포인트로만 요청을 보냅니다. 직접 OpenAI 호출을 사용하려면 이 값을 비우고 `REACT_APP_OPENAI_API_KEY`/`REACT_APP_TAVILY_API_KEY`를 설정하세요.
- 필요한 경우 백엔드의 `ALLOWED_ORIGINS`에 프론트엔드 도메인을 추가합니다.
- 프론트엔드를 실행하면 `/chat` 엔드포인트로 요청해 답변/검색 결과를 렌더링합니다.


## 테스트

```bash
bash -lc "python -m pytest"
```

- `pytest-asyncio`와 `respx`를 활용해 비동기 FastAPI 엔드포인트와 외부 의존성(검색)을 모킹합니다.
- 테스트는 `tests/test_chat_endpoint.py`에 위치합니다.
- Python 3.11 이상과 `pip install -e .[test]`로 설치한 의존성이 필요합니다. 다른 파이썬 버전(예: 3.9)에서 실행하면 `httpx` 미설치 등의 오류가 발생합니다.


## 프로젝트 구조

```text
src/
  ai_agent_backend/
    api.py          # FastAPI 앱 및 라우트 정의
    config.py       # pydantic Settings 기반 환경 변수 로딩
    logging.py      # structlog 기반 로깅 설정
    schemas.py      # 요청/응답 Pydantic 모델
    search.py       # Tavily 검색 래퍼
    services.py     # OpenAI ChatService 구현
tests/
  test_chat_endpoint.py
```


## 배포 팁

- 프로덕션에서는 `uvicorn`을 `gunicorn`(혹은 `hypercorn`)과 함께 다중 워커로 실행하는 것을 권장합니다.
- OpenAI / Tavily 키는 비공개 환경 변수로 주입하세요 (예: `systemd` 서비스 파일, Kubernetes Secret 등).
- 로깅을 중앙화하고 싶다면 `LOG_JSON=True`로 설정 후 ELK, CloudWatch와 같은 수집기에 연결하세요.

궁금한 점이나 개선 아이디어가 있다면 이슈/PR로 공유해 주세요!
