import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onNewChat: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  isInputFocused: boolean;
}

export const useKeyboardShortcuts = ({
  onNewChat,
  onClearChat,
  onExportChat,
  isInputFocused
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력창에 포커스가 있을 때는 단축키 비활성화
      if (isInputFocused) return;

      // Cmd/Ctrl + 키 조합
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            onNewChat();
            break;
          case 'e':
            e.preventDefault();
            onExportChat();
            break;
          case 'Backspace':
            e.preventDefault();
            onClearChat();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNewChat, onClearChat, onExportChat, isInputFocused]);
};
