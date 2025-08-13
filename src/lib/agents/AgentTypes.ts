// Agent Type Definitions and Organization
// Defines the three categories of agents in Jacky AI DeFi Copilot

export type AgentCategory = 'conversational' | 'analysis' | 'execution';

export interface AgentCapability {
  requiresWallet: boolean;
  requiresTransaction: boolean;
  category: AgentCategory;
  description: string;
}

// Agent Registry - Defines all available agents and their capabilities
export const AGENT_REGISTRY: Record<string, AgentCapability> = {
  // CONVERSATIONAL AGENTS - No wallet required, education and general info
  'mantle-info': {
    requiresWallet: false,
    requiresTransaction: false,
    category: 'conversational',
    description: 'General Mantle Network information and DeFi education'
  },
  'mantle-protocol': {
    requiresWallet: false,
    requiresTransaction: false,
    category: 'conversational', 
    description: 'Explains Mantle protocols (Agni, FusionX, Lendle, etc.)'
  },
  'mantle-guide': {
    requiresWallet: false,
    requiresTransaction: false,
    category: 'conversational',
    description: 'How-to guides and tutorials for Mantle DeFi'
  },

  // ANALYSIS AGENTS - Wallet required for reading data, no transactions
  'mantle-portfolio': {
    requiresWallet: true,
    requiresTransaction: false,
    category: 'analysis',
    description: 'Analyzes wallet balances, holdings, and portfolio composition'
  },
  'mantle-risk': {
    requiresWallet: true,
    requiresTransaction: false,
    category: 'analysis',
    description: 'Assesses portfolio risks and provides risk analysis'
  },
  'mantle-strategy': {
    requiresWallet: true,
    requiresTransaction: false,
    category: 'analysis',
    description: 'Suggests DeFi strategies based on portfolio analysis'
  },

  // EXECUTION AGENTS - Wallet required + transaction permissions
  'mantle-swap': {
    requiresWallet: true,
    requiresTransaction: true,
    category: 'execution',
    description: 'Executes token swaps on Mantle DEXs (Agni, FusionX)'
  },
  'mantle-staking': {
    requiresWallet: true,
    requiresTransaction: true,
    category: 'execution',
    description: 'Handles mETH/MNT staking and unstaking operations'
  },
  'mantle-liquidity': {
    requiresWallet: true,
    requiresTransaction: true,
    category: 'execution',
    description: 'Manages liquidity provision and LP token operations'
  },
  'mantle-yield': {
    requiresWallet: true,
    requiresTransaction: true,
    category: 'execution',
    description: 'Executes yield farming strategies and reward claiming'
  }
};

// Query Classification - Determines which agent category to use
export interface QueryClassification {
  category: AgentCategory;
  suggestedAgents: string[];
  requiresWallet: boolean;
  requiresTransaction: boolean;
}

export function classifyQuery(query: string, hasWallet: boolean): QueryClassification {
  const queryLower = query.toLowerCase().trim();

  // Transaction execution keywords
  const executionKeywords = [
    'swap', 'trade', 'buy', 'sell', 'stake', 'unstake', 
    'provide liquidity', 'remove liquidity', 'claim', 'harvest',
    'execute', 'do it', 'make the', 'perform'
  ];

  // Analysis keywords
  const analysisKeywords = [
    'analyze', 'check', 'show', 'what is', 'how much',
    'portfolio', 'balance', 'holdings', 'risk', 'recommend'
  ];

  // Conversational/educational keywords (for future enhancements)

  // Check for execution intent first
  if (executionKeywords.some(keyword => queryLower.includes(keyword))) {
    return {
      category: 'execution',
      suggestedAgents: determineExecutionAgents(queryLower),
      requiresWallet: true,
      requiresTransaction: true
    };
  }

  // Check for analysis intent
  if (analysisKeywords.some(keyword => queryLower.includes(keyword)) && hasWallet) {
    return {
      category: 'analysis',
      suggestedAgents: determineAnalysisAgents(queryLower),
      requiresWallet: true,
      requiresTransaction: false
    };
  }

  // Default to conversational
  return {
    category: 'conversational',
    suggestedAgents: determineConversationalAgents(queryLower),
    requiresWallet: false,
    requiresTransaction: false
  };
}

function determineExecutionAgents(query: string): string[] {
  const agents: string[] = [];
  
  if (query.includes('swap') || query.includes('trade') || query.includes('buy') || query.includes('sell')) {
    agents.push('mantle-swap');
  }
  if (query.includes('stake') || query.includes('unstake')) {
    agents.push('mantle-staking');
  }
  if (query.includes('liquidity') || query.includes('lp')) {
    agents.push('mantle-liquidity');
  }
  if (query.includes('yield') || query.includes('farm') || query.includes('claim') || query.includes('harvest')) {
    agents.push('mantle-yield');
  }
  
  return agents.length > 0 ? agents : ['mantle-swap']; // Default to swap
}

function determineAnalysisAgents(query: string): string[] {
  const agents: string[] = [];
  
  if (query.includes('portfolio') || query.includes('balance') || query.includes('holding')) {
    agents.push('mantle-portfolio');
  }
  if (query.includes('risk') || query.includes('safe') || query.includes('danger')) {
    agents.push('mantle-risk');
  }
  if (query.includes('strategy') || query.includes('recommend') || query.includes('suggest')) {
    agents.push('mantle-strategy');
  }
  
  return agents.length > 0 ? agents : ['mantle-portfolio']; // Default to portfolio
}

function determineConversationalAgents(query: string): string[] {
  if (query.includes('protocol') || query.includes('agni') || query.includes('fusionx') || query.includes('lendle')) {
    return ['mantle-protocol'];
  }
  if (query.includes('how to') || query.includes('guide') || query.includes('tutorial')) {
    return ['mantle-guide'];
  }
  
  return ['mantle-info']; // Default to general info
}