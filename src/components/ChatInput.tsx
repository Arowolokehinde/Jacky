'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  Paperclip, 
  Mic, 
  MicOff,
  Smile,
  Zap,
  Sparkles,
  StopCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
}

export function ChatInput({ onSendMessage, isLoading, onStopGeneration }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxChars = 2000;

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const suggestions = [
    { icon: '🔍', text: 'Analyze my portfolio performance', category: 'Analysis' },
    { icon: '💰', text: 'Find best yield farming opportunities', category: 'DeFi' },
    { icon: '⚡', text: 'Optimize my gas fees', category: 'Gas' },
    { icon: '🛡️', text: 'Security audit for this contract', category: 'Security' },
    { icon: '📊', text: 'Compare DEX prices for token swap', category: 'Trading' },
    { icon: '🌊', text: 'Show me liquidity pool opportunities', category: 'Liquidity' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      setCharCount(0);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }

    // Handle Tab for suggestions
    if (e.key === 'Tab' && message.length === 0) {
      e.preventDefault();
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setMessage(value);
      setCharCount(value.length);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (message.length === 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setMessage(suggestionText);
    setCharCount(suggestionText.length);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && mounted) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message, mounted]);

  // Determine if input should be highlighted
  const isInputActive = message.trim() || isFocused;

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-sidebar)] relative">
      {/* Quick Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 bg-[var(--bg-primary)] border border-[var(--border)] 
                       rounded-t-xl shadow-xl backdrop-blur-xl p-4 max-h-64 overflow-y-auto z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                Quick Suggestions
              </h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
                aria-label="Close suggestions"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="flex items-center gap-3 p-3 text-left bg-[var(--bg-pill-light)] 
                             hover:bg-[var(--bg-hover)] rounded-lg transition-all duration-200
                             border border-[var(--border)] hover:border-[var(--accent-primary)]/30
                             group focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                >
                  <span className="text-lg" role="img" aria-label={suggestion.category}>
                    {suggestion.icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {suggestion.text}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">{suggestion.category}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click overlay to close suggestions */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSuggestions(false)}
          aria-hidden="true"
        />
      )}

      <form onSubmit={handleSubmit} className="p-4">
        {/* Input Container with aligned send button */}
        <div className="flex items-end gap-3">
          {/* Enhanced Input Container */}
          <div className="flex-1 relative">
            <div className={`relative bg-[var(--bg-pill-dark)] border-2 rounded-2xl transition-all duration-200 ${
              isInputActive
                ? 'border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/10' 
                : 'border-[var(--border)] hover:border-[var(--border-focus)]'
            }`}>
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Ask Jacky about DeFi strategies, portfolio analysis, or anything crypto..."
                className="w-full min-h-[52px] max-h-[120px] p-4 pr-32 bg-transparent text-[var(--text-primary)] 
                           placeholder-[var(--text-secondary)] resize-none outline-none text-sm
                           scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent"
                disabled={isLoading}
                rows={1}
                aria-label="Message input"
              />

              {/* Input Actions */}
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                {/* Attachment Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
                             hover:bg-[var(--bg-hover)] rounded-lg transition-colors
                             focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
                  title="Attach file"
                  aria-label="Attach file"
                >
                  <Paperclip size={16} />
                </motion.button>

                {/* Voice Recording Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    isRecording
                      ? 'bg-red-500 text-white shadow-lg focus:ring-red-500/50'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:ring-[var(--accent-primary)]/50'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Voice input'}
                  aria-label={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </motion.button>

                {/* Suggestions Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    showSuggestions
                      ? 'bg-[var(--accent-primary)] text-white focus:ring-[var(--accent-primary)]/50'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:ring-[var(--accent-primary)]/50'
                  }`}
                  title="Quick suggestions"
                  aria-label="Show quick suggestions"
                  aria-expanded={showSuggestions}
                >
                  <Zap size={16} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Send/Stop Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            type={isLoading ? "button" : "submit"}
            onClick={isLoading ? onStopGeneration : undefined}
            disabled={(!message.trim() && !isLoading)}
            className={`flex items-center justify-center w-15 h-15 rounded-xl font-semibold
                       transition-all duration-200 shadow-lg disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-offset-2 flex-shrink-0
                       ${isLoading 
                         ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500/50' 
                         : message.trim()
                           ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-violet-500/25 focus:ring-violet-500/50'
                           : 'bg-[var(--bg-pill-dark)] text-[var(--text-tertiary)] cursor-not-allowed focus:ring-transparent'
                       }`}
            title={isLoading ? 'Stop generation' : 'Send message'}
            aria-label={isLoading ? 'Stop generation' : 'Send message'}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  className="flex items-center justify-center"
                >
                  <StopCircle size={18} />
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="flex items-center justify-center"
                >
                  <Send size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Character Counter and Help Text */}
        <div className="flex justify-between items-center mt-2 px-2">
          <div className="text-xs text-[var(--text-tertiary)]">
            {message.length === 0 && !showSuggestions && (
              <span>Press Tab for suggestions • Shift+Enter for new line</span>
            )}
          </div>
          <div className={`text-xs transition-colors ${
            charCount > maxChars * 0.9 
              ? 'text-red-400' 
              : charCount > maxChars * 0.7 
                ? 'text-orange-400' 
                : 'text-[var(--text-tertiary)]'
          }`}>
            {charCount}/{maxChars}
          </div>
        </div>

        {/* Enhanced Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center mt-4"
            >
              <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-pill-dark)] border border-[var(--border)] rounded-full backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                      className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--text-secondary)] font-medium">
                  Jacky is thinking...
                </span>
                <div className="w-4 h-4 relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4"
                  >
                    <Sparkles size={16} className="text-[var(--accent-primary)]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}