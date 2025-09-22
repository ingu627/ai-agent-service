import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start space-x-4 animate-fade-in">
      {/* Enhanced Avatar */}
      <div className="flex-shrink-0 relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-notion-gray-100 to-notion-gray-200 text-notion-gray-600 ring-2 ring-white flex items-center justify-center shadow-soft">
          <Bot className="w-5 h-5" />
        </div>
        {/* Pulsing glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-100 to-blue-100 rounded-full blur opacity-50 animate-pulse"></div>
      </div>

      {/* Enhanced typing animation */}
      <div className="flex-1 max-w-3xl">
        <div className="inline-block">
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl rounded-bl-md px-5 py-4 shadow-soft">
            <div className="flex items-center space-x-3">
              <div className="typing-dots">
                <div></div>
                <div></div>
                <div></div>
              </div>
              <span className="text-sm text-notion-gray-600 font-medium">AI가 생각하고 있어요...</span>
            </div>
          </div>
          {/* Message decoration */}
          <div className="w-3 h-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full shadow-soft -mt-1 ml-4"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
