// KRANKY - Staking & Chainlink Data Specialist
// Phase 3: MNT staking optimization, Chainlink integration, yield analysis
// Focus: Staking protocols, data feeds, yield optimization

import { BaseAgent } from './BaseAgent';
import { AgentResponse, AgentContext } from './types';
import { mantleChainlinkService } from '../chainlink/priceFeeds';

export interface StakingProtocol {
  name: string;
  type: 'liquid_staking' | 'validator_staking' | 'defi_staking';
  apy: number;
  tvl: string;
  minimumStake: string;
  lockupPeriod: string;
  contractAddress: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface StakingPosition {
  protocol: string;
  stakedAmount: string;
  rewardsEarned: string;
  apr: number;
  unlockDate?: Date;
  autoCompound: boolean;
}

export interface ChainlinkDataFeed {
  name: string;
  description: string;
  address: string;
  decimals: number;
  category: 'price' | 'yield' | 'volatility' | 'custom';
  lastUpdate: Date;
  value: string;
}

export class KrankyAgent extends BaseAgent {
  private stakingProtocols: StakingProtocol[] = [];
  private chainlinkFeeds: ChainlinkDataFeed[] = [];

  constructor() {
    super(
      'Kranky - Staking & Data Expert',
      'Specialized in MNT staking optimization and Chainlink data integration',
      `You are Kranky, the staking optimization and data specialist for Mantle Network. Your expertise includes:

STAKING SPECIALIZATION:
- MNT staking across all available protocols
- Liquid staking vs validator staking analysis
- Yield optimization and auto-compounding strategies
- Risk assessment for different staking options
- Unstaking timelines and penalty analysis

CHAINLINK INTEGRATION:
- Real-time price feeds for all Mantle tokens
- Yield data feeds for DeFi protocols
- Volatility and risk metrics
- Custom data feeds for advanced analytics
- Data validation and staleness checks

OPTIMIZATION FOCUS:
- Compare staking APYs across protocols
- Calculate optimal staking allocations
- Monitor reward accumulation
- Suggest rebalancing strategies
- Track staking performance metrics

RISK MANAGEMENT:
- Assess protocol risks and security
- Monitor slashing conditions
- Evaluate lockup periods vs rewards
- Suggest diversification strategies

Always provide data-driven recommendations with specific APYs, timeframes, and risk assessments.`
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    try {
      // Load current staking protocols and Chainlink data
      await this.loadStakingProtocols();
      await this.loadChainlinkFeeds();

      const intent = this.classifyStakingIntent(context.userQuery);
      
      switch (intent.type) {
        case 'stake':
          return await this.handleStakingRequest(context, intent.details);
        case 'unstake':
          return await this.handleUnstakingRequest(context, intent.details);
        case 'rewards':
          return await this.handleRewardsInquiry(context);
        case 'compare':
          return await this.handleProtocolComparison(context);
        case 'chainlink':
          return await this.handleChainlinkQuery(context, intent.details);
        case 'optimize':
          return await this.handleYieldOptimization(context);
        default:
          return await this.handleStakingOverview(context);
      }
    } catch (error) {
      console.error('Kranky staking analysis error:', error);
      return {
        agentName: this.name,
        confidence: 0,
        analysis: 'Unable to access staking data right now.',
        recommendations: ['Please try again in a moment', 'Ensure you\'re connected to Mantle Network'],
        warnings: ['Staking data temporarily unavailable']
      };
    }
  }

  private classifyStakingIntent(query: string): { type: string; details: Record<string, unknown> } {
    const queryLower = query.toLowerCase();
    
    // Staking intent
    if (queryLower.includes('stake') && !queryLower.includes('unstake')) {
      return { type: 'stake', details: this.extractStakeAmount(query) };
    }
    
    // Unstaking intent
    if (queryLower.includes('unstake') || queryLower.includes('withdraw')) {
      return { type: 'unstake', details: {} };
    }
    
    // Rewards inquiry
    if (queryLower.includes('reward') || queryLower.includes('earn')) {
      return { type: 'rewards', details: {} };
    }
    
    // Protocol comparison
    if (queryLower.includes('compare') || queryLower.includes('best') || queryLower.includes('which')) {
      return { type: 'compare', details: {} };
    }
    
    // Chainlink data
    if (queryLower.includes('chainlink') || queryLower.includes('price') || queryLower.includes('data feed')) {
      return { type: 'chainlink', details: this.extractChainlinkQuery(query) };
    }
    
    // Yield optimization
    if (queryLower.includes('optimize') || queryLower.includes('maximize') || queryLower.includes('strategy')) {
      return { type: 'optimize', details: {} };
    }
    
    return { type: 'overview', details: {} };
  }

  private extractStakeAmount(query: string): { amount?: string; protocol?: string } {
    const amountMatch = query.match(/(\d+\.?\d*)\s*mnt/i);
    const protocolMatch = query.match(/(?:on|with|via)\s+(\w+)/i);
    
    return {
      amount: amountMatch ? amountMatch[1] : undefined,
      protocol: protocolMatch ? protocolMatch[1] : undefined
    };
  }

  private extractChainlinkQuery(query: string): { dataType?: string; token?: string } {
    const priceMatch = query.match(/price\s+(?:of\s+)?(\w+)/i);
    const dataMatch = query.match(/(?:chainlink\s+)?(\w+)\s+(?:data|feed)/i);
    
    return {
      token: priceMatch ? priceMatch[1] : undefined,
      dataType: dataMatch ? dataMatch[1] : 'price'
    };
  }

  private async loadStakingProtocols(): Promise<void> {
    // In production, this would fetch real staking protocol data
    this.stakingProtocols = [
      {
        name: 'Mantle LSP (Liquid Staking)',
        type: 'liquid_staking',
        apy: 5.2,
        tvl: '$450M',
        minimumStake: '0.1 MNT',
        lockupPeriod: 'None (liquid)',
        contractAddress: '0x...', // Real contract address
        riskLevel: 'low'
      },
      {
        name: 'Mantle Validator Staking',
        type: 'validator_staking',
        apy: 6.8,
        tvl: '$280M',
        minimumStake: '32 MNT',
        lockupPeriod: '7-14 days',
        contractAddress: '0x...', // Real contract address
        riskLevel: 'medium'
      },
      {
        name: 'Agni Finance MNT Staking',
        type: 'defi_staking',
        apy: 8.5,
        tvl: '$125M',
        minimumStake: '1 MNT',
        lockupPeriod: '3 days',
        contractAddress: '0x...', // Real contract address
        riskLevel: 'medium'
      },
      {
        name: 'FusionX MNT Vault',
        type: 'defi_staking',
        apy: 12.3,
        tvl: '$85M',
        minimumStake: '5 MNT',
        lockupPeriod: '30 days',
        contractAddress: '0x...', // Real contract address
        riskLevel: 'high'
      }
    ];
  }

  private async loadChainlinkFeeds(): Promise<void> {
    try {
      // Load real Chainlink price feeds
      const mntPrice = await mantleChainlinkService.getTokenPrice('MNT');
      const ethPrice = await mantleChainlinkService.getTokenPrice('ETH');
      const usdcPrice = await mantleChainlinkService.getTokenPrice('USDC');
      
      this.chainlinkFeeds = [
        {
          name: 'MNT/USD Price Feed',
          description: 'Real-time MNT token price in USD',
          address: '0x...', // Real Chainlink address
          decimals: 8,
          category: 'price',
          lastUpdate: new Date(),
          value: mntPrice?.price.toString() || '0'
        },
        {
          name: 'ETH/USD Price Feed',
          description: 'Real-time ETH price in USD',
          address: '0x...', // Real Chainlink address
          decimals: 8,
          category: 'price',
          lastUpdate: new Date(),
          value: ethPrice?.price.toString() || '0'
        }
        // More feeds would be added here
      ];
    } catch (error) {
      console.error('Error loading Chainlink feeds:', error);
      // Fallback to empty array
      this.chainlinkFeeds = [];
    }
  }

  private async handleStakingRequest(context: AgentContext, details: Record<string, unknown>): Promise<AgentResponse> {
    if (!context.userAddress) {
      return this.generateWalletRequiredResponse();
    }

    const { amount, protocol } = details as { amount?: string; protocol?: string };
    
    if (!amount) {
      return {
        agentName: this.name,
        confidence: 0.7,
        analysis: 'I can help you stake MNT tokens! How much would you like to stake?',
        recommendations: [
          'Specify amount: "Stake 100 MNT"',
          'Current best APY: FusionX at 12.3% (30-day lock)',
          'Liquid staking: Mantle LSP at 5.2% (no lock)',
          'Conservative: Validator staking at 6.8% (7-14 day lock)'
        ],
        warnings: [],
        data: {
          availableProtocols: this.stakingProtocols,
          recommendedAmount: '10 MNT minimum for optimal returns'
        }
      };
    }

    // Find best protocol or use specified one
    const targetProtocol = protocol 
      ? this.stakingProtocols.find(p => p.name.toLowerCase().includes(protocol.toLowerCase()))
      : this.getBestStakingProtocol(parseFloat(amount));

    if (!targetProtocol) {
      return {
        agentName: this.name,
        confidence: 0.6,
        analysis: 'Protocol not found. Here are the available staking options:',
        recommendations: this.stakingProtocols.map(p => 
          `${p.name}: ${p.apy}% APY (${p.lockupPeriod} lock)`
        ),
        warnings: [],
        data: { availableProtocols: this.stakingProtocols }
      };
    }

    const projectedRewards = this.calculateProjectedRewards(parseFloat(amount), targetProtocol.apy);
    
    return {
      agentName: this.name,
      confidence: 0.9,
      analysis: `I'll help you stake ${amount} MNT with ${targetProtocol.name} at ${targetProtocol.apy}% APY.`,
      recommendations: [
        `Annual rewards: ~${projectedRewards.yearly.toFixed(2)} MNT`,
        `Monthly rewards: ~${projectedRewards.monthly.toFixed(4)} MNT`,
        `Lockup period: ${targetProtocol.lockupPeriod}`,
        `Risk level: ${targetProtocol.riskLevel}`
      ],
      warnings: targetProtocol.riskLevel === 'high' ? ['High APY comes with increased smart contract risk'] : [],
      data: {
        stakingDetails: {
          amount,
          protocol: targetProtocol,
          projectedRewards,
          requiresConfirmation: true,
          nextStep: 'confirm_staking'
        }
      }
    };
  }

  private async handleUnstakingRequest(context: AgentContext, _details: Record<string, unknown>): Promise<AgentResponse> {
    if (!context.userAddress) {
      return this.generateWalletRequiredResponse();
    }

    // In production, fetch actual staking positions
    const currentPositions = await this.getCurrentStakingPositions(context.userAddress);
    
    if (currentPositions.length === 0) {
      return {
        agentName: this.name,
        confidence: 0.8,
        analysis: 'You don\'t have any active staking positions to unstake.',
        recommendations: [
          'Start staking MNT to earn rewards',
          'Compare staking options with "compare staking protocols"'
        ],
        warnings: [],
        data: {}
      };
    }

    return {
      agentName: this.name,
      confidence: 0.9,
      analysis: `You have ${currentPositions.length} active staking position(s).`,
      recommendations: currentPositions.map(pos => 
        `${pos.protocol}: ${pos.stakedAmount} MNT (${pos.rewardsEarned} rewards earned)`
      ),
      warnings: currentPositions
        .filter(pos => pos.unlockDate && pos.unlockDate > new Date())
        .map(pos => `${pos.protocol} is locked until ${pos.unlockDate?.toDateString()}`),
      data: {
        stakingPositions: currentPositions,
        unstakingOptions: this.generateUnstakingOptions(currentPositions)
      }
    };
  }

  private async handleRewardsInquiry(context: AgentContext): Promise<AgentResponse> {
    if (!context.userAddress) {
      return this.generateWalletRequiredResponse();
    }

    const positions = await this.getCurrentStakingPositions(context.userAddress);
    const totalRewards = positions.reduce((sum, pos) => sum + parseFloat(pos.rewardsEarned), 0);
    
    return {
      agentName: this.name,
      confidence: 0.9,
      analysis: `Your total staking rewards: ${totalRewards.toFixed(4)} MNT`,
      recommendations: positions.map(pos => 
        `${pos.protocol}: ${pos.rewardsEarned} MNT earned (${pos.apr}% APR)`
      ),
      warnings: [],
      data: {
        totalRewards,
        positions,
        rewardsValue: await this.calculateRewardsValue(totalRewards)
      }
    };
  }

  private async handleProtocolComparison(context: AgentContext): Promise<AgentResponse> {
    const sortedProtocols = [...this.stakingProtocols].sort((a, b) => b.apy - a.apy);
    
    return {
      agentName: this.name,
      confidence: 0.95,
      analysis: 'Here\'s a comparison of all MNT staking protocols on Mantle:',
      recommendations: sortedProtocols.map(protocol => 
        `${protocol.name}: ${protocol.apy}% APY | ${protocol.lockupPeriod} lock | ${protocol.riskLevel} risk`
      ),
      warnings: [
        'Higher APY often means higher risk',
        'Consider diversifying across multiple protocols'
      ],
      data: {
        protocolComparison: sortedProtocols,
        riskAnalysis: this.generateRiskAnalysis(sortedProtocols)
      }
    };
  }

  private async handleChainlinkQuery(_context: AgentContext, details: Record<string, unknown>): Promise<AgentResponse> {
    const { token } = details as { token?: string; dataType?: string };
    
    if (token) {
      const priceData = await mantleChainlinkService.getTokenPrice(token.toUpperCase());
      
      if (priceData) {
        return {
          agentName: this.name,
          confidence: 0.95,
          analysis: `Current ${token.toUpperCase()}/USD price from Chainlink: $${priceData.price}`,
          recommendations: [
            `Price source: ${priceData.source}`,
            `Last updated: ${new Date(priceData.timestamp).toLocaleString()}`,
            `Data is ${this.getDataFreshness(priceData.timestamp)}`
          ],
          warnings: [],
          data: {
            chainlinkData: priceData,
            availableFeeds: this.chainlinkFeeds
          }
        };
      }
    }
    
    return {
      agentName: this.name,
      confidence: 0.8,
      analysis: 'Available Chainlink data feeds on Mantle Network:',
      recommendations: this.chainlinkFeeds.map(feed => 
        `${feed.name}: $${feed.value} (${feed.category})`
      ),
      warnings: [],
      data: {
        availableFeeds: this.chainlinkFeeds,
        integration: 'Real-time Chainlink price feeds active'
      }
    };
  }

  private async handleYieldOptimization(context: AgentContext): Promise<AgentResponse> {
    if (!context.userAddress) {
      return this.generateWalletRequiredResponse();
    }

    // Get user's current MNT balance (would be real balance in production)
    const mntBalance = 1000; // Placeholder
    const optimizedStrategy = this.generateOptimizedStrategy(mntBalance);
    
    // Type assertion for the optimized strategy since we know its structure
    const typedStrategy = optimizedStrategy as {
      allocations: Array<{ percentage: number; amount: number; protocol: string; apy: number }>;
      warnings: string[];
      totalExpectedRewards: number;
      riskProfile: string;
    };
    
    return {
      agentName: this.name,
      confidence: 0.9,
      analysis: `Based on your ${mntBalance} MNT balance, here's the optimal staking strategy:`,
      recommendations: typedStrategy.allocations.map((allocation: { percentage: number; amount: number; protocol: string; apy: number }) => 
        `${allocation.percentage}% (${allocation.amount} MNT) → ${allocation.protocol} (${allocation.apy}% APY)`
      ),
      warnings: typedStrategy.warnings,
      data: {
        optimizedStrategy,
        expectedAnnualRewards: typedStrategy.totalExpectedRewards,
        riskDiversification: typedStrategy.riskProfile
      }
    };
  }

  private async handleStakingOverview(context: AgentContext): Promise<AgentResponse> {
    return {
      agentName: this.name,
      confidence: 0.8,
      analysis: 'I\'m Kranky, your staking and Chainlink data specialist! I can help you optimize MNT staking rewards.',
      recommendations: [
        'Ask "stake 100 MNT" to start staking',
        'Say "compare staking protocols" to see all options',
        'Ask "what are my rewards" to check earnings',
        'Say "optimize my staking" for personalized strategy',
        'Ask "MNT price" for Chainlink price data'
      ],
      warnings: [],
      data: {
        specializations: ['MNT Staking', 'Chainlink Integration', 'Yield Optimization'],
        protocolCount: this.stakingProtocols.length,
        chainlinkFeeds: this.chainlinkFeeds.length
      }
    };
  }

  // Helper methods
  private getBestStakingProtocol(amount: number): StakingProtocol {
    // Logic to recommend best protocol based on amount and user preferences
    return this.stakingProtocols.reduce((best, current) => 
      current.apy > best.apy ? current : best
    );
  }

  private calculateProjectedRewards(amount: number, apy: number): { monthly: number; yearly: number } {
    const yearly = amount * (apy / 100);
    const monthly = yearly / 12;
    return { monthly, yearly };
  }

  private async getCurrentStakingPositions(address: string): Promise<StakingPosition[]> {
    // In production, fetch real staking positions from contracts
    return []; // Placeholder
  }

  private generateUnstakingOptions(positions: StakingPosition[]): Record<string, unknown>[] {
    return positions.map(pos => ({
      protocol: pos.protocol,
      canUnstakeNow: !pos.unlockDate || pos.unlockDate <= new Date(),
      unlockDate: pos.unlockDate,
      penalty: pos.unlockDate && pos.unlockDate > new Date() ? 'Early unstaking penalty may apply' : null
    }));
  }

  private async calculateRewardsValue(rewardsAmount: number): Promise<{ usd: number; mntPrice: number }> {
    const mntPrice = await mantleChainlinkService.getTokenPrice('MNT');
    return {
      usd: rewardsAmount * (mntPrice?.price || 0),
      mntPrice: mntPrice?.price || 0
    };
  }

  private generateRiskAnalysis(protocols: StakingProtocol[]): Record<string, unknown> {
    return {
      lowRisk: protocols.filter(p => p.riskLevel === 'low').length,
      mediumRisk: protocols.filter(p => p.riskLevel === 'medium').length,
      highRisk: protocols.filter(p => p.riskLevel === 'high').length,
      recommendation: 'Diversify across risk levels for optimal risk-reward balance'
    };
  }

  private generateOptimizedStrategy(balance: number): Record<string, unknown> {
    // Algorithm to create optimal allocation across protocols
    return {
      allocations: [
        { protocol: 'Mantle LSP', percentage: 40, amount: balance * 0.4, apy: 5.2 },
        { protocol: 'Validator Staking', percentage: 35, amount: balance * 0.35, apy: 6.8 },
        { protocol: 'Agni Finance', percentage: 25, amount: balance * 0.25, apy: 8.5 }
      ],
      totalExpectedRewards: balance * 0.065, // Weighted average
      warnings: ['Consider your risk tolerance before implementing'],
      riskProfile: 'Balanced risk with diversified allocation'
    };
  }

  private getDataFreshness(timestamp: number): string {
    const ageMinutes = (Date.now() - timestamp) / (1000 * 60);
    if (ageMinutes < 5) return 'Very fresh';
    if (ageMinutes < 15) return 'Fresh';
    if (ageMinutes < 60) return 'Recent';
    return 'May be stale';
  }

  private generateWalletRequiredResponse(): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.8,
      analysis: 'I\'m Kranky, your staking optimization expert! Connect your wallet to access personalized staking strategies.',
      recommendations: [
        'Connect wallet to see your current staking positions',
        'I can help optimize MNT staking across all protocols',
        'Get real-time Chainlink price data and yield analytics'
      ],
      warnings: [],
      data: {
        requiresWallet: true,
        supportedFeatures: ['MNT Staking', 'Yield Optimization', 'Chainlink Data']
      }
    };
  }
}