// FRANKY - Portfolio Manager with Wallet Access
// Phase 2: Wallet integration, swaps, transfers, transaction analysis
// Requires: Real DEX APIs, Chainlink integration, Smart contracts

import { BaseAgent } from './BaseAgent';
import { AgentResponse, AgentContext } from './types';
import { mantleScanMainnet } from '../mantlescan/api';
import { mantleChainlinkService } from '../chainlink/priceFeeds';

export interface SwapRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
  userAddress: string;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  route: string[];
  priceImpact: number;
  gasEstimate: string;
  exchangeRate: string;
}

export interface TransferRequest {
  token: string;
  recipient: string;
  amount: string;
  userAddress: string;
}

export class FrankyAgent extends BaseAgent {
  private chainId: number = 5000; // Mantle mainnet

  constructor() {
    super(
      'Franky - Portfolio Manager',
      'Wallet-connected portfolio manager specializing in swaps, transfers, and transaction analysis',
      `You are Franky, the professional portfolio manager for Mantle Network. Your role is to:

CORE CAPABILITIES:
- Access and analyze wallet balances
- Execute token swaps (MNT ↔ USDC, etc.)
- Handle token transfers
- Provide transaction analysis
- Real-time portfolio tracking

TRANSACTION FLOW:
1. Analyze user request (swap/transfer)
2. Get real-time quotes using Chainlink price feeds
3. Present clear confirmation details
4. Guide user through wallet signing
5. Provide transaction hash and status

PORTFOLIO ANALYSIS:
- Live balance tracking via MantleScan
- Transaction history analysis
- Performance tracking
- Risk assessment
- Yield optimization suggestions

SECURITY FOCUS:
- Always show transaction details before execution
- Validate slippage and price impact
- Check for sufficient gas and balances
- Warning for large transactions

Responses should be professional, clear, and include specific numbers and actionable steps.`
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    if (!context.userAddress) {
      return this.generateWalletRequiredResponse();
    }

    try {
      // Determine user intent
      const intent = this.classifyUserIntent(context.userQuery);
      
      switch (intent.type) {
        case 'swap':
          return await this.handleSwapRequest(context, intent.details);
        case 'transfer':
          return await this.handleTransferRequest(context, intent.details);
        case 'balance':
          return await this.handleBalanceInquiry(context);
        case 'analysis':
          return await this.handleTransactionAnalysis(context);
        default:
          return await this.handlePortfolioOverview(context);
      }
    } catch (error) {
      console.error('Franky portfolio analysis error:', error);
      return {
        agentName: this.name,
        confidence: 0,
        analysis: 'I\'m having trouble accessing your portfolio data right now.',
        recommendations: ['Please try again in a moment', 'Ensure you\'re connected to Mantle Network'],
        warnings: ['Portfolio data temporarily unavailable']
      };
    }
  }

  private classifyUserIntent(query: string): { type: string; details: Record<string, unknown> } {
    const queryLower = query.toLowerCase();
    
    // Swap detection
    if (queryLower.includes('swap') || queryLower.includes('trade') || queryLower.includes('exchange')) {
      return {
        type: 'swap',
        details: this.extractSwapDetails(query)
      };
    }
    
    // Transfer detection
    if (queryLower.includes('send') || queryLower.includes('transfer')) {
      return {
        type: 'transfer',
        details: this.extractTransferDetails(query)
      };
    }
    
    // Balance inquiry
    if (queryLower.includes('balance') || queryLower.includes('how much')) {
      return { type: 'balance', details: {} };
    }
    
    // Transaction analysis
    if (queryLower.includes('transaction') || queryLower.includes('history')) {
      return { type: 'analysis', details: {} };
    }
    
    return { type: 'portfolio', details: {} };
  }

  private extractSwapDetails(query: string): Partial<SwapRequest> {
    // Simple regex patterns to extract swap details
    const swapPatterns = [
      /swap\s+(\d+\.?\d*)\s*(\w+)\s+(?:to|for)\s+(\w+)/i,
      /(\d+\.?\d*)\s*(\w+)\s+(?:to|for)\s+(\w+)/i
    ];
    
    for (const pattern of swapPatterns) {
      const match = query.match(pattern);
      if (match) {
        return {
          amount: match[1],
          fromToken: match[2].toUpperCase(),
          toToken: match[3].toUpperCase()
        };
      }
    }
    
    return {};
  }

  private extractTransferDetails(query: string): Partial<TransferRequest> {
    // Simple pattern to extract transfer details
    const transferPattern = /(?:send|transfer)\s+(\d+\.?\d*)\s*(\w+)\s+to\s+(0x[a-fA-F0-9]{40})/i;
    const match = query.match(transferPattern);
    
    if (match) {
      return {
        amount: match[1],
        token: match[2].toUpperCase(),
        recipient: match[3]
      };
    }
    
    return {};
  }

  private async handleSwapRequest(context: AgentContext, swapDetails: Partial<SwapRequest>): Promise<AgentResponse> {
    if (!swapDetails.fromToken || !swapDetails.toToken || !swapDetails.amount) {
      return {
        agentName: this.name,
        confidence: 0.6,
        analysis: 'I understand you want to make a swap, but I need more details.',
        recommendations: [
          'Please specify: amount, from token, and to token',
          'Example: "Swap 100 MNT to USDC"',
          'I can help with MNT, ETH, USDC, and other Mantle tokens'
        ],
        warnings: []
      };
    }

    try {
      // Get real-time quote
      const quote = await this.getSwapQuote({
        fromToken: swapDetails.fromToken!,
        toToken: swapDetails.toToken!,
        amount: swapDetails.amount!,
        userAddress: context.userAddress!,
        slippage: 0.5 // Default 0.5%
      });

      return {
        agentName: this.name,
        confidence: 0.9,
        analysis: `I can help you swap ${swapDetails.amount} ${swapDetails.fromToken} to ${swapDetails.toToken}. Here are the current details:`,
        recommendations: [
          `You'll receive approximately ${quote.toAmount} ${swapDetails.toToken}`,
          `Exchange rate: 1 ${swapDetails.fromToken} = ${quote.exchangeRate} ${swapDetails.toToken}`,
          `Estimated gas: ${quote.gasEstimate} MNT`,
          'Confirm to proceed with the swap'
        ],
        warnings: quote.priceImpact > 3 ? [`High price impact: ${quote.priceImpact}%`] : [],
        data: {
          swapQuote: quote,
          requiresConfirmation: true,
          nextStep: 'confirm_swap'
        }
      };
    } catch {
      return {
        agentName: this.name,
        confidence: 0.3,
        analysis: 'Unable to get swap quote at this time.',
        recommendations: ['Check your connection to Mantle Network', 'Try again in a moment'],
        warnings: ['Swap service temporarily unavailable']
      };
    }
  }

  private async handleBalanceInquiry(context: AgentContext): Promise<AgentResponse> {
    try {
      const portfolioData = await mantleScanMainnet.getPortfolioData(context.userAddress!);
      const tokenPrices = await mantleChainlinkService.getBatchPrices(['MNT', 'ETH', 'USDC']);
      
      // Calculate balances with values - keeping real implementation
      const balances = await this.calculateBalancesWithValues(portfolioData, tokenPrices);
      
      // Type assertion for the balances array since we know the structure
      const typedBalances = balances as Array<{
        symbol: string;
        balance: string;
        value: number;
      }>;
      
      const totalValue = typedBalances.reduce((sum, token) => sum + token.value, 0);

      return {
        agentName: this.name,
        confidence: 0.95,
        analysis: `Your current portfolio value is $${totalValue.toLocaleString()} across ${typedBalances.length} tokens.`,
        recommendations: [
          `MNT Balance: ${typedBalances.find(t => t.symbol === 'MNT')?.balance || '0'} MNT`,
          ...typedBalances.filter(t => t.symbol !== 'MNT').map(token => 
            `${token.symbol}: ${token.balance} ($${token.value.toFixed(2)})`
          ).slice(0, 4),
          typedBalances.length > 5 ? `... and ${typedBalances.length - 5} more tokens` : ''
        ].filter(Boolean),
        warnings: [],
        data: {
          balances: typedBalances,
          totalValue,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch {
      return {
        agentName: this.name,
        confidence: 0.3,
        analysis: 'Unable to fetch your current balances.',
        recommendations: ['Ensure you\'re connected to Mantle Network', 'Try refreshing your connection'],
        warnings: ['Balance data temporarily unavailable']
      };
    }
  }

  private async handleTransferRequest(_context: AgentContext, transferDetails: Partial<TransferRequest>): Promise<AgentResponse> {
    if (!transferDetails.token || !transferDetails.amount || !transferDetails.recipient) {
      return {
        agentName: this.name,
        confidence: 0.6,
        analysis: 'I can help you transfer tokens, but I need complete details.',
        recommendations: [
          'Please specify: amount, token, and recipient address',
          'Example: "Send 50 USDC to 0x..."',
          'Make sure the recipient address is correct'
        ],
        warnings: ['Double-check recipient address before sending']
      };
    }

    // Validate recipient address
    if (!this.isValidAddress(transferDetails.recipient!)) {
      return {
        agentName: this.name,
        confidence: 0.8,
        analysis: 'The recipient address appears to be invalid.',
        recommendations: ['Please provide a valid Ethereum/Mantle address starting with 0x'],
        warnings: ['Invalid addresses will cause transaction failures']
      };
    }

    return {
      agentName: this.name,
      confidence: 0.9,
      analysis: `I'll help you transfer ${transferDetails.amount} ${transferDetails.token} to ${transferDetails.recipient}.`,
      recommendations: [
        'Please confirm the recipient address is correct',
        'Transaction cannot be reversed once confirmed',
        'Estimated gas fee will be calculated next'
      ],
      warnings: ['Always verify recipient address before confirming'],
      data: {
        transferDetails,
        requiresConfirmation: true,
        nextStep: 'confirm_transfer'
      }
    };
  }

  private async handleTransactionAnalysis(context: AgentContext): Promise<AgentResponse> {
    try {
      const transactions = await mantleScanMainnet.getTransactions(context.userAddress!, 0, 999999999, 1, 20);
      const tokenTransfers = await mantleScanMainnet.getTokenTransfers(context.userAddress!, undefined, 0, 999999999, 1, 20);
      
      const recentActivity = this.analyzeRecentActivity(transactions, tokenTransfers);
      
      // Type assertion for the activity analysis since we know the structure
      const typedActivity = recentActivity as {
        totalTransactions: number;
        swaps: number;
        transfers: number;
        totalGasSpent: string;
        topProtocol: string;
        avgValue: string;
        riskWarnings: string[];
      };
      
      return {
        agentName: this.name,
        confidence: 0.9,
        analysis: `Analysis of your last ${typedActivity.totalTransactions} transactions on Mantle Network.`,
        recommendations: [
          `Recent activity: ${typedActivity.swaps} swaps, ${typedActivity.transfers} transfers`,
          `Total gas spent: ${typedActivity.totalGasSpent} MNT`,
          `Most active protocol: ${typedActivity.topProtocol}`,
          `Average transaction value: $${typedActivity.avgValue}`
        ],
        warnings: typedActivity.riskWarnings,
        data: {
          transactionAnalysis: recentActivity,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch {
      return {
        agentName: this.name,
        confidence: 0.3,
        analysis: 'Unable to analyze your transaction history right now.',
        recommendations: ['Transaction analysis will be available once connected'],
        warnings: ['Historical data temporarily unavailable']
      };
    }
  }

  private async handlePortfolioOverview(context: AgentContext): Promise<AgentResponse> {
    try {
      const portfolioData = await mantleScanMainnet.getPortfolioData(context.userAddress!);
      const overview = await this.generatePortfolioOverview(portfolioData);
      
      // Type assertion for the overview since we know the structure
      const typedOverview = overview as {
        summary: string;
        recommendations: string[];
        warnings: string[];
        data: Record<string, unknown>;
      };
      
      return {
        agentName: this.name,
        confidence: 0.85,
        analysis: typedOverview.summary,
        recommendations: typedOverview.recommendations,
        warnings: typedOverview.warnings,
        data: typedOverview.data
      };
    } catch {
      return {
        agentName: this.name,
        confidence: 0.4,
        analysis: 'I can help with swaps, transfers, and portfolio analysis once your wallet is connected.',
        recommendations: [
          'Say "swap X MNT to USDC" for token swaps',
          'Say "send X tokens to address" for transfers',
          'Say "show my balance" for portfolio overview'
        ],
        warnings: []
      };
    }
  }

  // Helper methods (placeholder implementations)
  private async getSwapQuote(request: SwapRequest): Promise<SwapQuote> {
    // This would integrate with real DEX aggregators like 1inch, ParaSwap
    // For now, using Chainlink prices for estimation
    const fromPrice = await mantleChainlinkService.getTokenPrice(request.fromToken);
    const toPrice = await mantleChainlinkService.getTokenPrice(request.toToken);
    
    if (!fromPrice || !toPrice) {
      throw new Error('Unable to get token prices');
    }
    
    const fromAmount = parseFloat(request.amount);
    const exchangeRate = fromPrice.price / toPrice.price;
    const toAmount = (fromAmount * exchangeRate * (1 - request.slippage / 100)).toFixed(6);
    
    return {
      fromToken: request.fromToken,
      toToken: request.toToken,
      fromAmount: request.amount,
      toAmount,
      route: ['Agni Finance'], // Simplified
      priceImpact: 0.1, // Placeholder
      gasEstimate: '0.002',
      exchangeRate: exchangeRate.toFixed(6)
    };
  }

  private async calculateBalancesWithValues(portfolioData: unknown, tokenPrices: unknown): Promise<Array<{ symbol: string; balance: string; value: number }>> {
    // Implementation would calculate real balances with USD values
    // For now, return a basic structure until full implementation
    const data = portfolioData as { nativeBalance: string; tokenTransfers: Array<{ tokenSymbol: string; value: string }> };
    const prices = tokenPrices as { [key: string]: { price: number } };
    
    const balances: Array<{ symbol: string; balance: string; value: number }> = [];
    
    // Add MNT balance
    const mntBalance = parseFloat(data.nativeBalance || '0') / 1e18; // Convert from wei
    const mntPrice = prices['MNT']?.price || 0;
    balances.push({
      symbol: 'MNT',
      balance: mntBalance.toFixed(4),
      value: mntBalance * mntPrice
    });
    
    return balances;
  }

  private analyzeRecentActivity(transactions: unknown[], tokenTransfers: unknown[]): Record<string, unknown> {
    // Implementation would analyze transaction patterns
    return {
      totalTransactions: transactions.length + tokenTransfers.length,
      swaps: 0,
      transfers: 0,
      totalGasSpent: '0',
      topProtocol: 'Unknown',
      avgValue: '0',
      riskWarnings: []
    };
  }

  private async generatePortfolioOverview(_portfolioData: unknown): Promise<Record<string, unknown>> {
    // Implementation would generate comprehensive portfolio overview
    return {
      summary: 'Portfolio overview generation in progress',
      recommendations: [],
      warnings: [],
      data: {}
    };
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private generateWalletRequiredResponse(): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.8,
      analysis: 'I\'m Franky, your portfolio manager! I need access to your wallet to help with swaps, transfers, and balance tracking.',
      recommendations: [
        'Connect your wallet to get started',
        'Switch to Mantle Network (Chain ID: 5000)',
        'I can help with MNT, ETH, USDC swaps and transfers'
      ],
      warnings: [],
      data: {
        requiresWallet: true,
        supportedChains: [5000, 5001]
      }
    };
  }
}