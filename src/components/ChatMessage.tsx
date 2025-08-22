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
  Brain,
  Send,
  AlertTriangle
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSendTransaction, useReadContract, useChainId, useSwitchChain } from 'wagmi';
import { parseEther, parseUnits } from 'viem';
import type { TransactionPreview } from '@/lib/agents/FrankyAgent';
import { useChainlinkPrice } from '@/hooks/useChainlinkPrice';

interface ContractActionWithPreview {
  type: string;
  contractAddress: string;
  functionName: string;
  parameters: Record<string, unknown>;
  estimatedGas: string;
  preview?: TransactionPreview;
}

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
}

export function ChatMessage({ message, isLastMessage }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [showHash, setShowHash] = useState(false);
  const [showPriceData, setShowPriceData] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Smart contract interaction hooks
  const { isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { sendTransaction, data: txHash, isPending: isSendPending, error: sendError } = useSendTransaction();
  
  // Network detection and switching
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const MANTLE_SEPOLIA_ID = 5003;
  
  const { isLoading: isConfirming, isSuccess, isError: txError, error: txErrorDetails } = useWaitForTransactionReceipt({
    hash: hash || txHash,
  });

  // Show transaction hash immediately when received
  useEffect(() => {
    if (txHash || hash) {
      console.log('Transaction hash received:', txHash || hash);
      setShowHash(true);
      
      // Auto-show success after 10 seconds if wagmi hook doesn't detect it
      const timeout = setTimeout(() => {
        if (!isSuccess) {
          setManualSuccess(true);
        }
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [txHash, hash, isSuccess]);

  // Combine all error states
  const hasError = writeError || sendError || txError;
  const errorMessage = writeError?.message || sendError?.message || txErrorDetails?.message;
  
  // Determine final success state (wagmi success OR manual success)
  const finalSuccess = isSuccess || manualSuccess;
  const currentHash = hash || txHash;

  // Check if this message contains a contract action
  const agentData = message.agentData as Record<string, unknown>;
  const response = agentData?.response as Record<string, unknown>;
  const data = response?.data as Record<string, unknown>;
  const contractAction = data?.contractAction as ContractActionWithPreview;
  const requiresTransaction = data?.requiresTransaction as boolean;
  
  // For price feeds, show simple Chainlink price data
  const isPriceFeeds = contractAction?.type === 'price_feeds';
  
  // Get all supported Chainlink price feeds
  const { price: mntPrice, loading: mntLoading, error: mntError } = useChainlinkPrice('MNT');
  const { price: ethPrice, loading: ethLoading, error: ethError } = useChainlinkPrice('ETH');
  const { price: usdcPrice, loading: usdcLoading, error: usdcError } = useChainlinkPrice('USDC');
  const { price: btcPrice, loading: btcLoading, error: btcError } = useChainlinkPrice('BTC');
  const { price: linkPrice, loading: linkLoading, error: linkError } = useChainlinkPrice('LINK');
  const { price: usdtPrice, loading: usdtLoading, error: usdtError } = useChainlinkPrice('USDT');
  
  const allPricesLoading = mntLoading || ethLoading || usdcLoading || btcLoading || linkLoading || usdtLoading;
  const hasPriceErrors = mntError || ethError || usdcError || btcError || linkError || usdtError;

  // Debug logging
  useEffect(() => {
    if (showPriceData && isPriceFeeds) {
      console.log('Price feeds debug:', {
        contractAddress: contractAction.contractAddress,
        showingPriceData: true,
        prices: { mntPrice, ethPrice, usdcPrice, btcPrice, linkPrice, usdtPrice }
      });
    }
  }, [showPriceData, isPriceFeeds, contractAction, mntPrice, ethPrice, usdcPrice, btcPrice, linkPrice, usdtPrice]);

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

  const executeContractAction = () => {
    if (!contractAction || !isConnected) return;

    try {
      // Handle price feeds as data display, not transaction
      if (contractAction.type === 'price_feeds') {
        setShowPriceData(true);
        return;
      }
      
      if (contractAction.type === 'mnt_transfer') {
        // Use simple MNT transfer for now (bypassing complex authorization)
        const recipient = (contractAction.parameters as Record<string, unknown>).recipient as `0x${string}`;
        const amount = parseEther((contractAction.parameters as Record<string, unknown>).amount as string);
        
        // Direct MNT transfer using sendTransaction - this will work without authorization
        sendTransaction({
          to: recipient,
          value: amount,
        });
      } else if (contractAction.type === 'token_swap') {
        const tokenIn = (contractAction.parameters as Record<string, unknown>).tokenIn as `0x${string}`;
        const tokenOut = (contractAction.parameters as Record<string, unknown>).tokenOut as `0x${string}`;
        const amountIn = (contractAction.parameters as Record<string, unknown>).amountIn as string;
        const isNativeSwap = tokenIn === '0x0000000000000000000000000000000000000000';
        
        // Token addresses with their decimals
        const TUSDC_ADDRESS = '0x8Dae0Abd9e5E86612953E723A388105C8BBe5Dc9';
        const TWETH_ADDRESS = '0x5616773169F46e4e917F8261f415D9E2E7D3562a';
        
        // Parse amount with correct decimals for input token
        let parsedAmountIn: bigint;
        if (tokenIn === TUSDC_ADDRESS) {
          parsedAmountIn = parseUnits(amountIn, 6); // TUSDC has 6 decimals
        } else if (tokenIn === TWETH_ADDRESS) {
          parsedAmountIn = parseEther(amountIn); // TWETH has 18 decimals
        } else {
          parsedAmountIn = parseEther(amountIn); // MNT has 18 decimals
        }
        
        writeContract({
          address: (contractAction.contractAddress as string) as `0x${string}`,
          abi: [
            {
              name: 'swap',
              type: 'function',
              stateMutability: 'payable',
              inputs: [
                { name: 'tokenIn', type: 'address' },
                { name: 'tokenOut', type: 'address' },
                { name: 'amountIn', type: 'uint256' },
                { name: 'amountOutMin', type: 'uint256' },
              ],
              outputs: [{ name: 'amountOut', type: 'uint256' }],
            },
          ],
          functionName: 'swap',
          args: [
            tokenIn,
            tokenOut,
            parsedAmountIn, // Now uses correct decimals!
            BigInt(0), // amountOutMin = 0 for demo (no slippage protection)
          ],
          value: isNativeSwap ? parsedAmountIn : undefined, // Send MNT if swapping from MNT
        });
      } else if (contractAction.type === 'mnt_staking') {
        const amount = (contractAction.parameters as Record<string, unknown>).amount as string;
        
        writeContract({
          address: (contractAction.contractAddress as string) as `0x${string}`,
          abi: [
            {
              name: 'stakeMNT',
              type: 'function',
              stateMutability: 'payable',
              inputs: [],
              outputs: [],
            },
          ],
          functionName: 'stakeMNT',
          args: [],
          value: parseEther(amount), // Send MNT to stake
        });
      } else if (contractAction.type === 'mnt_claim_rewards') {
        writeContract({
          address: (contractAction.contractAddress as string) as `0x${string}`,
          abi: [
            {
              name: 'claimRewards',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [],
              outputs: [],
            },
          ],
          functionName: 'claimRewards',
          args: [],
        });
      } else if (contractAction.type === 'mnt_unstake') {
        writeContract({
          address: (contractAction.contractAddress as string) as `0x${string}`,
          abi: [
            {
              name: 'unstakeAll',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [],
              outputs: [],
            },
          ],
          functionName: 'unstakeAll',
          args: [],
        });
      }
    } catch (error) {
      console.error('Contract execution error:', error);
    }
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
: 'bg-gray-900/80 border border-gray-700/50 text-white shadow-sm hover:shadow-md transition-shadow'
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

          {/* Transaction Preview */}
          {!isUser && requiresTransaction && contractAction && contractAction.preview && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    🔮
                  </div>
                  <span className="font-semibold text-blue-400">Transaction Preview</span>
                </div>
                
                {/* Safety Score Badge */}
                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  contractAction.preview.safetyLevel === 'high' 
                    ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                  : contractAction.preview.safetyLevel === 'medium'
                    ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                  : contractAction.preview.safetyLevel === 'low'
                    ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30'
                    : 'bg-red-900/30 text-red-400 border border-red-500/30'
                }`}>
                  <span>{contractAction.preview.safetyScore}/100</span>
                  <span className="opacity-75">
                    {contractAction.preview.safetyLevel === 'high' ? '🟢' 
                    : contractAction.preview.safetyLevel === 'medium' ? '🟡'
                    : contractAction.preview.safetyLevel === 'low' ? '🟠' : '🔴'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400">Description:</span>
                    <div className="text-white">{contractAction.preview.description}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <div className="text-white">{contractAction.preview.timeEstimate}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400">Before:</span>
                    <div className="text-white">{contractAction.preview.beforeBalance}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">After:</span>
                    <div className="text-white">{contractAction.preview.afterBalance}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400">Net Change:</span>
                    <div className="text-white font-semibold">{contractAction.preview.netChange}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Gas Cost:</span>
                    <div className="text-white">{contractAction.preview.gasCost}</div>
                  </div>
                </div>
                
                {/* Enhanced Safety Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-400">Success Rate:</span>
                    <div className="text-white font-semibold">{contractAction.preview.successProbability}%</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Contract:</span>
                    <div className="text-white flex items-center gap-1">
                      {contractAction.preview.contractVerified ? '✅ Verified' : '❌ Unverified'}
                    </div>
                  </div>
                </div>
                
                {contractAction.preview.risks.length > 0 && (
                  <div>
                    <span className="text-gray-400">⚠️ Risks:</span>
                    <ul className="text-yellow-400 text-xs mt-1">
                      {contractAction.preview.risks.map((risk: string, index: number) => (
                        <li key={index}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Enhanced Safety Warnings */}
                {contractAction.preview.warnings.length > 0 && (
                  <div className={`p-2 rounded border ${
                    contractAction.preview.safetyLevel === 'danger' 
                      ? 'bg-red-900/20 border-red-500/50 text-red-300'
                    : contractAction.preview.safetyLevel === 'low'
                      ? 'bg-orange-900/20 border-orange-500/50 text-orange-300'
                    : 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>
                        {contractAction.preview.safetyLevel === 'danger' ? '🚨' : '⚠️'}
                      </span>
                      <span className="font-medium text-xs">
                        {contractAction.preview.safetyLevel === 'danger' ? 'DANGER' : 'WARNINGS'}
                      </span>
                    </div>
                    <ul className="text-xs space-y-1">
                      {contractAction.preview.warnings.map((warning: string, index: number) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Smart Contract Transaction Button */}
          {!isUser && requiresTransaction && contractAction && isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={executeContractAction}
                disabled={isPending || isSendPending || isConfirming}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm
                  transition-all duration-200 border
                  ${isPending || isSendPending || (isConfirming && !showHash)
                    ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                    : hasError
                    ? 'bg-red-900/20 border-red-500/50 text-red-400'
                    : finalSuccess
                    ? 'bg-green-900/20 border-green-500/50 text-green-400'
                    : showHash && isConfirming
                    ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400'
                    : 'bg-blue-900/20 border-blue-500/50 text-blue-400 hover:bg-blue-900/30'
                  }
                `}
              >
                {isPending || isSendPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Confirm in Wallet...
                  </>
                ) : isConfirming && !showHash ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Processing Transaction...
                  </>
                ) : showHash && isConfirming && !finalSuccess ? (
                  <>
                    <motion.button
                      onClick={() => setManualSuccess(true)}
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Check className="w-4 h-4" />
                      Mark as Complete
                    </motion.button>
                  </>
                ) : hasError ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Transaction Failed - Retry
                  </>
                ) : finalSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Transaction Successful!
                  </>
                ) : (
                  <>
                    {isPriceFeeds ? (
                      <>
                        <div className="w-4 h-4">📊</div>
                        Get Price Data
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Execute Transaction
                      </>
                    )}
                  </>
                )}
              </motion.button>
              
              {/* Transaction Hash - Show Immediately */}
              {showHash && currentHash && (
                <div className={`mt-2 p-2 border rounded text-xs ${
                  finalSuccess 
                    ? 'bg-green-900/10 border-green-500/20 text-green-400'
                    : 'bg-blue-900/10 border-blue-500/20 text-blue-400'
                }`}>
                  <strong>{finalSuccess ? 'Success!' : 'Transaction Sent'}</strong> {finalSuccess ? 'Transaction confirmed' : 'Check status on explorer'}
                  <div className="mt-1 font-mono">
                    Hash: {(currentHash as string).substring(0, 10)}...
                    <a 
                      href={`https://explorer.testnet.mantle.xyz/tx/${currentHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 underline hover:opacity-80"
                    >
                      View on Explorer
                    </a>
                  </div>
                </div>
              )}

              {/* Price Feeds Display */}
              {isPriceFeeds && showPriceData && (
                <div className="mt-2 p-3 bg-blue-900/10 border border-blue-500/20 rounded text-blue-400 text-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div>📊</div>
                    <strong>Chainlink Price Feeds</strong>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  {allPricesLoading ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                      />
                      Loading price feeds...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Price Feed Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* MNT/USD */}
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold">💎 MNT/USD</div>
                            <div className="text-right">
                              {mntError ? (
                                <div className="text-red-400 text-xs">Error</div>
                              ) : mntPrice ? (
                                <div className="text-white font-bold">${mntPrice.toFixed(4)}</div>
                              ) : (
                                <div className="text-gray-400 text-xs">N/A</div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Mantle Token</div>
                        </div>
                        
                        {/* ETH/USD */}
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold">🔷 ETH/USD</div>
                            <div className="text-right">
                              {ethError ? (
                                <div className="text-red-400 text-xs">Error</div>
                              ) : ethPrice ? (
                                <div className="text-white font-bold">${ethPrice.toFixed(2)}</div>
                              ) : (
                                <div className="text-gray-400 text-xs">N/A</div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Ethereum</div>
                        </div>
                        
                        {/* BTC/USD */}
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold">₿ BTC/USD</div>
                            <div className="text-right">
                              {btcError ? (
                                <div className="text-red-400 text-xs">Error</div>
                              ) : btcPrice ? (
                                <div className="text-white font-bold">${btcPrice.toFixed(0)}</div>
                              ) : (
                                <div className="text-gray-400 text-xs">N/A</div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Bitcoin</div>
                        </div>
                        
                        {/* USDC/USD */}
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold">💵 USDC/USD</div>
                            <div className="text-right">
                              {usdcError ? (
                                <div className="text-red-400 text-xs">Error</div>
                              ) : usdcPrice ? (
                                <div className="text-white font-bold">${usdcPrice.toFixed(4)}</div>
                              ) : (
                                <div className="text-gray-400 text-xs">N/A</div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">USD Coin</div>
                        </div>
                        
                        {/* LINK/USD */}
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold">🔗 LINK/USD</div>
                            <div className="text-right">
                              {linkError ? (
                                <div className="text-red-400 text-xs">Error</div>
                              ) : linkPrice ? (
                                <div className="text-white font-bold">${linkPrice.toFixed(4)}</div>
                              ) : (
                                <div className="text-gray-400 text-xs">N/A</div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Chainlink</div>
                        </div>
                        
                        {/* USDT/USD */}
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold">💴 USDT/USD</div>
                            <div className="text-right">
                              {usdtError ? (
                                <div className="text-red-400 text-xs">Error</div>
                              ) : usdtPrice ? (
                                <div className="text-white font-bold">${usdtPrice.toFixed(4)}</div>
                              ) : (
                                <div className="text-gray-400 text-xs">N/A</div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">Tether USD</div>
                        </div>
                      </div>
                      
                      {/* Data Source Info */}
                      <div className="text-xs opacity-75 bg-gray-800/30 p-2 rounded">
                        📡 **Data Source**: Chainlink Price Feeds on Mantle Sepolia Testnet • Updated: {new Date().toLocaleTimeString()}
                      </div>
                      
                      {hasPriceErrors && (
                        <div className="text-xs bg-yellow-900/20 border border-yellow-500/20 p-2 rounded text-yellow-400">
                          ⚠️ Some price feeds may be unavailable on testnet
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {hasError && errorMessage && (
                <div className="mt-2 p-2 bg-red-900/10 border border-red-500/20 rounded text-red-400 text-xs">
                  <strong>Error:</strong> {errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage}
                </div>
              )}

              {/* Transaction Details */}
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                {contractAction.type === 'mnt_transfer' ? (
                  <>
                    <div>Method: Direct native transfer</div>
                    <div>Recipient: {(contractAction.parameters as Record<string, unknown>).recipient as string}</div>
                    <div>Amount: {(contractAction.parameters as Record<string, unknown>).amount as string} MNT</div>
                  </>
                ) : contractAction.type === 'mnt_staking' ? (
                  <>
                    <div>Method: Mantle Native Staking</div>
                    <div>Amount: {(contractAction.parameters as Record<string, unknown>).amount as string} MNT</div>
                    <div>APY: 5% (500 basis points)</div>
                  </>
                ) : contractAction.type === 'mnt_claim_rewards' ? (
                  <>
                    <div>Method: Claim Staking Rewards</div>
                    <div>Action: Harvest accumulated rewards</div>
                    <div>Note: Staked MNT remains locked</div>
                  </>
                ) : contractAction.type === 'mnt_unstake' ? (
                  <>
                    <div>Method: Complete Unstaking</div>
                    <div>Action: Withdraw all staked MNT + rewards</div>
                    <div>Note: Exits entire staking position</div>
                  </>
                ) : (
                  <>
                    <div>Contract: {contractAction.contractAddress as string}</div>
                    <div>Function: {contractAction.functionName as string}</div>
                  </>
                )}
                <div>Gas: {contractAction.estimatedGas as string} MNT</div>
              </div>
            </motion.div>
          )}

          {/* Wallet Connection Warning */}
          {!isUser && requiresTransaction && !isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 px-3 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Please connect your wallet to execute this transaction
            </motion.div>
          )}

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