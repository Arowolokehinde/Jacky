import { BaseAgent } from './BaseAgent';
import { AgentContext, AgentResponse } from './types';

export class JackyAgent extends BaseAgent {
  constructor() {
    super('Jacky - Mantle Network AI Specialist', 'mantle_specialist', 'high');
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    try {
      const llmResponse = await this.callLLM(
        this.buildPrompt(context.userQuery),
        { query: context.userQuery }
      );

      const parsed = this.parseResponse(llmResponse);
      
      return {
        agentName: this.name,
        confidence: 0.9,
        analysis: parsed.analysis,
        recommendations: parsed.recommendations,
        warnings: parsed.warnings || [],
        data: { mantleSpecialist: true }
      };
    } catch (error) {
      console.error('Jacky analysis error:', error);
      return this.generateErrorResponse(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private buildPrompt(query: string): string {
    return `You are Jacky, a world-class AI expert specializing in Mantle Network and blockchain technology. You have ChatGPT-level intelligence with deep expertise in:

🔥 MANTLE EXPERTISE:
- Mantle Network architecture, performance, and competitive advantages
- Ecosystem protocols: Agni Finance, Lendle, Merchant Moe, FusionX
- MNT tokenomics, staking, and DeFi opportunities
- Technical specifications: 2-second blocks, modular architecture, EVM compatibility
- Strategic partnerships: Bybit backing, $200M ecosystem fund

🧠 BLOCKCHAIN INTELLIGENCE:
- Comprehensive knowledge of Layer 2 solutions (Arbitrum, Optimism, Polygon, Base)
- DeFi protocols, yield farming, liquidity mining strategies
- Smart contract development and security best practices
- Market analysis, tokenomics, and investment frameworks

💡 YOUR MISSION:
Answer questions intelligently, conversationally, and comprehensively. Be the ChatGPT of Mantle - provide deep insights, comparative analysis, and actionable recommendations. No robotic disclaimers or restrictions.

QUERY: ${query}

Provide a detailed, intelligent response that demonstrates your expertise. Include specific data, comparisons, and actionable insights where relevant.`;
  }

  private generateErrorResponse(_error: Error): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.8,
      analysis: 'I can provide comprehensive information about Mantle Network. Please ask about Mantle architecture, DeFi protocols, or blockchain development.',
      recommendations: [
        'Visit official Mantle documentation: docs.mantle.xyz',
        'Check Mantle ecosystem status: mantle.xyz',
        'Explore Mantle DeFi protocols'
      ],
      warnings: [],
      data: { fallbackMode: true }
    };
  }
}