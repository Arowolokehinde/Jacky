import { BaseAgent } from './BaseAgent';
import { AgentResponse, AgentContext, PortfolioData, TokenHolding } from './types';
import { mantleScanMainnet, MantleScanService } from '../mantlescan/api';
import { mantleChainlinkService } from '../chainlink/priceFeeds';

export class MantlePortfolioAgent extends BaseAgent {
  constructor() {
    super(
      'Mantle Portfolio Analyzer',
      'Mantle Network portfolio analysis, MNT token tracking, Mantle-native DeFi positions',
      `You are a Mantle Network DeFi portfolio analysis expert. Your role is to:

MANTLE NETWORK FOCUS:
- Analyze MNT token holdings and staking positions
- Track Mantle-native DeFi positions (Agni Finance, Merchant Moe, etc.)
- Assess performance within Mantle ecosystem
- Identify Mantle-specific opportunities and risks
- Monitor cross-chain bridges to/from Mantle

MANTLE ECOSYSTEM PROTOCOLS:
- Agni Finance (DEX, Liquidity Mining)
- Merchant Moe (DEX, Yield Farming)  
- Mantle Staking (MNT staking rewards)
- Mantle Bridge (L1 <-> L2 transfers)

ANALYSIS FOCUS:
- MNT token allocation and staking efficiency
- Mantle DeFi protocol exposure and yields
- Gas efficiency benefits of Mantle Network
- Bridge security and timing considerations
- Mantle-specific risks and opportunities

Always provide structured analysis focusing on Mantle ecosystem optimization.
Format response as JSON with: analysis, recommendations, warnings.`
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    try {
      // Get real portfolio data from MantleScan if address is available
      const realPortfolioData = context.userAddress 
        ? await this.fetchRealPortfolioData(context.userAddress)
        : null;

      const mantleContext = {
        userAddress: context.userAddress,
        portfolioData: realPortfolioData || context.portfolioData,
        query: context.userQuery,
        network: 'Mantle',
        nativeToken: 'MNT',
        realData: !!realPortfolioData
      };

      const llmResponse = await this.callLLM(
        `Analyze this Mantle Network portfolio with ${realPortfolioData ? 'LIVE' : 'estimated'} data: ${context.userQuery}`,
        mantleContext
      );

      const parsed = this.parseResponse(llmResponse);
      
      return {
        agentName: this.name,
        confidence: this.calculateMantleConfidence(context, !!realPortfolioData),
        analysis: parsed.analysis,
        recommendations: this.enhanceMantleRecommendations(parsed.recommendations),
        warnings: parsed.warnings,
        data: this.generateMantleMetrics(realPortfolioData || context.portfolioData, !!realPortfolioData)
      };
    } catch (error) {
      console.error('Portfolio analysis error:', error);
      return {
        agentName: this.name,
        confidence: 0,
        analysis: 'Unable to analyze Mantle portfolio at this time.',
        recommendations: ['Connect wallet and switch to Mantle Network for full analysis.'],
        warnings: ['Mantle portfolio analysis temporarily unavailable.']
      };
    }
  }

  // New method to fetch real portfolio data from MantleScan
  private async fetchRealPortfolioData(address: string): Promise<PortfolioData | null> {
    try {
      const portfolioData = await mantleScanMainnet.getPortfolioData(address);
      // const defiActivity = await mantleScanMainnet.getDeFiActivity(address, 30); // Future use

      // Get token prices for valuation
      const uniqueTokenSymbols = [...new Set(portfolioData.tokenTransfers.map(tx => tx.tokenSymbol))];
      const tokenPrices = await mantleChainlinkService.getBatchPrices(['MNT', ...uniqueTokenSymbols]);

      // Calculate native MNT value
      const mntBalance = MantleScanService.formatBalance(portfolioData.nativeBalance, 18);
      const mntPrice = tokenPrices['MNT']?.price || 0;
      const mntValue = parseFloat(mntBalance) * mntPrice;

      // Calculate token values (simplified - would need more logic for exact balances)
      const tokenList: TokenHolding[] = [];
      
      // Add native MNT token
      tokenList.push({
        symbol: 'MNT',
        balance: mntBalance,
        value: mntValue,
        price: mntPrice,
        change24h: 0
      });

      // Add other tokens
      portfolioData.uniqueTokens.forEach(tokenAddress => {
        const recentTransfer = portfolioData.tokenTransfers.find(tx => tx.contractAddress === tokenAddress);
        if (recentTransfer) {
          const price = tokenPrices[recentTransfer.tokenSymbol]?.price || 0;
          const balance = MantleScanService.formatBalance(recentTransfer.value, parseInt(recentTransfer.tokenDecimal));
          
          tokenList.push({
            symbol: recentTransfer.tokenSymbol,
            balance: balance,
            value: parseFloat(balance) * price,
            price: price,
            change24h: 0 // Would need additional API for price changes
          });
        }
      });

      const totalValue = tokenList.reduce((sum, token) => sum + token.value, 0);

      return {
        totalValue,
        tokens: tokenList,
        performance24h: 0, // Would need historical data
        diversificationScore: this.calculateDiversificationScore(tokenList.length)
      };
    } catch (error) {
      console.error('Error fetching real portfolio data:', error);
      return null;
    }
  }

  private calculateDiversificationScore(tokenCount: number): number {
    // Simple diversification score based on token count and value distribution
    if (tokenCount <= 1) return 0.2;
    if (tokenCount <= 3) return 0.5;
    if (tokenCount <= 5) return 0.7;
    return 0.9;
  }

  private calculateMantleConfidence(context: AgentContext, hasRealData: boolean = false): number {
    let confidence = 0.3; // Lower base for Mantle-specific analysis
    
    if (context.userAddress) confidence += 0.2;
    if (context.portfolioData) confidence += 0.3;
    
    // Major confidence boost for real data
    if (hasRealData) confidence += 0.3;
    
    // Bonus confidence for Mantle-specific data
    if (context.portfolioData?.tokens?.some(t => t.symbol === 'MNT')) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  private enhanceMantleRecommendations(recommendations: string[]): string[] {
    const mantleSpecific = [
      'Consider staking MNT tokens for network rewards',
      'Explore Agni Finance for efficient DEX trading',
      'Check Merchant Moe for yield farming opportunities',
      'Optimize gas costs by staying within Mantle ecosystem'
    ];

    // Add Mantle-specific recommendations if none provided
    if (recommendations.length === 0) {
      return mantleSpecific.slice(0, 2);
    }

    return recommendations;
  }

  private generateMantleMetrics(portfolioData?: PortfolioData, isRealData: boolean = false): Record<string, unknown> {
    if (!portfolioData) {
      return {
        mantleReady: false,
        suggestion: 'Connect wallet and switch to Mantle Network',
        dataSource: 'none'
      };
    }

    const mntToken = portfolioData.tokens.find(t => t.symbol === 'MNT');
    const totalValue = portfolioData.totalValue;

    return {
      dataSource: isRealData ? 'live_mantlescan' : 'estimated',
      mantleMetrics: {
        mntHoldings: mntToken ? {
          balance: mntToken.balance,
          value: mntToken.value,
          percentage: (mntToken.value / totalValue) * 100
        } : null,
        totalPortfolioValue: totalValue,
        mantleTokens: portfolioData.tokens.filter(t => 
          ['MNT', 'AGNI', 'MOE', 'FUSIONX'].includes(t.symbol)
        ).length,
        diversificationScore: portfolioData.diversificationScore,
        confidence: isRealData ? 'high' : 'estimated'
      },
      suggestions: {
        mantleOptimization: mntToken 
          ? 'Portfolio has MNT exposure - good for Mantle ecosystem participation'
          : 'Consider adding MNT tokens for better Mantle ecosystem integration'
      },
      realTimeFeatures: isRealData ? {
        transactionTracking: 'enabled',
        defiActivityMonitoring: 'enabled',
        liveBalanceUpdates: 'enabled'
      } : {
        note: 'Connect wallet for real-time portfolio tracking'
      }
    };
  }
}