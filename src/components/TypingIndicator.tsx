import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="fade-in flex justify-start">
      <div className="relative flex w-full max-w-3xl gap-3">
        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-slate-200">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs text-slate-300 shadow-black/20 backdrop-blur">
            <div className="flex gap-2">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-slate-400" />
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-slate-400" style={{ animationDelay: '0.2s' }} />
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-slate-400" style={{ animationDelay: '0.4s' }} />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-slate-400">Assistant is typing…</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
