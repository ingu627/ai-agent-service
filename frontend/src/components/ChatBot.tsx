import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Download, Circle, Plus } from 'lucide-react';
import { Message, ChatState } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { generateAIResponse, shouldUseSearch, getActiveAIProvider } from '../services/apiService';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../services/storageService';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const quickPrompts = [
  'Python 백엔드와 연동할 REST API 계약 초안을 작성해줘.',
  '프론트엔드에서 사용할 에이전트 기능 테스트 시나리오를 만들어줘.',
  'AI 에이전트 대시보드에 필요한 핵심 위젯을 제안해줘.'
];

const ChatBot: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    inputValue: '',
  });

  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);

  const [isInputFocused, setIsInputFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const aiProvider = getActiveAIProvider();
  const hasPerplexityKey = Boolean(process.env.REACT_APP_PERPLEXITY_API_KEY);
  const hasOpenAIKey = Boolean(process.env.REACT_APP_OPENAI_API_KEY);

  const hasDirectApi = backendUrl
    ? false
    : aiProvider === 'perplexity'
      ? hasPerplexityKey
      : hasOpenAIKey;

  const currentModel = backendUrl
    ? 'python-backend'
    : aiProvider === 'perplexity'
      ? (process.env.REACT_APP_PERPLEXITY_MODEL || process.env.REACT_APP_LLM_MODEL || 'llama-3.1-sonar-small-128k-online')
      : (process.env.REACT_APP_LLM_MODEL || 'gpt-3.5-turbo');

  const connectionLabel = backendUrl
    ? 'Python 백엔드 연결 준비됨'
    : hasDirectApi
      ? aiProvider === 'perplexity'
        ? 'Perplexity API 연결됨'
        : 'OpenAI API 연결됨'
      : '연결 설정 필요';

  const connectionTone = backendUrl
    ? 'text-emerald-400'
    : hasDirectApi
      ? 'text-indigo-300'
      : 'text-rose-400';

  const handleClearChat = useCallback(() => {
    setChatState({ messages: [], isLoading: false, inputValue: '' });
    setConversationHistory([]);
    clearChatHistory();
  }, []);

  const handleExportChat = useCallback(() => {
    if (chatState.messages.length === 0) return;

    const chatData = {
      timestamp: new Date().toISOString(),
      model: currentModel,
      backendUrl: backendUrl || null,
      messages: chatState.messages
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-agent-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chatState.messages, currentModel, backendUrl]);

  useKeyboardShortcuts({
    onNewChat: handleClearChat,
    onClearChat: handleClearChat,
    onExportChat: handleExportChat,
    isInputFocused
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  useEffect(() => {
    const savedMessages = loadChatHistory();
    if (savedMessages.length > 0) {
      setChatState(prev => ({ ...prev, messages: savedMessages }));
      const history = savedMessages.reduce((acc, msg) => {
        if (msg.sender === 'user') {
          acc.push({ role: 'user', content: msg.content });
        } else if (msg.sender === 'ai') {
          acc.push({ role: 'assistant', content: msg.content });
        }
        return acc;
      }, [] as Array<{ role: 'user' | 'assistant'; content: string }>);
      setConversationHistory(history);
    }
  }, []);

  useEffect(() => {
    if (chatState.messages.length > 0) {
      saveChatHistory(chatState.messages);
    }
  }, [chatState.messages]);

  const handleSuggestionClick = (suggestion: string) => {
    setChatState(prev => ({ ...prev, inputValue: suggestion }));
    requestAnimationFrame(() => {
      adjustTextareaHeight();
      inputRef.current?.focus();
    });
    setTimeout(() => {
      handleMessageSend(suggestion);
    }, 60);
  };

  const handleMessageSend = async (messageContent: string) => {
    const trimmedInput = messageContent.trim();
    if (!trimmedInput || chatState.isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputValue: '',
      isLoading: true,
    }));

    const useSearch = !backendUrl && shouldUseSearch(trimmedInput);

    try {
      const newHistory = [...conversationHistory, { role: 'user' as const, content: trimmedInput }];
      const aiResponse = await generateAIResponse(newHistory, useSearch);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        useSearch
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
      }));

      setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Error generating AI response:', error);

      const details = error instanceof Error
        ? `\n\n세부 정보: ${error.message}`
        : '';

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `죄송합니다. AI 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.${details}`,
        sender: 'ai',
        timestamp: new Date(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleMessageSend(chatState.inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [chatState.inputValue]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-[10%] top-0 h-[28rem] rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16">
        <header className="flex flex-col gap-6 pt-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-indigo-300 ring-1 ring-white/10">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">hyunseokjung</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs text-slate-400 sm:items-end">
            <div className={`inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 font-medium ${connectionTone}`}>
              <Circle className="h-2.5 w-2.5 fill-current" />
              <span className="text-slate-200">{connectionLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>모델</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
                {currentModel}
              </span>
            </div>
          </div>
        </header>

        <main className="mt-12 flex flex-1 flex-col">
          <section className="flex h-[580px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur">
            <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
              {chatState.messages.length === 0 ? (
                <div className="h-full" />
              ) : (
                <div className="flex h-full flex-col gap-5">
                  {chatState.messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {chatState.isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/5 bg-black/20 px-6 py-6 sm:px-10">
              <label className="flex items-center justify-between text-xs text-slate-500">
                <span>에이전트에게 요청을 입력하세요. Enter 전송, Shift+Enter 줄바꿈.</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    새 대화
                  </button>
                  <button
                    type="button"
                    onClick={handleExportChat}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                    title="대화 내보내기 (Ctrl/Cmd + E)"
                  >
                    <Download className="h-3.5 w-3.5" />
                    내보내기
                  </button>
                </div>
              </label>

              <div className="relative mt-4 rounded-2xl border border-white/10 bg-[#080d1a]/80 p-4 pr-20 transition focus-within:border-indigo-500/50">
                <textarea
                  ref={inputRef}
                  value={chatState.inputValue}
                  onChange={(e) => setChatState(prev => ({ ...prev, inputValue: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="에이전트에게 필요한 작업을 지시하세요"
                  className="h-24 w-full resize-none border-none bg-transparent pr-16 text-base leading-relaxed text-white placeholder-slate-500 focus:outline-none"
                  disabled={chatState.isLoading}
                />
                <button
                  type="submit"
                  disabled={!chatState.inputValue.trim() || chatState.isLoading}
                  className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-500 p-3 text-white shadow-lg shadow-indigo-500/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/30"
                >
                  <span className="sr-only">전송</span>
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSuggestionClick(prompt)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ChatBot;
