import { BaseAgent } from './BaseAgent';
import { AgentResponse, AgentContext } from './types';

export interface TransactionPreview {
  description: string;
  beforeBalance: string;
  afterBalance: string;
  netChange: string;
  gasCost: string;
  risks: string[];
  timeEstimate: string;
  // Phase 2: Enhanced safety analysis
  safetyScore: number; // 0-100 (100 = safest)
  safetyLevel: 'high' | 'medium' | 'low' | 'danger';
  warnings: string[];
  successProbability: number; // 0-100 (100 = certain success)
  contractVerified?: boolean;
  addressRisk?: 'safe' | 'unknown' | 'suspicious' | 'dangerous';
}

export interface ContractAction {
  type: 'mnt_transfer' | 'token_swap' | 'price_feeds' | 'mnt_staking' | 'mnt_claim_rewards' | 'mnt_unstake';
  contractAddress: string;
  functionName: string;
  parameters: Record<string, unknown>;
  estimatedGas: string;
  preview?: TransactionPreview;
}

export class FrankyAgent extends BaseAgent {
  private contracts = {
    mntTransfer: '0x991a8F634ED1d64C13848F575867f3740806ae2D',
    simpleAMM: '0xac705b5873f4b40b765C1eeCf4cab43A13A0F1D7', // SimpleAMM v2 with real liquidity
    chainlinkAnalyzer: '0x5cDE7eBfBc10877027c7dE81311b7a6503f38A8E', // ChainlinkAnalyzer v3 with real price-based opportunities
    mantleStaking: '0x1b1a2581886F1c2b715858cffF8679Eed90A7028', // Deployed MantleStaking contract
    // Removed incorrect mETH contracts (those are for Ethereum L1, not Mantle)
  };

  // Test token addresses for Mantle Sepolia
  private tokens = {
    MNT: '0x0000000000000000000000000000000000000000', // Native token
    TUSDC: '0x8Dae0Abd9e5E86612953E723A388105C8BBe5Dc9', // Test USDC
    TWETH: '0x5616773169F46e4e917F8261f415D9E2E7D3562a', // Test WETH
    // Aliases for user convenience
    USDC: '0x8Dae0Abd9e5E86612953E723A388105C8BBe5Dc9',
    WETH: '0x5616773169F46e4e917F8261f415D9E2E7D3562a',
    ETH: '0x5616773169F46e4e917F8261f415D9E2E7D3562a'
  };

  constructor() {
    super('Franky - Mantle DeFi Agent', 'defi_executor', 'high');
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    if (!context.userAddress) {
      return this.generateWalletRequiredResponse();
    }

    try {
      const action = this.parseAction(context.userQuery, context.userAddress);
      
      if (!action) {
        return this.generateHelpResponse();
      }

      return await this.prepareContractAction(action);
    } catch (error) {
      console.error('Franky error:', error);
      return this.generateErrorResponse();
    }
  }

  private parseAction(query: string, userAddress: string): ContractAction | null {
    const q = query.toLowerCase();

    // MNT Transfer: "send 100 MNT to 0x..."
    const transferMatch = q.match(/send\s+(\d+\.?\d*)\s*mnt\s+to\s+(0x[a-f0-9]{40})/i);
    if (transferMatch) {
      const action: ContractAction = {
        type: 'mnt_transfer',
        contractAddress: transferMatch[2], // Direct transfer to recipient
        functionName: 'transfer',
        parameters: {
          recipient: transferMatch[2],
          amount: transferMatch[1],
          from: userAddress
        },
        estimatedGas: '0.001'
      };
      action.preview = this.generateTransactionPreview(action, userAddress);
      return action;
    }

    // Token Swap: "swap 100 MNT for USDC"  
    const swapMatch = q.match(/swap\s+(\d+\.?\d*)\s*(\w+)\s+for\s+(\w+)/i);
    if (swapMatch) {
      const fromTokenSymbol = swapMatch[2].toUpperCase();
      const toTokenSymbol = swapMatch[3].toUpperCase();
      
      // Validate tokens are supported
      const fromTokenAddress = this.tokens[fromTokenSymbol as keyof typeof this.tokens];
      const toTokenAddress = this.tokens[toTokenSymbol as keyof typeof this.tokens];
      
      if (!fromTokenAddress || !toTokenAddress) {
        return null; // Unsupported token pair
      }
      
      const action: ContractAction = {
        type: 'token_swap',
        contractAddress: this.contracts.simpleAMM,
        functionName: 'swap',
        parameters: {
          tokenIn: fromTokenAddress,
          tokenOut: toTokenAddress,
          amountIn: swapMatch[1],
          fromTokenSymbol,
          toTokenSymbol,
          user: userAddress
        },
        estimatedGas: '0.002'
      };
      action.preview = this.generateTransactionPreview(action, userAddress);
      return action;
    }

    // Price Feeds: "check prices", "price feeds", "market data"
    if (q.includes('price') || q.includes('market') || q.includes('feed')) {
      const action: ContractAction = {
        type: 'price_feeds',
        contractAddress: this.contracts.chainlinkAnalyzer,
        functionName: 'getAllPrices',
        parameters: {
          tokens: ['MNT', 'ETH', 'USDC', 'BTC', 'LINK', 'USDT']
        },
        estimatedGas: '0.0005'
      };
      action.preview = this.generateTransactionPreview(action, userAddress);
      return action;
    }

    // MNT Staking: "stake 10 MNT" or "stake 5 mnt" - Mantle Native Staking
    const stakeMatch = q.match(/stake\s+(\d+\.?\d*)\s*(mnt|eth)?/i);
    if (stakeMatch || q.includes('stake')) {
      const amount = stakeMatch ? stakeMatch[1] : '10'; // Default 10 MNT if no amount specified
      const token = stakeMatch && stakeMatch[2] ? stakeMatch[2].toLowerCase() : 'mnt';
      
      // Convert ETH staking requests to MNT staking on Mantle
      if (token === 'eth') {
        // Auto-convert to MNT staking with a warning
        console.log('Converting ETH staking request to MNT staking for Mantle Network');
      }
      
      const action: ContractAction = {
        type: 'mnt_staking',
        contractAddress: this.contracts.mantleStaking, // Will be updated after deployment
        functionName: 'stakeMNT',
        parameters: {
          amount: amount,
          user: userAddress
        },
        estimatedGas: '0.001'
      };
      action.preview = this.generateTransactionPreview(action, userAddress);
      return action;
    }

    // Claim Staking Rewards: "claim rewards", "claim staking rewards", "harvest rewards"
    if (q.includes('claim') && (q.includes('reward') || q.includes('staking'))) {
      const action: ContractAction = {
        type: 'mnt_claim_rewards',
        contractAddress: this.contracts.mantleStaking,
        functionName: 'claimRewards',
        parameters: {
          user: userAddress
        },
        estimatedGas: '0.001'
      };
      action.preview = this.generateTransactionPreview(action, userAddress);
      return action;
    }

    // Unstake MNT: "unstake", "unstake all", "withdraw staking"
    if (q.includes('unstake') || (q.includes('withdraw') && q.includes('staking'))) {
      const action: ContractAction = {
        type: 'mnt_unstake',
        contractAddress: this.contracts.mantleStaking,
        functionName: 'unstakeAll',
        parameters: {
          user: userAddress
        },
        estimatedGas: '0.002'
      };
      action.preview = this.generateTransactionPreview(action, userAddress);
      return action;
    }

    return null;
  }

  private analyzeAddressSafety(address: string): { risk: 'safe' | 'unknown' | 'suspicious' | 'dangerous', warnings: string[] } {
    const warnings: string[] = [];
    
    // Check for common scam patterns
    if (address.toLowerCase().includes('000000000000000000000000000000000000')) {
      return { risk: 'dangerous', warnings: ['Null address detected - funds will be lost permanently'] };
    }
    
    // Check for similar addresses to known contracts (typosquatting)
    const knownContracts = {
      '0x35578E7e8949B5a59d40704dCF6D6faEC2Fb1D17': 'MNT Token',
      '0x2b3AbFD1D90694e8eFeB0840e4ff1ce2bCf429d2': 'ChainlinkAnalyzer'
    };
    
    for (const [knownAddr, name] of Object.entries(knownContracts)) {
      if (address.toLowerCase() !== knownAddr.toLowerCase() && 
          this.calculateAddressSimilarity(address, knownAddr) > 0.8) {
        warnings.push(`Similar to ${name} contract - verify carefully`);
        return { risk: 'suspicious', warnings };
      }
    }
    
    // Known safe contracts
    if (Object.keys(knownContracts).includes(address)) {
      return { risk: 'safe', warnings: [] };
    }
    
    // Default assessment for unknown addresses
    warnings.push('Unknown address - exercise caution');
    return { risk: 'unknown', warnings };
  }
  
  private calculateAddressSimilarity(addr1: string, addr2: string): number {
    const a1 = addr1.toLowerCase();
    const a2 = addr2.toLowerCase();
    let matches = 0;
    const length = Math.min(a1.length, a2.length);
    
    for (let i = 0; i < length; i++) {
      if (a1[i] === a2[i]) matches++;
    }
    
    return matches / Math.max(a1.length, a2.length);
  }
  
  private calculateSafetyScore(action: ContractAction, addressRisk: string, amount?: string): { score: number, level: 'high' | 'medium' | 'low' | 'danger' } {
    let score = 100; // Start with perfect score
    
    // Address risk penalty
    switch (addressRisk) {
      case 'dangerous': score -= 70; break;
      case 'suspicious': score -= 40; break;
      case 'unknown': score -= 20; break;
      case 'safe': break;
    }
    
    // Amount risk (larger amounts = higher risk)
    if (amount) {
      const amountNum = parseFloat(amount);
      if (amountNum > 1000) score -= 30;
      else if (amountNum > 100) score -= 15;
      else if (amountNum > 10) score -= 5;
    }
    
    // Action type risk
    switch (action.type) {
      case 'price_feeds': score += 0; break; // No additional risk
      case 'mnt_transfer': score -= 10; break; // Moderate risk
      case 'token_swap': score -= 25; break; // Higher risk (slippage, MEV)
      case 'mnt_staking': score -= 10; break; // Low risk (simple staking, no slashing)
      case 'mnt_claim_rewards': score += 5; break; // Very safe (claiming rewards)
      case 'mnt_unstake': score -= 5; break; // Low risk (withdrawing your own funds)
    }
    
    // Determine safety level
    let level: 'high' | 'medium' | 'low' | 'danger';
    if (score >= 80) level = 'high';
    else if (score >= 60) level = 'medium';
    else if (score >= 30) level = 'low';
    else level = 'danger';
    
    return { score: Math.max(0, Math.min(100, score)), level };
  }

  private generateTransactionPreview(action: ContractAction, userAddress: string): TransactionPreview {
    switch (action.type) {
      case 'mnt_transfer':
        const amount = action.parameters.amount as string;
        const recipient = action.parameters.recipient as string;
        const addressSafety = this.analyzeAddressSafety(recipient);
        const safety = this.calculateSafetyScore(action, addressSafety.risk, amount);
        
        // Generate comprehensive warnings
        const warnings: string[] = [...addressSafety.warnings];
        if (parseFloat(amount) > 100) {
          warnings.push('Large amount transfer - double-check recipient');
        }
        if (recipient.toLowerCase() === userAddress.toLowerCase()) {
          warnings.push('Sending to yourself - transaction will succeed but no net change');
        }
        
        return {
          description: `Transfer ${amount} MNT to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
          beforeBalance: 'Current wallet balance',
          afterBalance: `${amount} MNT less in wallet`,
          netChange: `-${amount} MNT (-$${(parseFloat(amount) * 0.65).toFixed(2)})`, // Rough MNT price
          gasCost: '~$0.01 (gas fee)',
          risks: ['Irreversible transfer', 'Verify recipient address'],
          timeEstimate: '~30 seconds',
          // Enhanced safety analysis
          safetyScore: safety.score,
          safetyLevel: safety.level,
          warnings,
          successProbability: addressSafety.risk === 'dangerous' ? 25 : 95,
          addressRisk: addressSafety.risk,
          contractVerified: addressSafety.risk === 'safe'
        };

      case 'token_swap':
        const swapAmount = action.parameters.amountIn as string;
        const fromTokenSymbol = action.parameters.fromTokenSymbol as string;
        const toTokenSymbol = action.parameters.toTokenSymbol as string;
        const swapSafety = this.calculateSafetyScore(action, 'safe', swapAmount); // Our AMM is safe
        
        // Calculate rough exchange rate for preview
        let estimatedOutput = 'Est.';
        if (fromTokenSymbol === 'MNT' && toTokenSymbol === 'USDC') {
          estimatedOutput = `~${(parseFloat(swapAmount) * 0.647).toFixed(2)}`;
        } else if (fromTokenSymbol === 'MNT' && (toTokenSymbol === 'WETH' || toTokenSymbol === 'ETH')) {
          estimatedOutput = `~${(parseFloat(swapAmount) * 0.0002).toFixed(4)}`;
        } else if (fromTokenSymbol === 'USDC' && toTokenSymbol === 'MNT') {
          estimatedOutput = `~${(parseFloat(swapAmount) / 0.647).toFixed(2)}`;
        }
        
        // Generate swap-specific warnings
        const swapWarnings: string[] = [];
        if (parseFloat(swapAmount) > 500) {
          swapWarnings.push('Large swap - consider breaking into smaller trades');
        }
        
        return {
          description: `Swap ${swapAmount} ${fromTokenSymbol} for ${toTokenSymbol}`,
          beforeBalance: `${swapAmount} ${fromTokenSymbol}`,
          afterBalance: `${estimatedOutput} ${toTokenSymbol} (with 0.3% fee)`,
          netChange: `Convert ${fromTokenSymbol} → ${toTokenSymbol}`,
          gasCost: '~$0.01 (gas only, 0.3% swap fee)',
          risks: ['Price slippage 0.3-1%', 'Limited testnet liquidity'],
          timeEstimate: '~30 seconds',
          // Enhanced safety analysis
          safetyScore: swapSafety.score,
          safetyLevel: swapSafety.level,
          warnings: swapWarnings,
          successProbability: 95, // Our AMM is simple and reliable
          contractVerified: true, // Our deployed AMM
          addressRisk: 'safe'
        };

      case 'price_feeds':
        const priceSafety = this.calculateSafetyScore(action, 'safe'); // No amount, safe action
        return {
          description: 'Fetch real-time price feeds',
          beforeBalance: 'Current portfolio',
          afterBalance: 'Same portfolio + price data',
          netChange: 'No balance change (read-only)',
          gasCost: 'Free (no transaction)',
          risks: [],
          timeEstimate: '~5 seconds',
          // Enhanced safety analysis
          safetyScore: priceSafety.score,
          safetyLevel: priceSafety.level,
          warnings: [], // No warnings for read-only operations
          successProbability: 99, // Almost always succeeds
          contractVerified: true, // Our Chainlink contract is verified
          addressRisk: 'safe'
        };

      case 'mnt_staking':
        const stakeAmount = action.parameters.amount as string;
        const stakeSafety = this.calculateSafetyScore(action, 'safe', stakeAmount);
        
        // Calculate estimated annual rewards (5% APY)
        const annualRewards = (parseFloat(stakeAmount) * 0.05).toFixed(4);
        
        // Generate staking-specific warnings
        const stakeWarnings: string[] = [];
        if (parseFloat(stakeAmount) > 100) {
          stakeWarnings.push('Large staking amount - consider diversifying');
        }
        stakeWarnings.push('Rewards are calculated continuously and can be claimed anytime');
        stakeWarnings.push('You can unstake your MNT at any time with accumulated rewards');
        
        return {
          description: `Stake ${stakeAmount} MNT for rewards (Mantle Native Staking)`,
          beforeBalance: `${stakeAmount} MNT`,
          afterBalance: `${stakeAmount} MNT staked + ~${annualRewards} MNT/year rewards`,
          netChange: `Stake MNT → Earn 5% APY`,
          gasCost: '~$0.01 (gas fee)',
          risks: ['Smart contract risk (minimal)', 'No slashing risk (not validator staking)'],
          timeEstimate: '~30 seconds',
          // Enhanced safety analysis
          safetyScore: stakeSafety.score,
          safetyLevel: stakeSafety.level,
          warnings: stakeWarnings,
          successProbability: 98, // Simple staking contract
          contractVerified: true, // Our verified contract
          addressRisk: 'safe'
        };

      case 'mnt_claim_rewards':
        const claimSafety = this.calculateSafetyScore(action, 'safe'); // Very safe action
        return {
          description: 'Claim accumulated staking rewards',
          beforeBalance: 'Current staked MNT + pending rewards',
          afterBalance: 'Current staked MNT + claimed rewards in wallet',
          netChange: 'Harvest rewards → Wallet balance',
          gasCost: '~$0.005 (minimal gas)',
          risks: [], // No risks for claiming your own rewards
          timeEstimate: '~15 seconds',
          // Enhanced safety analysis
          safetyScore: claimSafety.score,
          safetyLevel: claimSafety.level,
          warnings: ['Rewards are automatically calculated based on time staked'],
          successProbability: 99, // Almost always succeeds
          contractVerified: true,
          addressRisk: 'safe'
        };

      case 'mnt_unstake':
        const unstakeSafety = this.calculateSafetyScore(action, 'safe'); // Safe action
        return {
          description: 'Unstake all MNT and claim rewards',
          beforeBalance: 'Staked MNT + accumulated rewards',
          afterBalance: 'All MNT + rewards returned to wallet',
          netChange: 'Complete withdrawal from staking',
          gasCost: '~$0.01 (gas fee)',
          risks: ['Transaction will fail if no MNT is staked'],
          timeEstimate: '~30 seconds',
          // Enhanced safety analysis
          safetyScore: unstakeSafety.score,
          safetyLevel: unstakeSafety.level,
          warnings: ['This will unstake ALL your MNT and claim all rewards', 'You can re-stake anytime after unstaking'],
          successProbability: 98,
          contractVerified: true,
          addressRisk: 'safe'
        };

      default:
        const defaultSafety = this.calculateSafetyScore(action, 'unknown');
        return {
          description: 'Unknown transaction type',
          beforeBalance: 'Current state',
          afterBalance: 'New state',
          netChange: 'Changes pending confirmation',
          gasCost: `~$${action.estimatedGas}`,
          risks: ['Unknown risks'],
          timeEstimate: '~1-2 minutes',
          // Enhanced safety analysis
          safetyScore: defaultSafety.score,
          safetyLevel: defaultSafety.level,
          warnings: ['Unknown transaction type - proceed with extreme caution'],
          successProbability: 50, // Unknown outcome
          contractVerified: false,
          addressRisk: 'unknown'
        };
    }
  }

  private async prepareContractAction(action: ContractAction): Promise<AgentResponse> {
    const actionDescriptions = {
      mnt_transfer: `Send ${action.parameters.amount} MNT to ${action.parameters.recipient}`,
      token_swap: `Swap ${action.parameters.amountIn} ${action.parameters.fromTokenSymbol} for ${action.parameters.toTokenSymbol}`,
      price_feeds: 'Check current Chainlink price feeds',
      mnt_staking: `Stake ${action.parameters.amount} MNT for staking rewards`,
      mnt_claim_rewards: 'Claim your accumulated staking rewards',
      mnt_unstake: 'Unstake all MNT and claim rewards'
    };

    const recommendations = action.type === 'mnt_transfer' 
      ? [
          `Recipient: ${action.parameters.recipient}`,
          `Amount: ${action.parameters.amount} MNT`,
          `Method: Direct native transfer`,
          `Gas estimate: ${action.estimatedGas} MNT`,
          'Ready to execute - confirm transaction in wallet'
        ]
      : action.type === 'price_feeds'
      ? [
          '📊 Get real-time price data from Chainlink oracles',
          '💰 View current market prices for all supported tokens',
          '⚡ Instant price check - no transaction required',
          'Click below to fetch latest prices'
        ]
      : action.type === 'mnt_staking'
      ? [
          `🚀 Stake ${action.parameters.amount} MNT via Mantle Staking`,
          '💰 Earn 5% APY on your staked MNT tokens',
          '🔄 Claim rewards anytime or auto-compound',
          '⚡ Unstake anytime with accumulated rewards',
          `⛽ Gas estimate: ${action.estimatedGas} MNT`,
          'Ready to stake - confirm transaction in wallet'
        ]
      : action.type === 'mnt_claim_rewards'
      ? [
          '🎁 Claim your accumulated staking rewards',
          '💰 Rewards calculated automatically based on time staked',
          '⚡ Keep your MNT staked to continue earning',
          '🔒 Your staked MNT remains locked and earning',
          `⛽ Gas estimate: ${action.estimatedGas} MNT`,
          'Ready to claim - confirm transaction in wallet'
        ]
      : action.type === 'mnt_unstake'
      ? [
          '📤 Unstake ALL your MNT and claim rewards',
          '💰 Receive all staked MNT + accumulated rewards',
          '⚠️ This will completely exit your staking position',
          '🔄 You can re-stake anytime after unstaking',
          `⛽ Gas estimate: ${action.estimatedGas} MNT`,
          'Ready to unstake - confirm transaction in wallet'
        ]
      : [
          `Contract: ${action.contractAddress}`,
          `Function: ${action.functionName}`,
          `Gas estimate: ${action.estimatedGas} MNT`,
          'Ready to execute - confirm transaction in wallet'
        ];

    return {
      agentName: this.name,
      confidence: 0.9,
      analysis: actionDescriptions[action.type],
      recommendations,
      warnings: [],
      data: {
        contractAction: action,
        requiresTransaction: true
      }
    };
  }

  private generateWalletRequiredResponse(): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.8,
      analysis: 'Please connect your wallet to perform DeFi actions on Mantle.',
      recommendations: [
        'Connect wallet to continue',
        'Supported: MetaMask, WalletConnect',
        'Network: Mantle (Chain ID 5000)'
      ],
      warnings: ['Wallet connection required'],
      data: { requiresWallet: true }
    };
  }

  private generateHelpResponse(): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.7,
      analysis: 'I can help you with DeFi actions on Mantle. Here are the available commands:',
      recommendations: [
        '💸 "Send 100 MNT to 0x..." - Transfer MNT tokens',
        '🔄 "Swap 50 MNT for USDC" - Exchange tokens via DEX',
        '🚀 "Stake 10 ETH" - Stake ETH for mETH rewards',
        '📊 "Find best yield" - Analyze yield farming opportunities'
      ],
      warnings: [],
      data: { helpMode: true }
    };
  }

  private generateErrorResponse(): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.3,
      analysis: 'Unable to process your request. Please try a different command.',
      recommendations: [
        'Check your wallet connection',
        'Verify contract addresses are set',
        'Try: "Send 10 MNT to 0x..." or "Swap 50 MNT for USDC"'
      ],
      warnings: ['Action processing failed'],
      data: { error: true }
    };
  }
}