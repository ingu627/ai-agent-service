import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start space-x-3 fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-notion-gray-100 text-notion-gray-600 flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>

      {/* Typing Animation */}
      <div className="flex-1 max-w-2xl">
        <div className="inline-block px-4 py-3 rounded-lg rounded-bl-sm bg-notion-gray-100">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-notion-gray-400 rounded-full animate-pulse-dot"></div>
              <div className="w-2 h-2 bg-notion-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-notion-gray-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-xs text-notion-gray-500 ml-2">AI가 입력 중...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
