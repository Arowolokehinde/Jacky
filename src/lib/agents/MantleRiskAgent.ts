import { BaseAgent } from './BaseAgent';
import { AgentResponse, AgentContext } from './types';
import { mantleTokenTracker } from '../mantlescan/tokenTracker';
import { mantleScanMainnet } from '../mantlescan/api';

export class MantleRiskAgent extends BaseAgent {
  constructor() {
    super(
      'Mantle Risk Assessor',
      'Mantle Network DeFi risk analysis, protocol security, L2 bridge risks',
      `You are a Mantle Network DeFi risk analysis expert. Your role is to:

MANTLE-SPECIFIC RISK FACTORS:
1. L2 Bridge Security
   - Mantle<->Ethereum bridge risks
   - Cross-chain transaction delays (7-day withdrawal period)
   - Bridge contract vulnerabilities

2. Protocol-Specific Risks
   - Agni Finance ($121M TVL): Concentrated liquidity impermanent loss
   - Merchant Moe ($MOE token): New protocol risks, liquidity concentration
   - mETH/mUSD integrations: Liquid staking derivative risks

3. Network Risks
   - L2 sequencer downtime
   - Mantle Network governance risks
   - MNT token economics and inflation

4. Market Risks
   - Small ecosystem size ($302.96M total TVL)
   - Limited protocol diversity vs mainnet
   - Liquidity fragmentation across DEXs

5. Technical Risks
   - Smart contract audits status
   - MEV protection on L2
   - Gas price volatility

RISK ASSESSMENT LEVELS:
- LOW: Well-audited protocols, established TVL >$50M
- MEDIUM: Newer protocols, moderate TVL $10-50M  
- HIGH: New protocols <$10M TVL, unaudited contracts
- CRITICAL: Bridge vulnerabilities, governance attacks

Always provide structured risk analysis with specific mitigation strategies.
Format response as JSON with: analysis, recommendations, warnings.`
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    try {
      // Get real portfolio data for risk assessment
      const realRiskData = context.userAddress 
        ? await this.assessRealPortfolioRisks(context.userAddress)
        : null;

      const riskContext = {
        userAddress: context.userAddress,
        portfolioData: context.portfolioData,
        query: context.userQuery,
        realRiskAssessment: realRiskData,
        mantleEcosystem: {
          totalTVL: '302.96M',
          topProtocols: ['Agni Finance ($121M)', 'Merchant Moe', 'mETH/mUSD'],
          maturityLevel: 'Growing but still emerging'
        }
      };

      const llmResponse = await this.callLLM(
        `Assess Mantle DeFi risks with ${realRiskData ? 'LIVE portfolio analysis' : 'general guidance'} for: ${context.userQuery}`,
        riskContext
      );

      const parsed = this.parseResponse(llmResponse);
      
      return {
        agentName: this.name,
        confidence: this.calculateRiskConfidence(context, !!realRiskData),
        analysis: parsed.analysis,
        recommendations: this.enhanceRiskMitigation(parsed.recommendations, realRiskData || undefined),
        warnings: this.prioritizeWarnings(parsed.warnings, realRiskData || undefined),
        data: this.generateRiskMetrics(context, realRiskData || undefined)
      };
    } catch (error) {
      console.error('Risk analysis error:', error);
      return {
        agentName: this.name,
        confidence: 0.8, // High confidence in general risk warnings
        analysis: 'General Mantle DeFi risks apply.',
        recommendations: [
          'Always verify contract addresses on official protocol websites',
          'Start with small amounts on newer Mantle protocols',
          'Understand 7-day withdrawal period for Mantle bridge'
        ],
        warnings: ['Risk analysis temporarily unavailable - exercise extra caution']
      };
    }
  }

  // New method to assess real portfolio risks
  private async assessRealPortfolioRisks(address: string): Promise<Record<string, unknown> | null> {
    try {
      const portfolioSummary = await mantleTokenTracker.getPortfolioSummary(address);
      const recentActivity = await mantleScanMainnet.getDeFiActivity(address, 7);

      return {
        portfolioRisk: portfolioSummary.riskLevel,
        concentration: {
          protocolCount: portfolioSummary.protocolCount,
          diversificationScore: portfolioSummary.diversificationScore,
          riskLevel: portfolioSummary.protocolCount < 2 ? 'high' : 
                    portfolioSummary.protocolCount < 4 ? 'medium' : 'low'
        },
        recentActivity: {
          swapCount: recentActivity.swaps.length,
          stakingCount: recentActivity.stakingActivity.length,
          liquidityCount: recentActivity.liquidityProvision.length,
          riskLevel: recentActivity.swaps.length > 10 ? 'high' : 'medium'
        },
        totalValue: portfolioSummary.totalValue,
        sizeRisk: portfolioSummary.totalValue > 100000 ? 'high' :
                 portfolioSummary.totalValue > 10000 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error assessing real portfolio risks:', error);
      return null;
    }
  }

  private calculateRiskConfidence(context: AgentContext, hasRealData: boolean = false): number {
    let confidence = 0.7; // High base confidence for risk assessment
    
    if (context.portfolioData) confidence += 0.2;
    if (context.userAddress) confidence += 0.1;
    if (hasRealData) confidence += 0.2; // Boost for real portfolio analysis
    
    return Math.min(confidence, 1.0);
  }

  private enhanceRiskMitigation(recommendations: string[], realRiskData?: Record<string, unknown>): string[] {
    const mantleSpecificMitigation = [
      'Use Agni Finance for larger trades (highest TVL at $121M)',
      'Limit exposure to single protocol <20% of portfolio',
      'Keep emergency funds on L1 for instant liquidity',
      'Monitor Mantle bridge status before large transfers',
      'Diversify across Agni Finance and Merchant Moe for reduced risk'
    ];

    // Add real data-driven recommendations
    if (realRiskData) {
      const concentration = realRiskData.concentration as { riskLevel: string };
      const sizeRisk = realRiskData.sizeRisk as string;
      const recentActivity = realRiskData.recentActivity as { riskLevel: string };
      
      if (concentration?.riskLevel === 'high') {
        mantleSpecificMitigation.unshift('URGENT: Diversify across more protocols - currently high concentration risk');
      }
      if (sizeRisk === 'high') {
        mantleSpecificMitigation.unshift('Consider splitting large positions across multiple wallets');
      }
      if (recentActivity?.riskLevel === 'high') {
        mantleSpecificMitigation.push('Reduce trading frequency to minimize transaction risks');
      }
    }

    if (recommendations.length === 0) {
      return mantleSpecificMitigation.slice(0, 3);
    }

    return [...recommendations, ...mantleSpecificMitigation.slice(0, 2)];
  }

  private prioritizeWarnings(warnings?: string[], realRiskData?: Record<string, unknown>): string[] {
    const criticalMantleWarnings = [
      'Mantle Network is still emerging - total TVL only $302.96M',
      '7-day withdrawal period from Mantle to Ethereum',
      'Limited protocol diversity compared to Ethereum mainnet',
      'Concentrated liquidity on Agni Finance increases impermanent loss risk'
    ];

    // Add real data-driven warnings
    if (realRiskData) {
      const portfolioRisk = realRiskData.portfolioRisk as string;
      const concentration = realRiskData.concentration as { protocolCount: number };
      const totalValue = realRiskData.totalValue as number;
      const sizeRisk = realRiskData.sizeRisk as string;
      
      if (portfolioRisk === 'high') {
        criticalMantleWarnings.unshift('⚠️ HIGH RISK: Current portfolio detected as high-risk');
      }
      if (concentration?.protocolCount === 1) {
        criticalMantleWarnings.unshift('⚠️ CRITICAL: All funds concentrated in single protocol');
      }
      if (totalValue > 50000 && sizeRisk === 'high') {
        criticalMantleWarnings.unshift('⚠️ LARGE POSITION: Consider risk management strategies');
      }
    }

    if (!warnings || warnings.length === 0) {
      return criticalMantleWarnings.slice(0, 2);
    }

    return [...warnings, ...criticalMantleWarnings.slice(0, 1)];
  }

  private generateRiskMetrics(context: AgentContext, realRiskData?: Record<string, unknown>): Record<string, unknown> {
    const portfolioValue = context.portfolioData?.totalValue || 0;
    
    const baseMetrics = {
      riskProfile: {
        networkMaturity: 'emerging',
        ecosystemTVL: '$302.96M',
        bridgeWithdrawalPeriod: '7 days',
        recommendedMaxExposure: Math.min(portfolioValue * 0.2, 10000) // Max 20% or $10k
      },
      protocolRatings: {
        'Agni Finance': { tvl: '$121M', risk: 'medium', confidence: 'high' },
        'Merchant Moe': { tvl: '$25M+', risk: 'medium-high', confidence: 'medium' },
        'mETH/mUSD': { type: 'liquid staking', risk: 'medium', confidence: 'medium' }
      },
      recommendations: {
        maxSingleProtocolExposure: '20%',
        preferredProtocols: ['Agni Finance (highest TVL)'],
        emergencyFundLocation: 'Keep 30% on Ethereum L1'
      }
    };

    // Add real portfolio risk metrics if available
    if (realRiskData) {
      const portfolioRisk = realRiskData.portfolioRisk as string;
      const concentration = realRiskData.concentration as { riskLevel: string; protocolCount: number; diversificationScore: number };
      const sizeRisk = realRiskData.sizeRisk as string;
      const recentActivity = realRiskData.recentActivity as { riskLevel: string; swapCount: number };
      const totalValue = realRiskData.totalValue as number;
      
      (baseMetrics as Record<string, unknown>).realPortfolioRisk = {
        dataSource: 'live_mantlescan',
        overallRisk: portfolioRisk,
        concentrationRisk: concentration?.riskLevel,
        sizeRisk: sizeRisk,
        activityRisk: recentActivity?.riskLevel,
        protocolDiversification: {
          current: concentration?.protocolCount,
          recommended: 3,
          score: concentration?.diversificationScore
        },
        actionableInsights: {
          needsDiversification: (concentration?.protocolCount || 0) < 2,
          highValuePortfolio: totalValue > 50000,
          highActivity: (recentActivity?.swapCount || 0) > 10
        }
      };
    }

    return baseMetrics;
  }
}