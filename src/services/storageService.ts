import { Message } from '../types';

const STORAGE_KEY = 'ai_chat_history';
const MAX_STORED_MESSAGES = 50; // 최대 저장할 메시지 수

export const saveChatHistory = (messages: Message[]): void => {
  try {
    const trimmedMessages = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedMessages));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

export const loadChatHistory = (): Message[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
};

export const clearChatHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
};
