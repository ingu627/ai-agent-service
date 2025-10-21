# AI Agent Service

![AI Agent UI](docs/imgs/ui_agent.png)

An AI assistant that combines OpenAI GPT or Perplexity models with real-time Tavily web search.

## Highlights

- **Conversational agent** – generate contextual answers through OpenAI or Perplexity (provider configured in `.env`).
- **Token streaming** – display responses as they stream; Perplexity also supports SSE streaming.
- **Search grounding** – enrich answers with Tavily results when fresh information is needed (requires Tavily API key).
- **Quick prompts** – fire commonly used prompts via one-click shortcuts.
- **Conversation history** – automatically persist chats and export them as JSON when needed.
- **Keyboard shortcuts** – accelerate new chats, exports, and resets via hotkeys.

## 🔧 Tech stack

### Frontend

- **React 18** – modern React hooks and Suspense
- **TypeScript** – type-safe UI development
- **Tailwind CSS** – utility-first styling
- **Lucide React** – icon set

### APIs & services

- **OpenAI / Perplexity API** – conversational models
- **Tavily Search API** – real-time web context
- **LocalStorage** – lightweight persistence

### Tooling

- **Create React App** – project bootstrap
- **ESLint & Prettier** – code quality
- **PostCSS** – CSS post-processing

## 🎯 Usage

### Typical flow

1. Type a request and press Enter (Shift+Enter inserts a new line).
2. Use a quick prompt when you want a ready-made instruction.
3. Export the conversation as JSON and share it with your backend or teammates.

> 💡 **Streaming mode:** when the model supports streaming, tokens appear in real time instead of arriving as a single block.

### Keyboard shortcuts

- `Enter`: send message
- `Shift + Enter`: new line
- `Ctrl/Cmd + E`: export conversation
- `Ctrl/Cmd + Backspace`: clear conversation

## 🔒 Security considerations

- Keep API keys in environment variables only (`frontend/.env`).
- `.env` files are ignored by Git by default.
- Be deliberate about exposing keys when calling APIs from the browser.
- Avoid putting sensitive information into chat transcripts.

## 🤝 Contributing

1. Fork this repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a pull request.

## 📞 Support

- Bug reports: GitHub Issues
- Feature ideas: GitHub Discussions
- Email: <ingu627@gmail.com>

## 🏆 Changelog

### v1.0.0 (2025-10-04)

- Integrated OpenAI and Perplexity models
- Added Tavily web search integration
- Introduced a Notion-style UI with glassmorphism accents
- Persisted conversations in local storage
- Added keyboard shortcuts and responsive design
- Enabled Docker and GHCR deployment workflow
- Delivered FastAPI backend support
- Filtered `<think>` tags from reasoning models

## 🐳 Docker deployment

See the [Docker deployment guide](docs/DOCKER.md) for full instructions.

### Quick start

```bash
# Local run
docker-compose up -d

# Production (GHCR images)
docker-compose -f docker-compose.prod.yml up -d
```

⭐ If this project helped you, please star the repository!

## UI overview

- Single-card dark layout keeps input and history visible together.
- Message bubbles and typing indicator stay minimal to match the console theme.
- Only essential quick actions remain: quick prompts, export, and new chat.

## 📁 Project structure

```text
ai-agent-service/
├── README.md
├── .gitignore
├── frontend/                    # React frontend
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env                     # Local env variables (gitignored)
│   ├── .env.example             # Env variable template
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/          # React components
│       │   ├── ChatBot.tsx      # Chat interface
│       │   ├── MessageBubble.tsx
│       │   ├── TypingIndicator.tsx
│       │   ├── WelcomeMessage.tsx
│       │   └── AIAgent.ts
│       ├── hooks/
│       │   └── useKeyboardShortcuts.ts
│       ├── services/            # API + storage helpers
│       ├── types.ts
│       ├── index.css
│       ├── index.tsx
│       └── App.tsx
├── backend/                     # FastAPI backend
│   ├── __init__.py
│   ├── __main__.py
│   ├── api.py
│   ├── app_logging.py
│   ├── config.py
│   ├── schemas.py
│   ├── search.py
│   ├── services.py
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── .env.example
│   └── README.md
└── docs/                        # Additional guides and assets
    ├── DOCKER.md
    ├── DOCKER_TROUBLESHOOTING.md
    ├── INTEGRATION.md
    ├── CHANGES.md
    └── imgs/
        └── ui_agent.png
```

## Optional backend

The frontend can talk to OpenAI/Perplexity directly. To proxy requests through the FastAPI backend instead:

### 1. Configure backend environment

```bash
cd backend
cp .env.example .env
# fill in API keys inside .env
```

### 2. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 3. Start the backend server

```bash
python -m __main__
# or
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Tell the frontend to use the backend

Add the following to `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

Restart the frontend and all API calls will flow through the backend.
