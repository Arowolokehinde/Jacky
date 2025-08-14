// NEW AGENT COORDINATOR - Jacky/Franky/Kranky System
// Routes queries to the appropriate specialized agent
// Replaces the old MantleAgentCoordinator

import { JackyAgent } from './JackyAgent';
import { FrankyAgent } from './FrankyAgent';
import { KrankyAgent } from './KrankyAgent';
import { AgentResponse, AgentContext } from './types';

export interface SpecializedResponse {
  agent: 'jacky' | 'franky' | 'kranky';
  response: AgentResponse;
  confidence: number;
  requiresWallet: boolean;
  requiresTransaction: boolean;
}

export class NewAgentCoordinator {
  private jacky: JackyAgent;
  private franky: FrankyAgent;
  private kranky: KrankyAgent;

  constructor() {
    this.jacky = new JackyAgent();
    this.franky = new FrankyAgent();
    this.kranky = new KrankyAgent();
  }

  async processQuery(context: AgentContext): Promise<SpecializedResponse> {
    try {
      // Determine which agent should handle the query
      const agentSelection = this.selectAgent(context.userQuery, !!context.userAddress);
      
      // Check wallet requirements
      if (agentSelection.requiresWallet && !context.userAddress) {
        return this.generateWalletRequiredResponse(agentSelection.agent);
      }

      // Route to appropriate agent
      let response: AgentResponse;
      switch (agentSelection.agent) {
        case 'jacky':
          response = await this.jacky.analyze(context);
          break;
        case 'franky':
          response = await this.franky.analyze(context);
          break;
        case 'kranky':
          response = await this.kranky.analyze(context);
          break;
        default:
          throw new Error('Invalid agent selection');
      }

      return {
        agent: agentSelection.agent,
        response,
        confidence: response.confidence,
        requiresWallet: agentSelection.requiresWallet,
        requiresTransaction: agentSelection.requiresTransaction
      };
    } catch (error) {
      console.error('Agent coordination error:', error);
      return this.generateFallbackResponse();
    }
  }

  private selectAgent(query: string, _hasWallet: boolean): {
    agent: 'jacky' | 'franky' | 'kranky';
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
      'transaction', 'history', 'analyze my'
    ];

    // KRANKY - Staking & Chainlink (Wallet Required for personal data)
    const krankyKeywords = [
      'stake', 'unstake', 'staking', 'rewards',
      'chainlink', 'price feed', 'data feed',
      'optimize', 'yield', 'apy', 'apr',
      'validator', 'liquid staking'
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
    const krankyScore = this.calculateMatchScore(queryLower, krankyKeywords);
    const jackyScore = this.calculateMatchScore(queryLower, jackyKeywords);
    const hasTransactionIntent = transactionKeywords.some(keyword => 
      queryLower.includes(keyword)
    );

    // Agent selection logic
    if (frankyScore > krankyScore && frankyScore > jackyScore) {
      return {
        agent: 'franky',
        requiresWallet: true,
        requiresTransaction: hasTransactionIntent,
        confidence: Math.min(frankyScore + 0.1, 1.0)
      };
    }

    if (krankyScore > jackyScore) {
      // Kranky handles both educational staking info and personal staking data
      const needsPersonalData = queryLower.includes('my') || 
                              queryLower.includes('stake ') || 
                              queryLower.includes('unstake') ||
                              queryLower.includes('rewards');
      
      return {
        agent: 'kranky',
        requiresWallet: needsPersonalData,
        requiresTransaction: hasTransactionIntent && needsPersonalData,
        confidence: Math.min(krankyScore + 0.1, 1.0)
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

  private generateWalletRequiredResponse(agent: 'jacky' | 'franky' | 'kranky'): SpecializedResponse {
    const agentDescriptions = {
      jacky: 'Jacky doesn\'t need wallet access - try asking about Mantle Network or DeFi concepts!',
      franky: 'Franky needs wallet access to help with swaps, transfers, and portfolio analysis.',
      kranky: 'Kranky needs wallet access to help with your personal staking positions and optimization.'
    };

    const recommendations = {
      jacky: [
        'Ask about Mantle Network features',
        'Learn about DeFi protocols on Mantle',
        'Get resources and tutorials'
      ],
      franky: [
        'Connect wallet to check balances',
        'I can help with MNT ↔ USDC swaps',
        'Transfer tokens securely',
        'Analyze your transaction history'
      ],
      kranky: [
        'Connect wallet to see staking positions',
        'I can optimize your MNT staking strategy',
        'Get real-time Chainlink price data',
        'Compare staking protocols and APYs'
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

  private getAgentCapabilities(agent: 'jacky' | 'franky' | 'kranky'): string[] {
    const capabilities = {
      jacky: [
        'Mantle Network education',
        'Protocol explanations (Agni, FusionX, Lendle)',
        'DeFi tutorials and resources',
        'No wallet required'
      ],
      franky: [
        'Portfolio balance tracking',
        'Token swaps (MNT ↔ USDC, etc.)',
        'Token transfers',
        'Transaction analysis',
        'Requires wallet connection'
      ],
      kranky: [
        'MNT staking optimization',
        'Chainlink price feed integration',
        'Yield comparison across protocols',
        'Staking rewards tracking',
        'Requires wallet for personal data'
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
          'Connect wallet to use Franky for swaps/transfers',
          'Ask Kranky about MNT staking options'
        ],
        warnings: ['Service temporarily unavailable'],
        data: {}
      },
      confidence: 0.3,
      requiresWallet: false,
      requiresTransaction: false
    };
  }

  // Public method to get agent information
  public getAgentInfo(): { [key: string]: Record<string, unknown> } {
    return {
      jacky: {
        name: 'Jacky - Mantle Expert',
        description: 'Educational AI specialized in Mantle Network knowledge',
        requiresWallet: false,
        capabilities: this.getAgentCapabilities('jacky')
      },
      franky: {
        name: 'Franky - Portfolio Manager',
        description: 'Wallet-connected portfolio manager for swaps and transfers',
        requiresWallet: true,
        capabilities: this.getAgentCapabilities('franky')
      },
      kranky: {
        name: 'Kranky - Staking Expert',
        description: 'Specialized in MNT staking and Chainlink data',
        requiresWallet: true,
        capabilities: this.getAgentCapabilities('kranky')
      }
    };
  }

  // Method to manually route to specific agent (for frontend tabs)
  public async routeToAgent(
    agent: 'jacky' | 'franky' | 'kranky',
    context: AgentContext
  ): Promise<SpecializedResponse> {
    try {
      let response: AgentResponse;
      
      switch (agent) {
        case 'jacky':
          response = await this.jacky.analyze(context);
          break;
        case 'franky':
          if (!context.userAddress) {
            return this.generateWalletRequiredResponse('franky');
          }
          response = await this.franky.analyze(context);
          break;
        case 'kranky':
          // Kranky can work without wallet for general staking info
          response = await this.kranky.analyze(context);
          break;
      }

      return {
        agent,
        response,
        confidence: response.confidence,
        requiresWallet: agent !== 'jacky',
        requiresTransaction: false
      };
    } catch (error) {
      console.error(`Error routing to ${agent}:`, error);
      return this.generateFallbackResponse();
    }
  }
}