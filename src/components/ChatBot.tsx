import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Search, Zap, Trash2, Download } from 'lucide-react';
import { Message, ChatState } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeMessage from './WelcomeMessage';
import { generateAIResponse, shouldUseSearch } from '../services/apiService';
import { detectIntent } from './AIAgent';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../services/storageService';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const ChatBot: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    inputValue: '',
  });

  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);

  const [retryCount, setRetryCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // API 키 확인
  const hasApiKeys = process.env.REACT_APP_OPENAI_API_KEY && process.env.REACT_APP_TAVILY_API_KEY;
  const currentModel = process.env.REACT_APP_LLM_MODEL || 'gpt-3.5-turbo';

  // 대화 내역 클리어 함수를 useCallback으로 먼저 정의
  const handleClearChat = useCallback(() => {
    if (showClearConfirm) {
      setChatState(prev => ({ ...prev, messages: [] }));
      setConversationHistory([]);
      clearChatHistory();
      setShowClearConfirm(false);
      setRetryCount(0);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  }, [showClearConfirm]);

  // 대화 내역 내보내기 함수를 useCallback으로 먼저 정의
  const handleExportChat = useCallback(() => {
    const chatData = {
      timestamp: new Date().toISOString(),
      model: process.env.REACT_APP_LLM_MODEL || 'gpt-3.5-turbo',
      messages: chatState.messages
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chatState.messages]);

  // 키보드 단축키 설정
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

  // 컴포넌트 마운트 시 대화 내역 불러오기
  useEffect(() => {
    const savedMessages = loadChatHistory();
    if (savedMessages.length > 0) {
      setChatState(prev => ({ ...prev, messages: savedMessages }));
      // 대화 히스토리도 복원
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

  // 메시지 변경 시 자동 저장
  useEffect(() => {
    if (chatState.messages.length > 0) {
      saveChatHistory(chatState.messages);
    }
  }, [chatState.messages]);

  const handleSuggestionClick = (suggestion: string) => {
    setChatState(prev => ({ ...prev, inputValue: suggestion }));
    setTimeout(() => {
      handleMessageSend(suggestion);
    }, 100);
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

    // 의도 감지 및 능력 표시
    const detectedIntent = detectIntent(trimmedInput);
    const useSearch = shouldUseSearch(trimmedInput);

    try {
      // 대화 히스토리에 사용자 메시지 추가
      const newHistory = [...conversationHistory, { role: 'user' as const, content: trimmedInput }];

      // AI 응답 생성
      const aiResponse = await generateAIResponse(newHistory, useSearch);

      // AI 메시지 생성
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        capability: detectedIntent?.name,
        useSearch: useSearch
      };

      // 상태 업데이트
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
      }));

      // 대화 히스토리 업데이트
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      setRetryCount(0); // 성공 시 재시도 카운트 리셋

    } catch (error) {
      console.error('Error generating AI response:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `죄송합니다. AI 서비스에 문제가 발생했습니다. ${retryCount < 2 ? '재시도를 원하시면 다시 메시지를 보내주세요.' : '잠시 후 다시 시도해주세요.'}`,
        sender: 'ai',
        timestamp: new Date(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));

      setRetryCount(prev => prev + 1);
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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [chatState.inputValue]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-notion-gray-25 via-white to-notion-gray-50">
      {/* Header with glassmorphism effect */}
      <div className="glass border-b border-white/20 backdrop-blur-md px-6 py-5 shadow-soft">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-medium">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-xl blur opacity-25 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-notion-gray-900 tracking-tight">AI Agent</h1>
              <p className="text-xs text-notion-gray-500 mt-0.5">Powered by Hyunseok Jung</p>
            </div>
            {chatState.messages.length > 0 && (
              <div className="animate-scale-in">
                <span className="text-xs font-medium text-notion-gray-600 bg-notion-gray-100 px-3 py-1.5 rounded-full">
                  {chatState.messages.length} 메시지
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6">
            {/* 대화 관리 버튼들 */}
            {chatState.messages.length > 0 && (
              <div className="flex items-center space-x-2 animate-fade-in">
                <button
                  onClick={handleExportChat}
                  className="p-2.5 text-notion-gray-500 hover:text-notion-gray-700 hover:bg-white/60 rounded-xl transition-all duration-200 hover-lift group"
                  title="대화 내보내기 (Ctrl/Cmd + E)"
                >
                  <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={handleClearChat}
                  className={`p-2.5 rounded-xl transition-all duration-200 hover-lift ${
                    showClearConfirm
                      ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-medium'
                      : 'text-notion-gray-500 hover:text-red-600 hover:bg-white/60'
                  }`}
                  title={showClearConfirm ? '정말 삭제하시겠습니까?' : '대화 삭제 (Ctrl/Cmd + Backspace)'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* API 상태 표시 - 더 세련된 디자인 */}
            <div className="flex items-center space-x-4 text-xs">
              {hasApiKeys ? (
                <div className="flex items-center space-x-4 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-notion-gray-700">AI 연결됨</span>
                  </div>
                  <div className="w-px h-3 bg-notion-gray-300"></div>
                  <div className="flex items-center space-x-1.5">
                    <Search className="w-3 h-3 text-blue-500" />
                    <span className="text-notion-gray-600">검색 가능</span>
                  </div>
                  <div className="w-px h-3 bg-notion-gray-300"></div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-notion-gray-600 font-mono text-xs">{currentModel}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-full border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium">API 키 필요</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 키보드 단축키 도움말 - 더 세련된 디자인 */}
        <div className="mt-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-center space-x-6 text-xs text-notion-gray-500">
            <div className="flex items-center space-x-1">
              <span>단축키:</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="bg-white/60 px-2 py-1 rounded-md font-mono text-xs border border-notion-gray-200 shadow-sm">Ctrl+E</kbd>
              <span>내보내기</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="bg-white/60 px-2 py-1 rounded-md font-mono text-xs border border-notion-gray-200 shadow-sm">Ctrl+⌫</kbd>
              <span>삭제</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="bg-white/60 px-2 py-1 rounded-md font-mono text-xs border border-notion-gray-200 shadow-sm">Enter</kbd>
              <span>전송</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container - 개선된 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {chatState.messages.length === 0 ? (
            <WelcomeMessage onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="space-y-6">
              {chatState.messages.map((message, index) => (
                <div key={message.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <MessageBubble message={message} />
                </div>
              ))}
              {chatState.isLoading && (
                <div className="animate-fade-in">
                  <TypingIndicator />
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - 글래스모피즘과 더 나은 시각적 효과 */}
      <div className="glass border-t border-white/20 backdrop-blur-md px-6 py-6 shadow-large">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative group">
              <div className={`flex items-end space-x-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border transition-all duration-300 glow focus-ring ${
                chatState.isLoading 
                  ? 'border-accent-500/30 shadow-medium' 
                  : 'border-notion-gray-200 hover:border-primary-300 hover:shadow-medium'
              }`}>
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={chatState.inputValue}
                    onChange={(e) => setChatState(prev => ({ ...prev, inputValue: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="AI 에이전트와 대화하세요... ✨"
                    className="w-full bg-transparent border-none outline-none resize-none text-notion-gray-800 placeholder-notion-gray-400 text-sm leading-6 font-medium"
                    rows={1}
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                    disabled={chatState.isLoading}
                  />
                  <div className="absolute bottom-2 right-0 text-xs text-notion-gray-400">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {isInputFocused ? 'Enter로 전송, Shift+Enter로 줄바꿈' : ''}
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!chatState.inputValue.trim() || chatState.isLoading}
                  className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 hover-lift ${
                    !chatState.inputValue.trim() || chatState.isLoading
                      ? 'bg-notion-gray-200 text-notion-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium hover:shadow-large hover:from-primary-600 hover:to-primary-700'
                  }`}
                >
                  <Send className={`w-4 h-4 transition-transform ${chatState.isLoading ? 'animate-pulse' : 'group-hover:scale-110'}`} />
                </button>
              </div>

              {/* 입력창 하단 상태 표시 */}
              {chatState.isLoading && (
                <div className="absolute -bottom-8 left-4 flex items-center space-x-2 text-xs text-notion-gray-500 animate-fade-in">
                  <div className="typing-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <span>AI가 답변을 생성하고 있습니다...</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
