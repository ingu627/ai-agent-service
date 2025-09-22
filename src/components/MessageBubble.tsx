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
    <div className={`flex items-start space-x-3 fade-in group ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-purple-600 text-white' 
          : 'bg-notion-gray-100 text-notion-gray-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-2xl ${isUser ? 'text-right' : ''}`}>
        {/* AI 능력 표시 */}
        {!isUser && (message.capability || message.useSearch) && (
          <div className={`flex items-center space-x-1 text-xs text-notion-gray-500 mb-2 ${isUser ? 'justify-end' : ''}`}>
            {message.useSearch && <Search className="w-3 h-3 text-blue-500" />}
            {message.capability && <Zap className="w-3 h-3 text-green-500" />}
            <span>
              {message.capability && `${message.capability}`}
              {message.useSearch && message.capability && ' • '}
              {message.useSearch && '웹 검색 사용'}
            </span>
          </div>
        )}

        <div className={`relative inline-block px-4 py-3 rounded-lg text-sm leading-6 ${
          isUser
            ? 'bg-purple-600 text-white rounded-br-sm'
            : 'bg-notion-gray-100 text-notion-gray-800 rounded-bl-sm'
        }`}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black hover:bg-opacity-10 ${
              isUser ? 'text-purple-200 hover:text-white' : 'text-notion-gray-500 hover:text-notion-gray-700'
            }`}
            title="메시지 복사"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Timestamp */}
        <div className={`mt-1 text-xs text-notion-gray-400 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
