'use client';

import { useState } from 'react';
import { Plus, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { clearMessages } = useChat();
  const [recentChatsCollapsed, setRecentChatsCollapsed] = useState(false);

  const handleNewChat = () => {
    clearMessages();
  };

  const recentChats: string[] = [];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-[var(--bg-sidebar)] border-r border-[var(--border)]
        transform transition-transform duration-300 ease-in-out z-50
        w-64 lg:relative lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header - JACKY Logo */}
          <div className="p-4 border-b border-[var(--border)]">
            <h1 className="text-[var(--text-primary)] font-bold text-xl tracking-wider">JACKY</h1>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-3">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-transparent 
                         hover:bg-[var(--bg-pill-dark)] text-[var(--text-primary)] 
                         rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">New Chat</span>
            </button>

            {/* Docs Button */}
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-transparent 
                               hover:bg-[var(--bg-pill-dark)] text-[var(--text-primary)] 
                               rounded-lg transition-colors duration-200">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Docs</span>
            </button>

            {/* EAP Feedback Form Button */}
            <button className="w-full px-4 py-3 bg-[var(--accent-green)] hover:bg-[var(--accent-green-hover)] 
                               text-white font-medium rounded-full transition-colors duration-200">
              EAP Feedback Form
            </button>
          </div>



          {/* Recent Chats - Collapsible */}
          <div className="flex-1 p-4">
            <div className="space-y-2">
              <button
                onClick={() => setRecentChatsCollapsed(!recentChatsCollapsed)}
                className="w-full flex items-center justify-between text-[var(--text-primary)] 
                           hover:bg-[var(--bg-pill-dark)] px-2 py-1 rounded transition-colors"
              >
                <span className="font-medium">Recent Chats</span>
                {recentChatsCollapsed ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {!recentChatsCollapsed && (
                <div className="space-y-1 pl-2">
                  {recentChats.length === 0 ? (
                    <div className="text-[var(--text-secondary)] text-sm px-3 py-2">
                      No recent chats
                    </div>
                  ) : (
                    recentChats.map((chat, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 text-[var(--text-primary)] text-sm 
                                   hover:bg-[var(--bg-pill-dark)] rounded transition-colors truncate"
                      >
                        {chat}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}