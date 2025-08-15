'use client';

import { Message } from '@/types/chat';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  User, 
  Bot, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  Sparkles,
  Brain
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
}

export function ChatMessage({ message, isLastMessage }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Typing animation for AI messages
  useEffect(() => {
    if (!isUser && isLastMessage) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isUser, isLastMessage]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (positive: boolean) => {
    setIsLiked(positive);
    // Here you would typically send feedback to your backend
  };

  // Enhanced message variants - Fixed TypeScript typing
  const messageVariants: Variants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30,
        mass: 1
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      ref={messageRef}
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`flex gap-4 p-6 ${
        isUser ? 'justify-end' : 'justify-start'
      } group relative`}
    >
      <div
        className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Enhanced Avatar */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden ${
            isUser
             ? 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg'
: 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg'
          }`}
        >
          {isUser ? (
            <User size={18} className="text-white" />
          ) : (
            <div className="relative">
              <Bot size={18} className="text-white z-10 relative" />
              {isTyping && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-white/20 rounded-xl"
                />
              )}
            </div>
          )}
          
          {/* Status indicator for AI */}
          {!isUser && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <Sparkles size={8} className="text-white" />
            </div>
          )}
        </motion.div>
        
        {/* Message Content */}
        <div className="flex flex-col space-y-2 flex-1">
          {/* Message Bubble */}
          <motion.div
            whileHover={{ y: -1 }}
            className={`group/message relative rounded-2xl px-5 py-4 ${
              isUser
               ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg'
: 'bg-gray-900/80 border border-gray-700/50 text-gray-400 shadow-sm hover:shadow-md transition-shadow'
            }`}
          >
            {/* Message Text with Enhanced Typography */}
            <div className="relative z-10">
              {isTyping && !isUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.5, 1],
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
                  <span className="text-[var(--text-secondary)] text-sm animate-pulse">
                  MantleLabs AI is thinking...
                  </span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-medium">
                  {message.content}
                </p>
              )}
            </div>

            {/* Glassmorphism overlay for AI messages */}
            {!isUser && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl backdrop-blur-sm" />
            )}

            {/* Action Buttons - Only for AI messages */}
            {!isUser && !isTyping && (
              <div className="absolute top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200 flex gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-[var(--bg-pill-dark)]/80 backdrop-blur-sm hover:bg-[var(--bg-hover)] border border-[var(--border)]/50 shadow-sm"
                  title={copied ? 'Copied!' : 'Copy message'}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check size={12} className="text-[var(--accent-green)]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy size={12} className="text-[var(--text-secondary)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-[var(--bg-pill-dark)]/80 backdrop-blur-sm hover:bg-[var(--bg-hover)] border border-[var(--border)]/50 shadow-sm"
                  title="Regenerate response"
                >
                  <RefreshCw size={12} className="text-[var(--text-secondary)]" />
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Message Footer */}
          <div className={`flex items-center gap-3 px-2 ${
            isUser ? 'justify-end' : 'justify-between'
          }`}>
            {/* Timestamp */}
            <span className="text-xs text-[var(--text-tertiary)] font-medium">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {/* Feedback Buttons - Only for AI messages */}
            {!isUser && !isTyping && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleFeedback(true)}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isLiked === true
                      ? 'bg-green-100 text-green-600 border border-green-200'
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
                  }`}
                  title="Good response"
                >
                  <ThumbsUp size={10} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleFeedback(false)}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isLiked === false
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
                  }`}
                  title="Poor response"
                >
                  <ThumbsDown size={10} />
                </motion.button>
              </div>
            )}

            {/* AI Processing Indicator */}
            {!isUser && isTyping && (
              <div className="flex items-center gap-2">
                <Brain size={12} className="text-[var(--accent-primary)] animate-pulse" />
                <span className="text-xs text-[var(--text-secondary)]">Processing</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}