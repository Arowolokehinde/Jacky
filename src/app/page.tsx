'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Sidebar } from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import { useAccount } from 'wagmi';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { address, isConnected } = useAccount();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="h-screen w-full bg-[var(--bg-primary)] flex overflow-hidden">
      {/* Sidebar - Now truly static */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar isOpen={true} onToggle={() => {}} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[var(--bg-pill-dark)] rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-[var(--text-primary)]" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-primary)] font-bold tracking-wider">JACKY</span>
          </div>
          {/* Mobile Account ID */}
          <div className="bg-[var(--bg-pill-dark)] px-2 py-1 rounded-full">
            {isConnected && address ? (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full"></div>
                <span className="text-[var(--text-primary)] text-xs font-mono">
                  {truncateAddress(address)}
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-secondary)] text-xs">Not Connected</span>
            )}
          </div>
        </div>
        
        {/* Chat Interface - Now scrollable independently */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}