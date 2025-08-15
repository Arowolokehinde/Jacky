'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { 
  Wallet, 
  Power, 
  RefreshCw, 
  AlertCircle, 
  ExternalLink, 
  ChevronDown,
  Copy,
  Check,
  Loader2,
  Shield,
  Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { mantle } from 'wagmi/chains';
import { formatEther } from 'viem';

// Enhanced Wallet icons with better styling
const MetaMaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <circle cx="12" cy="12" r="12" fill="#0052FF"/>
    <path d="M12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4Z" fill="white"/>
    <rect x="8" y="8" width="8" height="8" rx="1" fill="#0052FF"/>
  </svg>
);

const WalletConnectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
    <path d="M5.5 8.5C8.5 5.5 13.5 5.5 16.5 8.5L17.5 9.5L19 8L18 7C14 3 8 3 4 7L3 8L4.5 9.5L5.5 8.5Z" fill="#3B99FC"/>
    <path d="M8.5 16.5C9.5 17.5 10.7 18 12 18C13.3 18 14.5 17.5 15.5 16.5L16.5 15.5L18 17L17 18C15 20 9 20 7 18L6 17L7.5 15.5L8.5 16.5Z" fill="#3B99FC"/>
  </svg>
);

const getWalletIcon = (connectorName: string) => {
  const name = connectorName.toLowerCase();
  if (name.includes('metamask') || name.includes('injected')) {
    return <MetaMaskIcon />;
  }
  if (name.includes('coinbase')) {
    return <CoinbaseIcon />;
  }
  if (name.includes('walletconnect')) {
    return <WalletConnectIcon />;
  }
  return <Wallet className="w-5 h-5 flex-shrink-0" />;
};

const getWalletDisplayName = (connectorName: string) => {
  const name = connectorName.toLowerCase();
  if (name.includes('injected')) return 'Browser Wallet';
  return connectorName;
};

export function WalletConnection() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get ETH/MNT balance
  const { data: ethBalance, refetch: refetchEth } = useBalance({
    address,
  });

  // Get MNT balance on other chains
  const { data: mantleBalance, refetch: refetchMantle } = useBalance({
    address,
    token: chainId === mantle.id ? undefined : '0x3c3a81e81dc49A522A592e7622A7E711c06bf354',
  });

  const isOnMantle = chainId === mantle.id;

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleConnect = (connector: typeof connectors[0]) => {
    connect({ connector });
    setShowDropdown(false);
  };

  const handleSwitchToMantle = () => {
    switchChain({ chainId: mantle.id });
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    }
  };

  const refreshBalances = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchEth(), refetchMantle()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Minimum loading time for UX
    }
  };

  const formatBalance = (balance: bigint | undefined, symbol: string) => {
    if (!balance) return '0.00';
    const formatted = formatEther(balance);
    const num = parseFloat(formatted);
    if (num === 0) return '0.00';
    if (num < 0.0001) return '< 0.0001';
    if (num < 1) return num.toFixed(6);
    return `${num.toFixed(4)} ${symbol}`;
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getExplorerUrl = (address: string) => {
    return isOnMantle 
      ? `https://explorer.mantle.xyz/address/${address}`
      : `https://etherscan.io/address/${address}`;
  };

  // Disconnect wallet and close dropdown
  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    disconnect();
    setShowDropdown(false);
  };

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isPending}
          className="group relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-green)]/90 
                     hover:from-[var(--accent-green-hover)] hover:to-[var(--accent-green)]/80
                     text-white rounded-xl font-medium transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                     transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">
            {isPending ? 'Connecting...' : 'Connect Wallet'}
          </span>
          {!isPending && <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 duration-200" />}
        </button>

        {showDropdown && (
          <div className="absolute top-full mt-2 right-0 bg-white dark:bg-[var(--bg-pill-dark)] 
                          border border-gray-200 dark:border-[var(--border)] rounded-2xl shadow-2xl z-50 
                          min-w-72 overflow-hidden backdrop-blur-xl">
            <div className="p-4 border-b border-gray-100 dark:border-[var(--border)] bg-gradient-to-r from-gray-50 to-white dark:from-[var(--bg-sidebar)] dark:to-[var(--bg-pill-dark)]">
              <h3 className="text-[var(--text-primary)] font-semibold text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--accent-green)]" />
                Choose Wallet
              </h3>
              <p className="text-[var(--text-secondary)] text-xs mt-1">
                Connect securely with your preferred wallet
              </p>
            </div>
            
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
              {connectors.length > 0 ? (
                connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-primary)] 
                               hover:bg-gray-50 dark:hover:bg-[var(--bg-sidebar)] rounded-xl 
                               transition-all duration-200 text-left group
                               hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[var(--bg-sidebar)] 
                                    flex items-center justify-center group-hover:bg-white 
                                    dark:group-hover:bg-[var(--bg-pill-dark)] transition-colors">
                      {getWalletIcon(connector.name)}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm">
                        {getWalletDisplayName(connector.name)}
                      </span>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {connector.name.includes('MetaMask') && 'Browser extension'}
                        {connector.name.includes('Coinbase') && 'Mobile & browser'}
                        {connector.name.includes('WalletConnect') && 'Mobile wallets'}
                        {connector.name.includes('Injected') && 'Browser wallet'}
                        {!connector.name.includes('MetaMask') && 
                         !connector.name.includes('Coinbase') && 
                         !connector.name.includes('WalletConnect') && 
                         !connector.name.includes('Injected') && 'Wallet provider'}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] rotate-[-90deg] 
                                           group-hover:text-[var(--accent-green)] transition-colors" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-[var(--text-secondary)]">
                  <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No wallets detected</p>
                  <p className="text-xs mt-1">Please install a Web3 wallet</p>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 m-2 bg-red-50 dark:bg-red-950/20 border border-red-200 
                              dark:border-red-800/30 rounded-xl">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium">Connection failed</span>
                </div>
                <p className="text-red-500 dark:text-red-300 text-xs mt-1 ml-6">
                  {error.message}
                </p>
              </div>
            )}
          </div>
        )}

        {showDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connected Wallet Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 
                   dark:from-[var(--bg-pill-dark)] dark:to-[var(--bg-sidebar)]
                   hover:from-gray-200 hover:to-gray-100 
                   dark:hover:from-[var(--bg-pill-dark)]/90 dark:hover:to-[var(--bg-sidebar)]/90
                   border border-gray-200 dark:border-[var(--border)]
                   rounded-full transition-all duration-200 shadow-sm hover:shadow-md
                   transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="relative">
          <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-2 h-2 bg-[var(--accent-green)] rounded-full 
                          animate-ping opacity-30"></div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {connector && getWalletIcon(connector.name)}
          <span className="text-[var(--text-primary)] text-sm font-mono font-medium">
            {address ? truncateAddress(address) : ''}
          </span>
        </div>
        
        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] transition-transform 
                               group-hover:rotate-180 duration-200" />
      </button>

      {/* Expanded Wallet Info */}
      {showDropdown && (
        <div className="absolute top-full mt-2 right-0 bg-white dark:bg-[var(--bg-pill-dark)] 
                        border border-gray-200 dark:border-[var(--border)] rounded-2xl 
                        shadow-2xl z-50 min-w-80 overflow-hidden backdrop-blur-xl">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-[var(--border)] 
                          bg-gradient-to-r from-gray-50 to-white 
                          dark:from-[var(--bg-sidebar)] dark:to-[var(--bg-pill-dark)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-green)]/10 
                                flex items-center justify-center">
                  {connector && getWalletIcon(connector.name)}
                </div>
                <div>
                  <h3 className="text-[var(--text-primary)] font-semibold text-sm">
                    {connector ? getWalletDisplayName(connector.name) : 'Connected'}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-xs">
                    {isOnMantle ? 'Mantle Network' : 'Ethereum Network'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={refreshBalances}
                  disabled={isRefreshing}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] 
                             hover:bg-gray-100 dark:hover:bg-[var(--bg-sidebar)] rounded-lg
                             transition-colors disabled:opacity-50"
                  title="Refresh balances"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={handleDisconnect}
                  className="p-2 text-[var(--text-secondary)] hover:text-red-500 
                             hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg
                             transition-colors"
                  title="Disconnect wallet"
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Address & Copy */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[var(--bg-sidebar)] 
                            rounded-xl border border-gray-100 dark:border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)] text-xs font-medium">ADDRESS</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[var(--text-primary)] text-xs font-mono bg-white dark:bg-[var(--bg-pill-dark)] 
                                px-2 py-1 rounded border">
                  {address ? truncateAddress(address) : ''}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-green)] 
                             hover:bg-[var(--accent-green)]/10 rounded-lg transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Network Status */}
            {!isOnMantle && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 
                              dark:from-orange-950/20 dark:to-amber-950/20 
                              border border-orange-200 dark:border-orange-800/30 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/40 
                                flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                    Switch to Mantle
                  </p>
                  <p className="text-orange-600 dark:text-orange-400 text-xs mt-0.5">
                    For optimal experience and lower fees
                  </p>
                </div>
                <button
                  onClick={handleSwitchToMantle}
                  disabled={isSwitching}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 
                             text-white text-xs font-medium rounded-lg transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSwitching ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  {isSwitching ? 'Switching...' : 'Switch'}
                </button>
              </div>
            )}

            {/* Balances */}
            <div className="space-y-2">
              <h4 className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider">
                Balances
              </h4>
              
              {ethBalance && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[var(--bg-sidebar)] 
                                rounded-xl border border-gray-100 dark:border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 
                                    flex items-center justify-center text-white text-xs font-bold">
                      {isOnMantle ? 'M' : 'E'}
                    </div>
                    <span className="text-[var(--text-primary)] text-sm font-medium">
                      {isOnMantle ? 'MNT' : 'ETH'}
                    </span>
                  </div>
                  <span className="text-[var(--text-primary)] font-mono text-sm font-medium">
                    {formatBalance(ethBalance.value, ethBalance.symbol)}
                  </span>
                </div>
              )}

              {mantleBalance && !isOnMantle && (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[var(--bg-sidebar)] 
                                rounded-xl border border-gray-100 dark:border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 
                                    flex items-center justify-center text-white text-xs font-bold">
                      M
                    </div>
                    <span className="text-[var(--text-primary)] text-sm font-medium">MNT</span>
                  </div>
                  <span className="text-[var(--text-primary)] font-mono text-sm font-medium">
                    {formatBalance(mantleBalance.value, mantleBalance.symbol)}
                  </span>
                </div>
              )}
            </div>

            {/* Explorer Link */}
            {address && (
              <a
                href={getExplorerUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 text-[var(--text-secondary)] 
                           hover:text-[var(--accent-green)] bg-gray-50 dark:bg-[var(--bg-sidebar)]
                           hover:bg-[var(--accent-green)]/5 rounded-xl transition-all duration-200
                           border border-gray-100 dark:border-[var(--border)]
                           hover:border-[var(--accent-green)]/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm font-medium">View on Explorer</span>
              </a>
            )}
          </div>
        </div>
      )}

      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}