import React from 'react';
import { MessageCircle, Sparkles, Search, Code, FileText, Lightbulb, BarChart } from 'lucide-react';

interface WelcomeMessageProps {
  onSuggestionClick: (suggestion: string) => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onSuggestionClick }) => {
  const suggestions = [
    {
      icon: <Search className="w-5 h-5" />,
      text: "최신 기술 트렌드 검색해줘",
      prompt: "2025년 최신 AI 기술 트렌드에 대해 알려주세요.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Code className="w-5 h-5" />,
      text: "React 코딩 문제 도와줘",
      prompt: "React 컴포넌트 최적화 방법을 알려주세요.",
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      text: "보고서 작성 도움이 필요해",
      prompt: "효과적인 비즈니스 보고서 작성 방법을 알려주세요.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      text: "창의적인 아이디어 제안해줘",
      prompt: "새로운 사업 아이디어를 브레인스토밍해주세요.",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: <BarChart className="w-5 h-5" />,
      text: "데이터 분석 도움이 필요해",
      prompt: "효과적인 데이터 시각화 방법을 알려주세요.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      text: "현재 주가 정보 찾아줘",
      prompt: "현재 주요 기술주 주가 동향을 알려주세요.",
      color: "from-violet-500 to-purple-500"
    }
  ];

  return (
    <div className="text-center py-12 px-6 animate-fade-in">
      {/* Enhanced Hero Section */}
      <div className="mb-12">
        <div className="relative mb-8">
          {/* Main icon with enhanced glow effect */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto shadow-large relative">
            <MessageCircle className="w-10 h-10 text-white" />
            <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
          </div>

          {/* Floating decoration elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg rotate-12 opacity-80 animate-pulse"></div>
          <div className="absolute -bottom-1 -left-3 w-4 h-4 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-3xl font-bold text-notion-gray-900 tracking-tight">
            AI Agent에 오신 것을
            <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent ml-2">
              환영합니다!
            </span>
          </h2>
          <p className="text-notion-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            OpenAI GPT와 실시간 웹 검색이 통합된 차세대 AI 어시스턴트입니다.
            <br />
            <span className="font-semibold text-notion-gray-700">무엇이든 물어보세요!</span>
          </p>
        </div>

        {/* Enhanced status indicators */}
        <div className="flex items-center justify-center space-x-8 text-sm">
          {[
            { icon: '🔍', text: '실시간 웹 검색', color: 'text-green-600' },
            { icon: '🤖', text: 'GPT 기반 AI', color: 'text-blue-600' },
            { icon: '⚡', text: '다중 능력', color: 'text-purple-600' }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-soft hover-lift">
              <span className="text-lg">{item.icon}</span>
              <span className={`font-medium ${item.color}`}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-10">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="group relative overflow-hidden bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-6 text-left transition-all duration-300 hover-lift hover:shadow-large hover:bg-white/80 animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${suggestion.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

            <div className="relative">
              <div className={`w-12 h-12 bg-gradient-to-br ${suggestion.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-medium group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                {suggestion.icon}
              </div>
              <p className="font-semibold text-notion-gray-800 group-hover:text-notion-gray-900 transition-colors leading-relaxed">
                {suggestion.text}
              </p>
            </div>

            {/* Hover effect decoration */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
          </button>
        ))}
      </div>

      {/* Enhanced tips section */}
      <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto border border-white/30 shadow-soft animate-slide-up">
        <div className="flex items-center justify-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg">💡</span>
          </div>
          <h3 className="text-lg font-bold text-notion-gray-800">사용 팁</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-notion-gray-600">
          {[
            { emoji: '🔍', text: '"최신", "현재", "오늘" 등의 키워드로 웹 검색을 자동 활성화할 수 있어요' },
            { emoji: '🧠', text: '복잡한 질문도 단계별로 분석하고 체계적으로 답변해드려요' },
            { emoji: '💬', text: '대화 맥락을 기억하며 연속적인 질문에 자연스럽게 답할 수 있어요' },
            { emoji: '⌨️', text: '키보드 단축키로 더 빠르고 편리하게 사용할 수 있어요' }
          ].map((tip, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-white/40 rounded-xl hover:bg-white/60 transition-colors">
              <span className="text-lg flex-shrink-0">{tip.emoji}</span>
              <span className="leading-relaxed">{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
