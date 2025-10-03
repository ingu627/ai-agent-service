export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  capability?: string;  // AI 능력 표시
  useSearch?: boolean;  // 검색 사용 여부
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  inputValue: string;
}
