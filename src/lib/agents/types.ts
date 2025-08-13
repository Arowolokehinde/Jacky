export interface AgentResponse {
  agentName: string;
  confidence: number;
  analysis: string;
  recommendations: string[];
  warnings?: string[];
  data?: Record<string, unknown>;
}

export interface PortfolioData {
  totalValue: number;
  tokens: TokenHolding[];
  performance24h: number;
  diversificationScore: number;
}

export interface TokenHolding {
  symbol: string;
  balance: string;
  value: number;
  price: number;
  change24h: number;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  score: number;
  mitigationSteps: string[];
}

export interface Strategy {
  name: string;
  type: 'yield' | 'liquidity' | 'staking' | 'arbitrage';
  apy: number;
  riskLevel: 'low' | 'medium' | 'high';
  requirements: string[];
  steps: string[];
}

export interface AgentContext {
  userAddress?: string;
  portfolioData?: PortfolioData;
  userQuery: string;
  chatHistory: Array<{ role: string; content: string }>;
}