'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { WalletConnection } from './WalletConnection';

export function ChatInterface() {
  const { messages, sendMessage, isLoading, error } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-chat)]">
      {/* Header with Wallet Connection */}
      <div className="hidden lg:flex items-center justify-end p-4 border-b border-[var(--border)]">
        <WalletConnection />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Welcome to Jacky AI
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-md">
                {isConnected ? (
                  <>Your wallet is connected! I can now help you with portfolio analysis, DeFi strategies, and execute transactions. What would you like to explore?</>
                ) : (
                  <>Connect your wallet in the sidebar to unlock portfolio analysis and DeFi transaction capabilities. Until then, I can help explain DeFi concepts and strategies!</>
                )}
              </p>
              
              {isConnected && (
                <div className="bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20 
                                rounded-lg p-4 max-w-md">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full"></div>
                    <span className="text-[var(--accent-green)] font-medium text-sm">
                      Wallet Connected - Phase 2 Active
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {error && (
          <div className="flex items-center gap-3 p-4 mx-6 mb-4 bg-red-900/20 
                          border border-red-500/20 text-red-400 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
}