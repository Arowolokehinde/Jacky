'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-chat)]">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end gap-3">
          {/* Input Container */}
          <div className="flex-1">
            <div className="relative bg-[var(--bg-pill-dark)] border border-[var(--border)] 
                            rounded-lg focus-within:border-[var(--accent-green)]">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Jacky about DeFi..."
                className="w-full min-h-[44px] max-h-32 p-3 bg-transparent text-[var(--text-primary)] 
                           placeholder-[var(--text-secondary)] resize-none outline-none text-sm"
                disabled={isLoading}
                rows={1}
              />
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="flex items-center justify-center w-10 h-10 
                       bg-[var(--accent-green)] hover:bg-[var(--accent-green-hover)]
                       disabled:bg-gray-600 disabled:opacity-50
                       rounded-lg transition-colors duration-200 
                       disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center mt-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-pill-dark)] rounded-full">
              <Loader2 className="w-3 h-3 text-[var(--accent-green)] animate-spin" />
              <span className="text-xs text-[var(--text-secondary)]">
                Jacky is thinking...
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}