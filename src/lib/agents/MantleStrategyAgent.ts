import { BaseAgent } from './BaseAgent';
import { AgentResponse, AgentContext } from './types';

export class MantleStrategyAgent extends BaseAgent {
  constructor() {
    super(
      'Mantle Strategy Advisor',
      'Mantle Network DeFi strategies, yield optimization, protocol recommendations',
      `You are a Mantle Network DeFi strategy expert. Your role is to recommend executable strategies using real Mantle protocols:

AVAILABLE MANTLE PROTOCOLS (Current TVL Data):
1. Agni Finance - $121M TVL (Highest on Mantle)
   - Uni V3 concentrated liquidity AMM
   - $MNT/$USDT, $MNT/$USDC, $MNT/$WETH pairs
   - $AGNI token farming and VE(3,3) tokenomics
   - Launchpad with insurance pool

2. Merchant Moe - $25M+ TVL  
   - TraderJoe-inspired DEX
   - $MOE token staking and fee farming
   - Discretized liquidity provision
   - Real yield farming opportunities

3. mETH/mUSD Integration
   - Mantle liquid staking protocol ($mETH)
   - Rebasing wrapped stablecoin ($mUSD)
   - Stable yield opportunities

EXECUTABLE STRATEGIES FOR PHASE 4:
✅ Low Risk (5-12% APY):
- mETH staking through Mantle LSP
- mUSD/USDC liquidity on Agni Finance
- Basic $MNT holding and staking

✅ Medium Risk (12-25% APY):
- Concentrated liquidity provision on Agni Finance
- $MOE staking on Merchant Moe
- $AGNI token farming

⚠️ Higher Risk (25%+ APY):
- New token launches on Agni launchpad
- Leveraged liquidity strategies
- Cross-protocol yield farming

STRATEGY REQUIREMENTS:
- Must be implementable with smart contracts
- Focus on established protocols (Agni: $121M TVL)
- Consider gas efficiency on Mantle
- Account for 7-day bridge withdrawal period

Format response as JSON with specific, executable strategies.`
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    try {
      const strategyContext = {
        userAddress: context.userAddress,
        portfolioData: context.portfolioData,
        query: context.userQuery,
        mantleStrategies: {
          conservative: 'mETH staking, mUSD liquidity',
          moderate: 'Agni Finance LP, MOE staking', 
          aggressive: 'Concentrated liquidity, new launches'
        }
      };

      const llmResponse = await this.callLLM(
        `Recommend executable Mantle DeFi strategies for: ${context.userQuery}`,
        strategyContext
      );

      const parsed = this.parseResponse(llmResponse);
      
      return {
        agentName: this.name,
        confidence: this.calculateStrategyConfidence(context),
        analysis: parsed.analysis,
        recommendations: this.enhanceExecutableStrategies(parsed.recommendations),
        warnings: parsed.warnings,
        data: this.generateStrategyData(context)
      };
    } catch {
      return {
        agentName: this.name,
        confidence: 0.7,
        analysis: 'Providing default Mantle DeFi strategies.',
        recommendations: [
          'Start with mETH staking for stable 5-8% yield',
          'Provide mUSD/USDC liquidity on Agni Finance',
          'Consider $MNT staking for network rewards'
        ],
        warnings: ['Strategy analysis temporarily limited - start conservative']
      };
    }
  }

  private calculateStrategyConfidence(context: AgentContext): number {
    let confidence = 0.6;
    
    if (context.portfolioData) confidence += 0.2;
    if (context.userAddress) confidence += 0.1;
    
    // Higher confidence for strategy recommendations
    confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private enhanceExecutableStrategies(recommendations: string[]): string[] {
    const executableStrategies = [
      'Phase 4 Ready: Swap tokens on Agni Finance (highest liquidity)',
      'Phase 4 Ready: Provide mUSD/USDC liquidity (stable yield)',
      'Phase 4 Ready: Stake $MNT tokens (network rewards)',
      'Medium-term: Add concentrated liquidity to $MNT/$USDT on Agni',
      'Advanced: Participate in $MOE staking on Merchant Moe'
    ];

    if (recommendations.length === 0) {
      return executableStrategies.slice(0, 3);
    }

    return recommendations.map(rec => {
      // Enhance recommendations with executability markers
      if (rec.toLowerCase().includes('swap') || rec.toLowerCase().includes('trade')) {
        return `Phase 4 Ready: ${rec}`;
      }
      if (rec.toLowerCase().includes('stake') || rec.toLowerCase().includes('liquid')) {
        return `Phase 4 Ready: ${rec}`;
      }
      return rec;
    });
  }

  private generateStrategyData(context: AgentContext): Record<string, unknown> {
    const portfolioValue = context.portfolioData?.totalValue || 0;
    
    return {
      executableStrategies: {
        conservative: {
          name: 'Mantle Staking Strategy',
          apy: '5-8%',
          protocols: ['mETH staking', 'MNT staking'],
          phase4Ready: true,
          minAmount: '$100',
          risk: 'low'
        },
        moderate: {
          name: 'Agni Finance Liquidity',
          apy: '12-20%',
          protocols: ['Agni Finance', 'mUSD/USDC LP'],
          phase4Ready: true,
          minAmount: '$500',
          risk: 'medium'
        },
        aggressive: {
          name: 'Multi-Protocol Yield',
          apy: '25%+',
          protocols: ['Agni AGNI farming', 'Merchant Moe MOE staking'],
          phase4Ready: false, // Complex strategy for later
          minAmount: '$2000',
          risk: 'high'
        }
      },
      nextPhaseActions: {
        'Agni Finance Integration': 'Smart contract for token swaps',
        'Liquidity Provision': 'Add/remove liquidity contracts',
        'Staking Contracts': 'MNT and mETH staking interfaces',
        'Chainlink Integration': 'Price feeds for accurate swaps'
      },
      portfolioAllocation: {
        conservative: portfolioValue < 1000 ? '70%' : '50%',
        moderate: portfolioValue < 1000 ? '30%' : '40%',
        aggressive: portfolioValue < 1000 ? '0%' : '10%'
      }
    };
  }
}