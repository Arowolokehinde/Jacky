'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { Wallet, Power, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { mantle } from 'wagmi/chains';
import { formatEther } from 'viem';

// Wallet icons as components
const MetaMaskIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M22.5 4.5L14.5 10.5L16 7L22.5 4.5Z" fill="#E17726" stroke="#E17726"/>
    <path d="M1.5 4.5L9.4 10.6L8 7L1.5 4.5Z" fill="#E27625" stroke="#E27625"/>
    <path d="M19.2 16.8L17.5 19.5L22 20.7L23.3 16.9L19.2 16.8Z" fill="#E27625" stroke="#E27625"/>
    <path d="M0.7 16.9L2 20.7L6.5 19.5L4.8 16.8L0.7 16.9Z" fill="#E27625" stroke="#E27625"/>
    <path d="M6.3 11.4L5 13.5L9.4 13.7L9.3 8.9L6.3 11.4Z" fill="#E27625" stroke="#E27625"/>
    <path d="M17.7 11.4L14.6 8.8L14.5 13.7L19 13.5L17.7 11.4Z" fill="#E27625" stroke="#E27625"/>
    <path d="M6.5 19.5L8.7 18.4L6.8 17L6.5 19.5Z" fill="#E27625" stroke="#E27625"/>
    <path d="M15.3 18.4L17.5 19.5L17.2 17L15.3 18.4Z" fill="#E27625" stroke="#E27625"/>
  </svg>
);

const CoinbaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#0052FF"/>
    <path d="M12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4Z" fill="white"/>
    <rect x="8" y="8" width="8" height="8" rx="1" fill="#0052FF"/>
  </svg>
);

const getWalletIcon = (connectorName: string) => {
  switch (connectorName.toLowerCase()) {
    case 'metamask':
    case 'injected':
      return <MetaMaskIcon />;
    case 'coinbase wallet':
      return <CoinbaseIcon />;
    default:
      return <Wallet className="w-6 h-6" />;
  }
};

export function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showConnectors, setShowConnectors] = useState(false);

  // Get ETH balance
  const { data: ethBalance, refetch: refetchEth } = useBalance({
    address,
  });

  // Get MNT balance (if on Mantle)
  const { data: mantleBalance, refetch: refetchMantle } = useBalance({
    address,
    token: chainId === mantle.id ? undefined : '0x3c3a81e81dc49A522A592e7622A7E711c06bf354', // MNT token on other chains
  });

  const isOnMantle = chainId === mantle.id;

  const handleConnect = (connector: typeof connectors[0]) => {
    connect({ connector });
    setShowConnectors(false);
  };

  const handleSwitchToMantle = () => {
    switchChain({ chainId: mantle.id });
  };

  const refreshBalances = async () => {
    refetchEth();
    refetchMantle();
  };

  const formatBalance = (balance: bigint | undefined, symbol: string) => {
    if (!balance) return '0.00';
    const formatted = formatEther(balance);
    return `${parseFloat(formatted).toFixed(4)} ${symbol}`;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowConnectors(!showConnectors)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-green)] 
                     hover:bg-[var(--accent-green-hover)] text-white rounded-lg 
                     font-medium transition-colors disabled:opacity-50"
        >
          <Wallet className="w-4 h-4" />
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </button>

        {showConnectors && (
          <div className="absolute top-12 right-0 bg-[var(--bg-pill-dark)] border border-[var(--border)] 
                          rounded-lg shadow-xl z-50 min-w-56">
            <div className="p-3 border-b border-[var(--border)]">
              <h3 className="text-[var(--text-primary)] font-medium text-sm">Connect Wallet</h3>
            </div>
            <div className="p-2 space-y-1">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => handleConnect(connector)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[var(--text-primary)] 
                             hover:bg-[var(--bg-chat)] rounded transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0">
                    {getWalletIcon(connector.name)}
                  </div>
                  <span className="font-medium">{connector.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showConnectors && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowConnectors(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connected Wallet Display */}
      <button
        onClick={() => setShowConnectors(!showConnectors)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-pill-dark)] 
                   hover:bg-[var(--bg-pill-dark)]/80 rounded-full transition-colors"
      >
        <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full"></div>
        <span className="text-[var(--text-primary)] text-sm font-mono">
          {address ? truncateAddress(address) : ''}
        </span>
        <Power 
          onClick={(e) => { e.stopPropagation(); disconnect(); }}
          className="w-4 h-4 text-[var(--text-secondary)] hover:text-red-400 
                     transition-colors cursor-pointer" 
        />
      </button>

      {/* Expanded Wallet Info */}
      {showConnectors && (
        <div className="absolute top-12 right-0 bg-[var(--bg-pill-dark)] border border-[var(--border)] 
                        rounded-lg shadow-xl z-50 min-w-80">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-[var(--text-primary)] font-medium">Wallet Info</h3>
              <button
                onClick={refreshBalances}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
                           transition-colors"
                title="Refresh balances"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Network Status */}
            {!isOnMantle && (
              <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 
                              rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-orange-400 text-xs font-medium">Not on Mantle Network</p>
                </div>
                <button
                  onClick={handleSwitchToMantle}
                  className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white 
                             text-xs font-medium rounded transition-colors"
                >
                  Switch
                </button>
              </div>
            )}

            {/* Balances */}
            <div className="space-y-2">
              {ethBalance && (
                <div className="flex justify-between items-center p-2 bg-[var(--bg-chat)] rounded-lg">
                  <span className="text-[var(--text-secondary)] text-sm">
                    {isOnMantle ? 'MNT' : 'ETH'}
                  </span>
                  <span className="text-[var(--text-primary)] font-mono text-sm">
                    {formatBalance(ethBalance.value, ethBalance.symbol)}
                  </span>
                </div>
              )}

              {mantleBalance && !isOnMantle && (
                <div className="flex justify-between items-center p-2 bg-[var(--bg-chat)] rounded-lg">
                  <span className="text-[var(--text-secondary)] text-sm">MNT</span>
                  <span className="text-[var(--text-primary)] font-mono text-sm">
                    {formatBalance(mantleBalance.value, mantleBalance.symbol)}
                  </span>
                </div>
              )}
            </div>

            {/* Explorer Link */}
            {address && (
              <a
                href={`${isOnMantle ? 'https://explorer.mantle.xyz' : 'https://etherscan.io'}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 text-[var(--text-secondary)] 
                           hover:text-[var(--accent-green)] transition-colors rounded"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="text-xs">View on Explorer</span>
              </a>
            )}
          </div>
        </div>
      )}

      {showConnectors && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowConnectors(false)}
        />
      )}
    </div>
  );
}