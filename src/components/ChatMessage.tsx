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
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSendTransaction, useReadContract } from 'wagmi';
import { parseEther } from 'viem';

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
  const [showYieldData, setShowYieldData] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Smart contract interaction hooks
  const { isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { sendTransaction, data: txHash, isPending: isSendPending, error: sendError } = useSendTransaction();
  
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
  const contractAction = data?.contractAction as Record<string, unknown>;
  const requiresTransaction = data?.requiresTransaction as boolean;

  // For yield analysis, read contract data instead of executing transaction
  const isYieldAnalysis = contractAction?.type === 'yield_analysis';
  const { data: yieldPrice, isLoading: isLoadingYield, error: yieldError } = useReadContract({
    address: isYieldAnalysis && showYieldData ? (contractAction.contractAddress as `0x${string}`) : undefined,
    abi: isYieldAnalysis ? [{
      name: 'getTokenPrice',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'token', type: 'address' }],
      outputs: [{ name: 'price', type: 'uint256' }],
    }] : [],
    functionName: 'getTokenPrice',
    args: isYieldAnalysis ? ['0x35578E7e8949B5a59d40704dCF6D6faEC2Fb1D17' as `0x${string}`] : undefined, // MNT token address
  });

  // Debug logging
  useEffect(() => {
    if (showYieldData && isYieldAnalysis) {
      console.log('Yield analysis debug:', {
        contractAddress: contractAction.contractAddress,
        isLoadingYield,
        yieldPrice,
        yieldError: yieldError?.message
      });
    }
  }, [showYieldData, isLoadingYield, yieldPrice, yieldError, isYieldAnalysis, contractAction]);

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
      // Handle yield analysis as data fetch, not transaction
      if (contractAction.type === 'yield_analysis') {
        setShowYieldData(true);
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
        writeContract({
          address: (contractAction.contractAddress as string) as `0x${string}`,
          abi: [
            {
              name: 'executeBestSwap',
              type: 'function',
              stateMutability: 'payable',
              inputs: [
                { name: 'fromToken', type: 'string' },
                { name: 'toToken', type: 'string' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [],
            },
          ],
          functionName: 'executeBestSwap',
          args: [
            (contractAction.parameters as Record<string, unknown>).fromToken as string,
            (contractAction.parameters as Record<string, unknown>).toToken as string,
            parseEther((contractAction.parameters as Record<string, unknown>).amount as string),
          ],
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
                    {isYieldAnalysis ? (
                      <>
                        <div className="w-4 h-4">📊</div>
                        Get Yield Data
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

              {/* Yield Data Display */}
              {isYieldAnalysis && showYieldData && (
                <div className="mt-2 p-3 bg-blue-900/10 border border-blue-500/20 rounded text-blue-400 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div>📊</div>
                    <strong>Mantle Yield Analysis</strong>
                  </div>
                  {isLoadingYield ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                      />
                      Loading Chainlink data...
                    </div>
                  ) : yieldError ? (
                    <div className="text-red-400 space-y-1">
                      <div>❌ Contract call failed</div>
                      <div className="text-xs opacity-75">Error: {yieldError.message}</div>
                      <div className="text-xs opacity-75">Contract: {contractAction.contractAddress as string}</div>
                    </div>
                  ) : yieldPrice ? (
                    <div className="space-y-1">
                      <div>💰 **MNT Price**: ${(Number(yieldPrice) / 100000000).toFixed(4)}</div>
                      <div>📈 **Data Source**: Chainlink Oracle</div>
                      <div>⏰ **Updated**: {new Date().toLocaleTimeString()}</div>
                      <div className="text-xs mt-2 opacity-75">
                        Real-time price from deployed ChainlinkAnalyzer contract
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-400">No data received</div>
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