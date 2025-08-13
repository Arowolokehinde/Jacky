import { MantlePortfolioAgent } from './MantlePortfolioAgent';
import { MantleRiskAgent } from './MantleRiskAgent';
import { MantleStrategyAgent } from './MantleStrategyAgent';
import { AgentResponse, AgentContext } from './types';

export interface CoordinatedResponse {
  summary: string;
  portfolio?: AgentResponse;
  risk?: AgentResponse;
  strategy?: AgentResponse;
  combinedRecommendations: string[];
  warnings: string[];
  confidence: number;
  mantleSpecific: boolean;
}

export class MantleAgentCoordinator {
  private portfolioAgent: MantlePortfolioAgent;
  private riskAgent: MantleRiskAgent;
  private strategyAgent: MantleStrategyAgent;

  constructor() {
    this.portfolioAgent = new MantlePortfolioAgent();
    this.riskAgent = new MantleRiskAgent();
    this.strategyAgent = new MantleStrategyAgent();
  }

  async processQuery(context: AgentContext): Promise<CoordinatedResponse> {
    const query = context.userQuery.toLowerCase();
    
    try {
      // Determine which agents to activate based on query
      const agentPlan = this.planAgentExecution(query);
      
      // Execute agents in parallel for efficiency
      const agentPromises: Promise<AgentResponse>[] = [];
      const activeAgents: string[] = [];

      if (agentPlan.needsPortfolio) {
        agentPromises.push(this.portfolioAgent.analyze(context));
        activeAgents.push('portfolio');
      }

      if (agentPlan.needsRisk) {
        agentPromises.push(this.riskAgent.analyze(context));
        activeAgents.push('risk');
      }

      if (agentPlan.needsStrategy) {
        agentPromises.push(this.strategyAgent.analyze(context));
        activeAgents.push('strategy');
      }

      // Wait for all agents to complete
      const agentResponses = await Promise.all(agentPromises);
      
      // Map responses to agent types
      const responses: { [key: string]: AgentResponse } = {};
      activeAgents.forEach((agent, index) => {
        responses[agent] = agentResponses[index];
      });

      return this.synthesizeResponses(responses, query, agentPlan);
    } catch (error) {
      console.error('Agent coordination error:', error);
      return this.generateFallbackResponse();
    }
  }

  private planAgentExecution(query: string): {
    needsPortfolio: boolean;
    needsRisk: boolean;
    needsStrategy: boolean;
    priority: 'portfolio' | 'risk' | 'strategy' | 'balanced';
  } {
    // Portfolio-focused queries (primary)
    if (query.includes('portfolio') || query.includes('balance') || query.includes('holding') || 
        query.includes('wallet') || query.includes('check') || query.includes('analyze')) {
      return { needsPortfolio: true, needsRisk: false, needsStrategy: false, priority: 'portfolio' };
    }

    // Risk-focused queries (primary)
    if (query.includes('risk') || query.includes('safe') || query.includes('secure') || 
        query.includes('danger') || query.includes('warning')) {
      return { needsPortfolio: true, needsRisk: true, needsStrategy: false, priority: 'risk' };
    }

    // Strategy-focused queries (primary)
    if (query.includes('strategy') || query.includes('yield') || query.includes('earn') || 
        query.includes('farm') || query.includes('recommend') || query.includes('suggest') ||
        query.includes('advice')) {
      return { needsPortfolio: true, needsRisk: false, needsStrategy: true, priority: 'strategy' };
    }

    // Mantle protocol-specific queries
    if (query.includes('mantle') || query.includes('agni') || query.includes('moe') || 
        query.includes('fusionx') || query.includes('lendle') || query.includes('mnt')) {
      return { needsPortfolio: true, needsRisk: true, needsStrategy: true, priority: 'balanced' };
    }

    // Default to portfolio analysis for most DeFi queries
    return { needsPortfolio: true, needsRisk: false, needsStrategy: false, priority: 'portfolio' };
  }

  private synthesizeResponses(
    responses: { [key: string]: AgentResponse },
    query: string,
    plan: Record<string, unknown>
  ): CoordinatedResponse {
    const allRecommendations: string[] = [];
    const allWarnings: string[] = [];
    let totalConfidence = 0;
    let agentCount = 0;

    // Collect all recommendations and warnings
    Object.values(responses).forEach(response => {
      allRecommendations.push(...response.recommendations);
      if (response.warnings) {
        allWarnings.push(...response.warnings);
      }
      totalConfidence += response.confidence;
      agentCount++;
    });

    // Generate coordinated summary
    const summary = this.generateSummary(responses);
    
    // Prioritize and deduplicate recommendations
    const combinedRecommendations = this.prioritizeRecommendations(allRecommendations, plan.priority as string);
    
    return {
      summary,
      portfolio: responses.portfolio,
      risk: responses.risk,
      strategy: responses.strategy,
      combinedRecommendations: combinedRecommendations.slice(0, 5), // Top 5 recommendations
      warnings: [...new Set(allWarnings)], // Remove duplicates
      confidence: agentCount > 0 ? totalConfidence / agentCount : 0,
      mantleSpecific: true
    };
  }

  private generateSummary(responses: { [key: string]: AgentResponse }): string {
    const responseKeys = Object.keys(responses);
    
    if (responseKeys.length === 1) {
      // Single agent response - return the full analysis
      const singleResponse = Object.values(responses)[0];
      return singleResponse.analysis;
    }
    
    // Multiple agents - create a flowing narrative
    const parts: string[] = [];
    
    if (responses.portfolio) {
      parts.push(responses.portfolio.analysis);
    }
    
    if (responses.risk) {
      const riskText = responses.risk.analysis;
      parts.push(riskText.startsWith('Additionally') ? riskText : `Additionally, ${riskText.toLowerCase()}`);
    }
    
    if (responses.strategy) {
      const strategyText = responses.strategy.analysis;
      parts.push(strategyText.startsWith('For strategy') ? strategyText : `For strategy recommendations, ${strategyText.toLowerCase()}`);
    }
    
    return parts.join(' ') || 'I\'ve analyzed your Mantle DeFi situation and have some insights to share.';
  }

  private prioritizeRecommendations(recommendations: string[], priority: string): string[] {
    const prioritized: string[] = [];
    const others: string[] = [];

    recommendations.forEach(rec => {
      const recLower = rec.toLowerCase();
      
      // Prioritize based on focus
      if (priority === 'risk' && (recLower.includes('risk') || recLower.includes('safe'))) {
        prioritized.push(rec);
      } else if (priority === 'strategy' && (recLower.includes('strategy') || recLower.includes('yield'))) {
        prioritized.push(rec);
      } else if (priority === 'portfolio' && (recLower.includes('portfolio') || recLower.includes('balance'))) {
        prioritized.push(rec);
      } else {
        others.push(rec);
      }
    });

    // Remove duplicates and combine
    const unique = [...new Set([...prioritized, ...others])];
    return unique;
  }

  private generateFallbackResponse(): CoordinatedResponse {
    return {
      summary: 'Unable to process query with specialized agents. Providing general Mantle DeFi guidance.',
      combinedRecommendations: [
        'Connect wallet and switch to Mantle Network for full analysis',
        'Start with Agni Finance for trading (highest TVL: $121M)',
        'Consider mETH staking for stable yields',
        'Limit exposure to new protocols until they mature'
      ],
      warnings: ['Specialized analysis temporarily unavailable'],
      confidence: 0.3,
      mantleSpecific: true
    };
  }

  // Helper method to check if user is on Mantle Network
  async validateMantleNetwork(chainId?: number): Promise<boolean> {
    const mantleChainId = 5000; // Mantle mainnet
    const mantleTestnetChainId = 5001; // Mantle testnet
    
    return chainId === mantleChainId || chainId === mantleTestnetChainId;
  }
}