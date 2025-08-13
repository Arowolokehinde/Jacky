'use client';

import { Message } from '@/types/chat';
import { motion } from 'framer-motion';
import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`flex gap-3 p-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex gap-3 max-w-[80%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-blue-500'
              : 'bg-gray-600'
          }`}
        >
          {isUser ? 
            <User size={16} className="text-white" /> : 
            <Bot size={16} className="text-white" />
          }
        </div>
        
        {/* Message Content */}
        <div className="flex flex-col space-y-1">
          <div
            className={`group relative rounded-lg px-4 py-3 ${
              isUser
                ? 'bg-[var(--bg-message-user)] text-[var(--text-user)]'
                : 'bg-[var(--bg-message-ai)] text-[var(--text-primary)]'
            }`}
          >
            {/* Message Text */}
            <p className="whitespace-pre-wrap leading-relaxed text-sm">
              {message.content}
            </p>

            {/* Copy Button - Only for AI messages */}
            {!isUser && (
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                           transition-opacity duration-200 p-1 rounded 
                           bg-[var(--bg-pill-dark)] hover:bg-gray-700"
                title={copied ? 'Copied!' : 'Copy message'}
              >
                {copied ? (
                  <Check size={12} className="text-[var(--accent-green)]" />
                ) : (
                  <Copy size={12} className="text-[var(--text-secondary)]" />
                )}
              </button>
            )}
          </div>

          {/* Timestamp */}
          <div className={`flex items-center gap-2 px-2 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-[var(--text-secondary)]">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}