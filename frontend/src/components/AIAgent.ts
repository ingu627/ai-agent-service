interface AgentCapability {
  name: string;
  description: string;
  icon: string;
  keywords: string[];
}

export const agentCapabilities: AgentCapability[] = [
  {
    name: '웹 검색',
    description: '최신 정보를 검색하고 분석합니다',
    icon: '🔍',
    keywords: ['검색', '최신', '뉴스', '정보', '찾아', '알려', '현재', '오늘']
  },
  {
    name: '코딩 도우미',
    description: '프로그래밍 문제 해결과 코드 작성을 도와줍니다',
    icon: '💻',
    keywords: ['코드', '프로그래밍', '개발', '버그', '알고리즘', 'javascript', 'python', 'react']
  },
  {
    name: '글쓰기 도우미',
    description: '다양한 형태의 글쓰기를 지원합니다',
    icon: '✍️',
    keywords: ['글', '작성', '에세이', '보고서', '블로그', '번역', '요약']
  },
  {
    name: '아이디어 생성',
    description: '창의적인 아이디어와 솔루션을 제안합니다',
    icon: '💡',
    keywords: ['아이디어', '창의', '브레인스토밍', '혁신', '제안', '솔루션']
  },
  {
    name: '데이터 분석',
    description: '데이터를 분석하고 인사이트를 제공합니다',
    icon: '📊',
    keywords: ['분석', '데이터', '통계', '차트', '그래프', '인사이트']
  }
];

export const detectIntent = (message: string): AgentCapability | null => {
  for (const capability of agentCapabilities) {
    if (capability.keywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      return capability;
    }
  }
  return null;
};
