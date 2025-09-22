import React from 'react';
import { MessageCircle, Sparkles, Search, Code, FileText, Lightbulb, BarChart } from 'lucide-react';

interface WelcomeMessageProps {
  onSuggestionClick: (suggestion: string) => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onSuggestionClick }) => {
  const suggestions = [
    {
      icon: <Search className="w-4 h-4" />,
      text: "최신 기술 트렌드 검색해줘",
      prompt: "2025년 최신 AI 기술 트렌드에 대해 알려주세요."
    },
    {
      icon: <Code className="w-4 h-4" />,
      text: "React 코딩 문제 도와줘",
      prompt: "React 컴포넌트 최적화 방법을 알려주세요."
    },
    {
      icon: <FileText className="w-4 h-4" />,
      text: "보고서 작성 도움이 필요해",
      prompt: "효과적인 비즈니스 보고서 작성 방법을 알려주세요."
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      text: "창의적인 아이디어 제안해줘",
      prompt: "새로운 사업 아이디어를 브레인스토밍해주세요."
    },
    {
      icon: <BarChart className="w-4 h-4" />,
      text: "데이터 분석 도움이 필요해",
      prompt: "효과적인 데이터 시각화 방법을 알려주세요."
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      text: "현재 주가 정보 찾아줘",
      prompt: "현재 주요 기술주 주가 동향을 알려주세요."
    }
  ];

  return (
    <div className="text-center py-8 px-4">
      <div className="mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-notion-gray-800 mb-2">
          AI Agent에 오신 것을 환영합니다!
        </h2>
        <p className="text-notion-gray-600 max-w-md mx-auto mb-4">
          OpenAI GPT와 웹 검색 기능이 통합된 지능형 AI 에이전트입니다.
          무엇이든 물어보세요!
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-notion-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>실시간 웹 검색</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>GPT 기반 AI</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>다중 능력</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="flex items-center space-x-3 p-4 rounded-lg border border-notion-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 text-left group"
          >
            <div className="flex-shrink-0 text-purple-600 group-hover:text-purple-700">
              {suggestion.icon}
            </div>
            <span className="text-sm text-notion-gray-700 font-medium group-hover:text-notion-gray-800">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-notion-gray-50 rounded-lg max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-notion-gray-800 mb-2">💡 사용 팁</h3>
        <ul className="text-xs text-notion-gray-600 space-y-1">
          <li>• "최신", "현재", "오늘" 등의 키워드를 사용하면 웹 검색이 자동으로 활성화됩니다</li>
          <li>• 복잡한 질문도 단계별로 분석하고 답변해드립니다</li>
          <li>• 대화 맥락을 기억하며 연속적인 질문에 답할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeMessage;
