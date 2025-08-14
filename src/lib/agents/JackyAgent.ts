// JACKY - Mantle Educational AI Agent
// Phase 1: Pure educational, no wallet required
// Focus: Mantle blockchain knowledge, resources, tutorials

import { BaseAgent } from './BaseAgent';
import { AgentResponse, AgentContext } from './types';

export interface MantleResource {
  title: string;
  description: string;
  url: string;
  category: 'docs' | 'tutorial' | 'protocol' | 'tool';
}

export interface MantleProtocol {
  name: string;
  description: string;
  tvl: string;
  category: 'dex' | 'lending' | 'staking' | 'bridge';
  website: string;
  documentation: string;
}

export class JackyAgent extends BaseAgent {
  private mantleResources: MantleResource[] = [];
  private mantleProtocols: MantleProtocol[] = [];

  constructor() {
    super(
      'Jacky - Mantle Expert',
      'Educational AI specialized in Mantle Network knowledge, protocols, and resources',
      `You are Jacky, Mantle Network's educational expert. Give PRECISE answers that match the question asked.

RULES:
- For simple questions (name, greeting): Give brief, direct answers
- For technical questions: Provide detailed explanations with facts
- NEVER make up URLs or links - only use real, verified information
- Match response depth to question complexity
- Be accurate above all else

KNOWLEDGE:
- Mantle Network (Layer 2 on Ethereum)
- Real protocols: Agni Finance, FusionX, Lendle
- Real resources: docs.mantle.xyz, bridge.mantle.xyz, explorer.mantle.xyz

Always be factual and contextual.`
    );
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    try {
      // Load fresh protocol data
      await this.loadMantleEcosystemData();

      // Determine if this is a simple or complex question
      const queryType = this.classifyQuery(context.userQuery);
      
      const educationalContext = {
        query: context.userQuery,
        queryType,
        protocolData: queryType === 'complex' ? this.mantleProtocols : [],
        resources: queryType === 'complex' ? this.mantleResources : [],
        mode: 'educational',
        requiresWallet: false
      };

      const llmResponse = await this.callLLM(
        `Provide educational information about Mantle Network: ${context.userQuery}`,
        educationalContext
      );

      const parsed = this.parseResponse(llmResponse);
      
      return {
        agentName: this.name,
        confidence: this.calculateEducationalConfidence(context.userQuery),
        analysis: parsed.analysis,
        recommendations: this.enhanceWithResources(parsed.recommendations, context.userQuery),
        warnings: parsed.warnings || [],
        data: this.generateEducationalData(context.userQuery)
      };
    } catch (error) {
      console.error('Jacky educational analysis error:', error);
      return {
        agentName: this.name,
        confidence: 0.5,
        analysis: 'I\'m having trouble accessing the latest Mantle ecosystem data, but I can still help with general information.',
        recommendations: [
          'Visit the official Mantle documentation at docs.mantle.xyz',
          'Explore the Mantle ecosystem at mantle.xyz/ecosystem',
          'Join the Mantle community on Discord for support'
        ],
        warnings: ['Some data may not be current due to connection issues']
      };
    }
  }

  // Load real-time Mantle ecosystem data
  private async loadMantleEcosystemData(): Promise<void> {
    try {
      // Real DeFiLlama integration for protocol TVL
      const protocolsResponse = await fetch('https://api.llama.fi/protocols');
      const protocolsData = await protocolsResponse.json();
      
      // Filter Mantle protocols
      const mantleProtocols = protocolsData.filter((protocol: { chains?: string[]; name: string }) => 
        protocol.chains?.includes('Mantle') || 
        protocol.name.toLowerCase().includes('mantle')
      );

      this.mantleProtocols = mantleProtocols.map((protocol: { name: string; description?: string; tvl?: number; category?: string; url?: string }) => ({
        name: protocol.name,
        description: protocol.description || `${protocol.name} protocol on Mantle`,
        tvl: `$${(protocol.tvl || 0).toLocaleString()}`,
        category: this.categorizeProtocol(protocol.category || ''),
        website: protocol.url || '',
        documentation: '' // Would need to be populated manually or from another source
      }));

      // Load Mantle network statistics
      await this.loadNetworkStats();
      
    } catch (error) {
      console.error('Error loading Mantle ecosystem data:', error);
      // Fallback to hardcoded data
      this.loadFallbackProtocolData();
    }
  }

  private async loadNetworkStats(): Promise<void> {
    try {
      // Real Mantle network statistics
      await fetch('https://api.mantle.xyz/stats'); // Placeholder URL
      // Implementation depends on actual Mantle API
    } catch (error) {
      console.warn('Network stats unavailable:', error);
    }
  }

  private categorizeProtocol(category: string): 'dex' | 'lending' | 'staking' | 'bridge' {
    const categoryMap: { [key: string]: 'dex' | 'lending' | 'staking' | 'bridge' } = {
      'dexes': 'dex',
      'lending': 'lending',
      'staking': 'staking',
      'bridge': 'bridge'
    };
    return categoryMap[category?.toLowerCase()] || 'dex';
  }

  private loadFallbackProtocolData(): void {
    this.mantleProtocols = [
      {
        name: 'Agni Finance',
        description: 'Leading DEX on Mantle with concentrated liquidity and yield farming',
        tvl: '$121M+',
        category: 'dex',
        website: 'https://agni.finance',
        documentation: 'https://docs.agni.finance'
      },
      {
        name: 'FusionX',
        description: 'Multi-feature DeFi platform with DEX and yield optimization',
        tvl: '$45M+',
        category: 'dex',
        website: 'https://fusionx.finance',
        documentation: 'https://docs.fusionx.finance'
      },
      {
        name: 'Lendle',
        description: 'Lending and borrowing protocol for Mantle ecosystem',
        tvl: '$30M+',
        category: 'lending',
        website: 'https://lendle.xyz',
        documentation: 'https://docs.lendle.xyz'
      }
    ];

    this.mantleResources = [
      {
        title: 'Mantle Network Documentation',
        description: 'Official technical documentation and guides',
        url: 'https://docs.mantle.xyz',
        category: 'docs'
      },
      {
        title: 'Mantle Bridge',
        description: 'Official bridge for moving assets to/from Mantle',
        url: 'https://bridge.mantle.xyz',
        category: 'tool'
      },
      {
        title: 'Mantle Explorer',
        description: 'Blockchain explorer for Mantle Network',
        url: 'https://explorer.mantle.xyz',
        category: 'tool'
      }
    ];
  }

  private classifyQuery(query: string): 'simple' | 'complex' {
    const queryLower = query.toLowerCase().trim();
    
    // Simple questions that need brief answers
    const simplePatterns = [
      'hi', 'hello', 'hey', 'what is your name', 'who are you',
      'what\'s your name', 'introduce yourself', 'about you'
    ];
    
    // Check for simple greetings/introductions
    if (simplePatterns.some(pattern => queryLower.includes(pattern))) {
      return 'simple';
    }
    
    // Short queries are usually simple
    if (queryLower.length < 20) {
      return 'simple';
    }
    
    // Everything else needs detailed explanation
    return 'complex';
  }

  private calculateEducationalConfidence(query: string): number {
    const mantleKeywords = ['mantle', 'mnt', 'agni', 'fusionx', 'lendle', 'layer 2', 'l2'];
    const educationalKeywords = ['what', 'how', 'explain', 'learn', 'tutorial', 'guide'];
    
    let confidence = 0.7; // Base confidence for educational queries
    
    const queryLower = query.toLowerCase();
    
    // Boost confidence for Mantle-specific queries
    if (mantleKeywords.some(keyword => queryLower.includes(keyword))) {
      confidence += 0.2;
    }
    
    // Boost confidence for educational intent
    if (educationalKeywords.some(keyword => queryLower.includes(keyword))) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private enhanceWithResources(recommendations: string[], query: string): string[] {
    const enhanced = [...recommendations];
    
    // Add relevant resources based on query
    if (query.toLowerCase().includes('bridge')) {
      enhanced.push('Use the official Mantle Bridge at bridge.mantle.xyz for secure transfers');
    }
    
    if (query.toLowerCase().includes('develop') || query.toLowerCase().includes('build')) {
      enhanced.push('Start with Mantle developer docs at docs.mantle.xyz/developers');
    }
    
    if (query.toLowerCase().includes('agni') || query.toLowerCase().includes('dex')) {
      enhanced.push('Explore Agni Finance - the leading DEX on Mantle with $121M+ TVL');
    }
    
    return enhanced;
  }

  private generateEducationalData(_query: string): Record<string, unknown> {
    return {
      agentType: 'educational',
      mantleEcosystem: {
        totalProtocols: this.mantleProtocols.length,
        totalTVL: this.calculateTotalTVL(),
        topProtocols: this.mantleProtocols.slice(0, 3)
      },
      resources: {
        available: this.mantleResources.length,
        categories: ['docs', 'tutorials', 'tools', 'protocols']
      },
      networkInfo: {
        chainId: 5000,
        nativeToken: 'MNT',
        blockExplorer: 'https://explorer.mantle.xyz',
        bridge: 'https://bridge.mantle.xyz'
      },
      educational: true,
      walletRequired: false
    };
  }

  private calculateTotalTVL(): string {
    // Simple TVL calculation from protocol data
    const totalTVL = this.mantleProtocols.reduce((sum, protocol) => {
      const tvlNumber = parseFloat(protocol.tvl.replace(/[$,M+]/g, ''));
      return sum + (isNaN(tvlNumber) ? 0 : tvlNumber);
    }, 0);
    
    return `$${totalTVL.toFixed(0)}M+`;
  }

  // Public method to get protocol information
  public getProtocolInfo(protocolName: string): MantleProtocol | null {
    return this.mantleProtocols.find(
      protocol => protocol.name.toLowerCase().includes(protocolName.toLowerCase())
    ) || null;
  }

  // Public method to get educational resources
  public getResources(category?: string): MantleResource[] {
    if (!category) return this.mantleResources;
    return this.mantleResources.filter(resource => resource.category === category);
  }
}