import React from 'react';
import { User, Bot, Search, Copy, Check } from 'lucide-react';
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

  const bubbleBase = isUser
    ? 'bg-indigo-600/20 text-indigo-50 border border-indigo-400/30 shadow-indigo-500/20'
    : 'bg-white/[0.04] text-slate-100 border border-white/10 shadow-black/20 backdrop-blur';

  return (
    <div className={`fade-in ${isUser ? 'flex justify-end' : 'flex justify-start'}`}>
      <div className={`relative flex w-full max-w-3xl gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-slate-200 ${isUser ? 'ml-2' : 'mr-2'}`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className={`${isUser ? 'items-end text-right' : 'items-start'} flex flex-1 flex-col gap-2`}>
          {!isUser && message.useSearch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-indigo-200">
              <Search className="h-3 w-3" />
              Web search context
            </span>
          )}

          <div className={`group relative w-fit max-w-full rounded-2xl px-5 py-4 text-sm leading-relaxed ${bubbleBase}`}>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>

            <button
              onClick={handleCopy}
              className={`absolute -top-3 ${isUser ? '-left-3' : '-right-3'} hidden rounded-full border border-white/20 bg-white/10 p-1 text-[10px] text-white opacity-0 transition-all duration-200 group-hover:block group-hover:opacity-100`}
              title="메시지 복사"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          <time className="text-[11px] uppercase tracking-wide text-slate-500">
            {message.timestamp.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </time>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
