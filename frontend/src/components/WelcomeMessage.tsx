import React from 'react';
import { Sparkles, Code, FileText, Search, BarChart } from 'lucide-react';

interface WelcomeMessageProps {
  onSuggestionClick: (suggestion: string) => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onSuggestionClick }) => {
  const suggestions = [
    {
      icon: <FileText className="h-4 w-4" />,
      title: '문서 작성',
      prompt: '에이전트 기능을 소개하는 README 초안을 작성해줘.'
    },
    {
      icon: <Search className="h-4 w-4" />,
      title: '버그 찾기',
      prompt: '프론트엔드에서 발생할 수 있는 3가지 잠재적 버그를 진단해줘.'
    },
    {
      icon: <Code className="h-4 w-4" />,
      title: 'API 설계',
      prompt: 'Python FastAPI 백엔드와 연동할 `/api/chat/stream` 엔드포인트 스펙을 정리해줘.'
    },
    {
      icon: <BarChart className="h-4 w-4" />,
      title: '대시보드 아이디어',
      prompt: 'AI 에이전트 성능 대시보드에 필요한 핵심 KPI를 5개 제안해줘.'
    }
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 text-center text-slate-100">
      <div className="flex flex-col items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-indigo-200">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-white">에이전트에게 지시해보세요</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            지금 입력하는 모든 대화는 추후 Python 백엔드로 전송할 수 있도록 정돈된 컨텍스트로 저장됩니다. 필요한 작업을 선택하거나 직접 메시지를 작성해보세요.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-slate-200 transition hover:border-indigo-400/60 hover:bg-indigo-500/15"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-indigo-200">
              {suggestion.icon}
            </span>
            <span className="text-sm font-medium text-white group-hover:text-indigo-100">{suggestion.title}</span>
          </button>
        ))}
      </div>

      <p className="max-w-xl text-xs leading-6 text-slate-500">
        엔터를 눌러 전송하고, 내보내기 버튼을 활용해 Python API에서 그대로 재생할 수 있는 JSON 이력을 받아보세요.
      </p>
    </div>
  );
};

export default WelcomeMessage;
