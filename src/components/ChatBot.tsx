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
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-notion-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h1 className="text-lg font-medium text-notion-gray-800">AI Agent</h1>
            {chatState.messages.length > 0 && (
              <span className="text-xs text-notion-gray-400 bg-notion-gray-100 px-2 py-1 rounded-full">
                {chatState.messages.length} 메시지
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* 대화 관리 버튼들 */}
            {chatState.messages.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportChat}
                  className="p-2 text-notion-gray-500 hover:text-notion-gray-700 hover:bg-notion-gray-100 rounded-md transition-colors"
                  title="대화 내보내기 (Ctrl/Cmd + E)"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClearChat}
                  className={`p-2 rounded-md transition-colors ${
                    showClearConfirm
                      ? 'text-red-600 bg-red-100 hover:bg-red-200'
                      : 'text-notion-gray-500 hover:text-red-600 hover:bg-notion-gray-100'
                  }`}
                  title={showClearConfirm ? '정말 삭제하시겠습니까?' : '대화 삭제 (Ctrl/Cmd + Backspace)'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* API 상태 표시 */}
            <div className="flex items-center space-x-4 text-xs text-notion-gray-500">
              {hasApiKeys ? (
                <>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-green-500" />
                    <span>AI 연결됨</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Search className="w-3 h-3 text-blue-500" />
                    <span>검색 가능</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>{currentModel}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>API 키 필요</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 키보드 단축키 도움말 */}
        <div className="mt-2 text-xs text-notion-gray-400">
          <span>단축키: </span>
          <span className="bg-notion-gray-100 px-1 rounded">Ctrl+E</span> 내보내기 •
          <span className="bg-notion-gray-100 px-1 rounded ml-1">Ctrl+⌫</span> 삭제 •
          <span className="bg-notion-gray-100 px-1 rounded ml-1">Enter</span> 전송
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {chatState.messages.length === 0 ? (
            <WelcomeMessage onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="space-y-4">
              {chatState.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {chatState.isLoading && <TypingIndicator />}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-notion-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end space-x-3 bg-notion-gray-50 rounded-lg p-3 border border-notion-gray-200 focus-within:border-purple-300 focus-within:bg-white transition-colors">
              <textarea
                ref={inputRef}
                value={chatState.inputValue}
                onChange={(e) => setChatState(prev => ({ ...prev, inputValue: e.target.value }))}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="AI 에이전트와 대화하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
                className="flex-1 bg-transparent border-none outline-none resize-none text-notion-gray-800 placeholder-notion-gray-400 text-sm leading-5"
                rows={1}
                style={{ minHeight: '20px', maxHeight: '120px' }}
                disabled={chatState.isLoading}
              />
              <button
                type="submit"
                disabled={!chatState.inputValue.trim() || chatState.isLoading}
                className="flex-shrink-0 p-2 rounded-md bg-purple-600 text-white disabled:bg-notion-gray-300 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
