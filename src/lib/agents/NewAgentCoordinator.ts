

// NEW AGENT COORDINATOR - Jacky/Franky System
// Routes queries to the appropriate specialized agent
// Simplified two-agent system with enhanced context and response optimization

import { JackyAgent } from './JackyAgent';
import { FrankyAgent } from './FrankyAgent';
import { AgentResponse, AgentContext } from './types';

export interface SpecializedResponse {
  agent: 'jacky' | 'franky';
  response: AgentResponse;
  confidence: number;
  requiresWallet: boolean;
  requiresTransaction: boolean;
}

export class NewAgentCoordinator {
  private jacky: JackyAgent;
  private franky: FrankyAgent;

  constructor() {
    this.jacky = new JackyAgent();
    this.franky = new FrankyAgent();
  }

  async processQuery(context: AgentContext): Promise<SpecializedResponse> {
    try {
      // Determine which agent should handle the query
      const agentSelection = this.selectAgent(context.userQuery, !!context.userAddress);
      
      // Check wallet requirements
      if (agentSelection.requiresWallet && !context.userAddress) {
        return this.generateWalletRequiredResponse(agentSelection.agent);
      }

      // Enhanced context with real-time data (pass agent type to avoid unnecessary API calls)
      const enhancedContext = await this.enhanceContext(context, agentSelection.agent);

      // Route to appropriate agent with enhanced context
      let response: AgentResponse;
      switch (agentSelection.agent) {
        case 'jacky':
          response = await this.jacky.analyze(enhancedContext);
          break;
        case 'franky':
          response = await this.franky.analyze(enhancedContext);
          break;
        default:
          throw new Error('Invalid agent selection');
      }

      // Post-process and optimize response
      const optimizedResponse = await this.optimizeResponse(response, agentSelection.agent, enhancedContext);

      return {
        agent: agentSelection.agent,
        response: optimizedResponse,
        confidence: optimizedResponse.confidence,
        requiresWallet: agentSelection.requiresWallet,
        requiresTransaction: agentSelection.requiresTransaction
      };
    } catch (error) {
      console.error('Agent coordination error:', error);
      return this.generateFallbackResponse();
    }
  }

  private selectAgent(query: string, _hasWallet: boolean): {
    agent: 'jacky' | 'franky';
    requiresWallet: boolean;
    requiresTransaction: boolean;
    confidence: number;
  } {
    const queryLower = query.toLowerCase().trim();

    // FRANKY - Portfolio Manager (Wallet Required)
    const frankyKeywords = [
      'swap', 'trade', 'exchange', 'buy', 'sell',
      'send', 'transfer', 'move',
      'balance', 'portfolio', 'holdings',
      'transaction', 'history', 'analyze my',
      // Added staking keywords to Franky since Kranky is removed
      'stake', 'unstake', 'staking', 'rewards',
      'chainlink', 'price feed', 'data feed',
      'optimize', 'yield', 'apy', 'apr',
      'find best', 'best yield', 'opportunities', 'maximize', 'find yield',
      // Risk analysis keywords - portfolio-related
      'risk', 'risks', 'what are my', 'my risks'
    ];

    // JACKY - Educational (No Wallet Required)
    const jackyKeywords = [
      'what is', 'explain', 'how does', 'what are',
      'tell me about', 'learn', 'tutorial',
      'mantle network', 'agni', 'fusionx', 'lendle',
      'defi', 'protocol', 'ecosystem'
    ];

    // Transaction execution keywords (requires wallet + transaction approval)
    const transactionKeywords = [
      'execute', 'confirm', 'sign', 'approve',
      'do it', 'make the swap', 'send now'
    ];

    // Calculate match scores
    const frankyScore = this.calculateMatchScore(queryLower, frankyKeywords);
    const jackyScore = this.calculateMatchScore(queryLower, jackyKeywords);
    const hasTransactionIntent = transactionKeywords.some(keyword => 
      queryLower.includes(keyword)
    );

    // Agent selection logic - simplified to just Jacky vs Franky
    if (frankyScore > jackyScore) {
      return {
        agent: 'franky',
        requiresWallet: true,
        requiresTransaction: hasTransactionIntent,
        confidence: Math.min(frankyScore + 0.1, 1.0)
      };
    }

    // Default to Jacky for educational queries
    return {
      agent: 'jacky',
      requiresWallet: false,
      requiresTransaction: false,
      confidence: Math.max(jackyScore, 0.7) // High confidence for educational
    };
  }

  private calculateMatchScore(query: string, keywords: string[]): number {
    let score = 0;
    const queryWords = query.split(' ');
    
    for (const keyword of keywords) {
      if (query.includes(keyword)) {
        // Exact phrase match
        score += 0.8;
      } else {
        // Check for word matches
        const keywordWords = keyword.split(' ');
        const matchingWords = keywordWords.filter(word => 
          queryWords.some(queryWord => queryWord.includes(word))
        );
        score += (matchingWords.length / keywordWords.length) * 0.3;
      }
    }
    
    return Math.min(score, 1.0);
  }

  private generateWalletRequiredResponse(agent: 'jacky' | 'franky'): SpecializedResponse {
    const agentDescriptions = {
      jacky: 'Jacky doesn\'t need wallet access - try asking about Mantle Network or DeFi concepts!',
      franky: 'Franky needs wallet access to help with swaps, transfers, portfolio analysis, and staking.'
    };

    const recommendations = {
      jacky: [
        'Ask about Mantle Network features',
        'Learn about DeFi protocols on Mantle',
        'Get resources and tutorials'
      ],
      franky: [
        'Connect wallet to execute transactions',
        'I can help with MNT ↔ USDC swaps',
        'Execute secure token transfers',
        'Stake ETH for mETH rewards',
        'Get real-time transaction previews'
      ]
    };

    return {
      agent,
      response: {
        agentName: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent`,
        confidence: 0.8,
        analysis: agentDescriptions[agent],
        recommendations: recommendations[agent],
        warnings: [],
        data: {
          requiresWallet: agent !== 'jacky',
          agentCapabilities: this.getAgentCapabilities(agent)
        }
      },
      confidence: 0.8,
      requiresWallet: agent !== 'jacky',
      requiresTransaction: false
    };
  }

  private getAgentCapabilities(agent: 'jacky' | 'franky'): string[] {
    const capabilities = {
      jacky: [
        'Mantle Network education',
        'Protocol explanations (Agni, FusionX, Lendle)',
        'DeFi tutorials and resources',
        'No wallet required'
      ],
      franky: [
        'Execute token swaps (MNT ↔ USDC, etc.)',
        'Execute token transfers', 
        'Execute ETH staking for mETH',
        'Transaction previews with risk assessment',
        'Real-time price integration',
        'Requires wallet connection'
      ]
    };

    return capabilities[agent];
  }

  private generateFallbackResponse(): SpecializedResponse {
    return {
      agent: 'jacky',
      response: {
        agentName: 'Agent Coordinator',
        confidence: 0.3,
        analysis: 'I\'m having trouble processing your request right now.',
        recommendations: [
          'Try asking Jacky about Mantle Network',
          'Connect wallet to use Franky for swaps/transfers/staking'
        ],
        warnings: ['Service temporarily unavailable'],
        data: {}
      },
      confidence: 0.3,
      requiresWallet: false,
      requiresTransaction: false
    };
  }



  // Enhanced context enrichment with real-time blockchain data
  private async enhanceContext(context: AgentContext, agentType?: 'jacky' | 'franky'): Promise<AgentContext> {
    const enhanced = { ...context };

    try {
      // No market data needed - removed per user request

      // For wallet-connected Franky queries, just add basic wallet info
      if (context.userAddress && agentType === 'franky') {
        enhanced.walletInfo = {
          address: context.userAddress,
          connected: true,
          network: 'Mantle'
        };
      }

      // No network status needed - simplified
      
    } catch (error) {
      console.warn('Context enhancement failed, using basic context:', error);
    }

    return enhanced;
  }

  // Response optimization based on agent type and context
  private async optimizeResponse(
    response: AgentResponse, 
    agentType: 'jacky' | 'franky',
    context: AgentContext
  ): Promise<AgentResponse> {
    const optimized = { ...response };

    try {
      // Add wallet context to recommendations
      if (agentType === 'franky' && context.walletInfo) {
        optimized.recommendations = this.enhanceRecommendations(
          response.recommendations,
          context.walletInfo
        );
      }

    } catch (error) {
      console.warn('Response optimization failed, using original response:', error);
    }

    return optimized;
  }



  // Enhance recommendations with wallet context only
  private enhanceRecommendations(
    originalRecs: string[],
    walletInfo: Record<string, unknown>
  ): string[] {
    const enhanced = [...originalRecs];
    
    // Add wallet-based recommendations
    if (walletInfo && walletInfo.connected) {
      enhanced.push('💰 Wallet connected - you can execute transactions directly');
    }

    return enhanced;
  }


}