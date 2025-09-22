import React from 'react';
import { User, Bot, Search, Zap, Copy, Check } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <div className={`flex items-start space-x-4 group hover-lift ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar with enhanced design */}
      <div className="flex-shrink-0 relative">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-soft transition-all duration-300 ${
          isUser 
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white ring-2 ring-primary-100' 
            : 'bg-gradient-to-br from-notion-gray-100 to-notion-gray-200 text-notion-gray-600 ring-2 ring-white'
        }`}>
          {isUser ? (
            <User className="w-5 h-5" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </div>
        {/* Subtle glow effect */}
        {!isUser && (
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-100 to-blue-100 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
        )}
      </div>

      {/* Message Content with enhanced styling */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
        {/* AI 능력 표시 - 더 세련된 배지 */}
        {!isUser && (message.capability || message.useSearch) && (
          <div className={`flex items-center space-x-2 mb-3 animate-fade-in ${isUser ? 'justify-end' : ''}`}>
            <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 shadow-soft">
              {message.useSearch && <Search className="w-3 h-3 text-blue-500" />}
              {message.capability && <Zap className="w-3 h-3 text-green-500" />}
              <span className="text-xs font-medium text-notion-gray-700">
                {message.capability && `${message.capability}`}
                {message.useSearch && message.capability && ' • '}
                {message.useSearch && '웹 검색'}
              </span>
            </div>
          </div>
        )}

        <div className={`relative group/message ${isUser ? 'ml-auto inline-block' : ''}`}>
          <div className={`relative px-5 py-4 rounded-2xl text-sm leading-7 shadow-soft transition-all duration-300 hover:shadow-medium ${
            isUser
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md'
              : 'bg-white/80 backdrop-blur-sm text-notion-gray-800 border border-white/50 rounded-bl-md'
          }`}>
            <p className="whitespace-pre-wrap break-words font-medium">{message.content}</p>

            {/* Enhanced copy button with better positioning */}
            <button
              onClick={handleCopy}
              className={`absolute top-3 right-3 opacity-0 group-hover/message:opacity-100 transition-all duration-200 p-2 rounded-lg hover:scale-110 ${
                isUser 
                  ? 'text-white/70 hover:text-white hover:bg-white/20' 
                  : 'text-notion-gray-400 hover:text-notion-gray-600 hover:bg-notion-gray-100/50'
              }`}
              title="메시지 복사"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>

            {/* Message decoration for AI responses */}
            {!isUser && (
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full shadow-soft"></div>
            )}
          </div>
        </div>

        {/* Enhanced timestamp */}
        <div className={`mt-2 text-xs text-notion-gray-500 font-medium ${isUser ? 'text-right' : ''}`}>
          <time dateTime={message.timestamp.toISOString()}>
            {message.timestamp.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </time>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
