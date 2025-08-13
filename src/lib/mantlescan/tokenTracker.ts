// Enhanced Token Balance Tracking for Mantle Network
// Combines MantleScan data with known Mantle DeFi protocol tokens

import { mantleScanMainnet, TokenTransfer } from './api';
import { mantleChainlinkService } from '../chainlink/priceFeeds';

export interface MantleToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  protocol?: string;
  category: 'native' | 'defi' | 'stable' | 'lp' | 'governance';
}

export interface TokenBalance {
  token: MantleToken;
  balance: string;
  balanceFormatted: string;
  valueUSD: number;
  lastActivity?: Date;
}

export interface EnhancedPortfolioData {
  address: string;
  totalValueUSD: number;
  nativeBalance: TokenBalance;
  tokenBalances: TokenBalance[];
  defiPositions: DeFiPosition[];
  lastUpdated: Date;
}

export interface DeFiPosition {
  protocol: string;
  type: 'liquidity' | 'staking' | 'lending' | 'borrowing';
  tokens: TokenBalance[];
  apy?: number;
  lastActivity: Date;
}

// Known Mantle DeFi Protocol Tokens
export const MANTLE_TOKENS: { [address: string]: MantleToken } = {
  // Native tokens
  '0x0': {
    address: '0x0',
    symbol: 'MNT',
    name: 'Mantle',
    decimals: 18,
    category: 'native'
  },
  
  // Major stablecoins on Mantle
  '0xa0b86a33e6ba4e5b1c5d3c2e4d1c5b7e8f9c3d1e': { // Example address
    address: '0xa0b86a33e6ba4e5b1c5d3c2e4d1c5b7e8f9c3d1e',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    category: 'stable'
  },
  
  '0xb1c47e42e8f1d8f5b2d4e6c8a9d2c5b7e8f9c3d1': { // Example address
    address: '0xb1c47e42e8f1d8f5b2d4e6c8a9d2c5b7e8f9c3d1',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    category: 'stable'
  },

  // Agni Finance tokens
  '0xc2d48f3e9c9e8f4b5d6a7c8d9e2c5b7e8f9c3d1e': { // Example address
    address: '0xc2d48f3e9c9e8f4b5d6a7c8d9e2c5b7e8f9c3d1e',
    symbol: 'AGNI',
    name: 'Agni Finance',
    decimals: 18,
    protocol: 'Agni Finance',
    category: 'defi'
  },

  // Merchant Moe tokens  
  '0xd3e49f4e8c9e8f4b5d6a7c8d9e2c5b7e8f9c3d1f': { // Example address
    address: '0xd3e49f4e8c9e8f4b5d6a7c8d9e2c5b7e8f9c3d1f',
    symbol: 'MOE',
    name: 'Merchant Moe',
    decimals: 18,
    protocol: 'Merchant Moe',
    category: 'defi'
  },

  // mETH (Mantle Liquid Staking)
  '0xe4f50f5e8c9e8f4b5d6a7c8d9e2c5b7e8f9c3d20': { // Example address
    address: '0xe4f50f5e8c9e8f4b5d6a7c8d9e2c5b7e8f9c3d20',
    symbol: 'mETH',
    name: 'Mantle Staked Ether',
    decimals: 18,
    protocol: 'Mantle LSP',
    category: 'defi'
  }
};

export class MantleTokenTracker {
  private cache = new Map<string, EnhancedPortfolioData>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getEnhancedPortfolio(address: string, forceRefresh: boolean = false): Promise<EnhancedPortfolioData> {
    const cacheKey = address.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    if (!forceRefresh && cached && this.isCacheValid(cached.lastUpdated)) {
      return cached;
    }

    const portfolio = await this.buildEnhancedPortfolio(address);
    this.cache.set(cacheKey, portfolio);
    return portfolio;
  }

  private async buildEnhancedPortfolio(address: string): Promise<EnhancedPortfolioData> {
    try {
      // Get basic portfolio data from MantleScan
      const portfolioData = await mantleScanMainnet.getPortfolioData(address);
      const defiActivity = await mantleScanMainnet.getDeFiActivity(address, 30);

      // Process native MNT balance
      const nativeToken = MANTLE_TOKENS['0x0'];
      const nativeBalanceFormatted = this.formatBalance(portfolioData.nativeBalance, 18);
      const mntPrice = await this.getTokenPrice('MNT');
      
      const nativeBalance: TokenBalance = {
        token: nativeToken,
        balance: portfolioData.nativeBalance,
        balanceFormatted: nativeBalanceFormatted,
        valueUSD: parseFloat(nativeBalanceFormatted) * mntPrice
      };

      // Process token balances
      const tokenBalances = await this.processTokenBalances(
        portfolioData.tokenTransfers,
        address
      );

      // Identify DeFi positions
      const defiPositions = await this.identifyDeFiPositions(
        defiActivity,
        tokenBalances
      );

      const totalValueUSD = nativeBalance.valueUSD + 
        tokenBalances.reduce((sum, tb) => sum + tb.valueUSD, 0);

      return {
        address,
        totalValueUSD,
        nativeBalance,
        tokenBalances,
        defiPositions,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error building enhanced portfolio:', error);
      throw error;
    }
  }

  private async processTokenBalances(
    tokenTransfers: TokenTransfer[],
    address: string
  ): Promise<TokenBalance[]> {
    const tokenBalanceMap = new Map<string, TokenBalance>();

    // Calculate current balances from transfer history
    for (const transfer of tokenTransfers) {
      const tokenAddress = transfer.contractAddress.toLowerCase();
      const isIncoming = transfer.to.toLowerCase() === address.toLowerCase();
      const value = parseFloat(transfer.value);

      if (!tokenBalanceMap.has(tokenAddress)) {
        const token = this.getTokenInfo(tokenAddress, transfer);
        tokenBalanceMap.set(tokenAddress, {
          token,
          balance: '0',
          balanceFormatted: '0',
          valueUSD: 0,
          lastActivity: new Date(parseInt(transfer.timeStamp) * 1000)
        });
      }

      const current = tokenBalanceMap.get(tokenAddress)!;
      const currentBalance = parseFloat(current.balance);
      
      // Simple balance calculation (incoming adds, outgoing subtracts)
      const newBalance = isIncoming ? currentBalance + value : currentBalance - value;
      current.balance = newBalance.toString();
      current.balanceFormatted = this.formatBalance(current.balance, current.token.decimals);
      
      // Update last activity
      const transferDate = new Date(parseInt(transfer.timeStamp) * 1000);
      if (!current.lastActivity || transferDate > current.lastActivity) {
        current.lastActivity = transferDate;
      }
    }

    // Get prices and calculate USD values
    const balances = Array.from(tokenBalanceMap.values())
      .filter(tb => parseFloat(tb.balance) > 0);

    for (const balance of balances) {
      const price = await this.getTokenPrice(balance.token.symbol);
      balance.valueUSD = parseFloat(balance.balanceFormatted) * price;
    }

    return balances.sort((a, b) => b.valueUSD - a.valueUSD);
  }

  private getTokenInfo(address: string, transfer: TokenTransfer): MantleToken {
    const known = MANTLE_TOKENS[address];
    if (known) return known;

    // Create unknown token info from transfer data
    return {
      address,
      symbol: transfer.tokenSymbol,
      name: transfer.tokenName,
      decimals: parseInt(transfer.tokenDecimal),
      category: 'defi' // Default category for unknown tokens
    };
  }

  private async identifyDeFiPositions(
    _defiActivity: Record<string, unknown>,
    tokenBalances: TokenBalance[]
  ): Promise<DeFiPosition[]> {
    const positions: DeFiPosition[] = [];

    // Group by protocol
    const protocolGroups = tokenBalances.reduce((groups, balance) => {
      const protocol = balance.token.protocol || 'Unknown';
      if (!groups[protocol]) groups[protocol] = [];
      groups[protocol].push(balance);
      return groups;
    }, {} as Record<string, TokenBalance[]>);

    // Create DeFi positions for known protocols
    for (const [protocol, tokens] of Object.entries(protocolGroups)) {
      if (protocol === 'Unknown' || tokens.length === 0) continue;

      positions.push({
        protocol,
        type: this.inferPositionType(protocol, tokens),
        tokens,
        lastActivity: new Date() // Would be derived from recent activity
      });
    }

    return positions;
  }

  private inferPositionType(protocol: string, tokens: TokenBalance[]): DeFiPosition['type'] {
    if (protocol.includes('Staking') || protocol.includes('LSP')) return 'staking';
    if (protocol.includes('Lending') || protocol.includes('Lendle')) return 'lending';
    if (tokens.some(t => t.token.category === 'lp')) return 'liquidity';
    return 'staking'; // Default
  }

  private async getTokenPrice(symbol: string): Promise<number> {
    const priceData = await mantleChainlinkService.getTokenPrice(symbol);
    return priceData?.price || 0;
  }

  private formatBalance(balance: string, decimals: number): string {
    if (!balance || balance === '0') return '0';
    const divisor = Math.pow(10, decimals);
    return (parseFloat(balance) / divisor).toFixed(6);
  }

  private isCacheValid(lastUpdated: Date): boolean {
    return Date.now() - lastUpdated.getTime() < this.cacheTimeout;
  }

  // Utility method to add new known tokens
  static addKnownToken(address: string, tokenInfo: MantleToken): void {
    MANTLE_TOKENS[address.toLowerCase()] = tokenInfo;
  }

  // Get portfolio summary for agent analysis
  async getPortfolioSummary(address: string): Promise<{
    totalValue: number;
    tokenCount: number;
    protocolCount: number;
    riskLevel: 'low' | 'medium' | 'high';
    diversificationScore: number;
  }> {
    const portfolio = await this.getEnhancedPortfolio(address);
    
    const protocols = new Set(
      portfolio.tokenBalances
        .map(tb => tb.token.protocol)
        .filter(p => p)
    );

    const stableValue = portfolio.tokenBalances
      .filter(tb => tb.token.category === 'stable')
      .reduce((sum, tb) => sum + tb.valueUSD, 0);

    const stableRatio = stableValue / portfolio.totalValueUSD;
    const riskLevel: 'low' | 'medium' | 'high' = 
      stableRatio > 0.7 ? 'low' :
      stableRatio > 0.3 ? 'medium' : 'high';

    return {
      totalValue: portfolio.totalValueUSD,
      tokenCount: portfolio.tokenBalances.length + 1, // +1 for native MNT
      protocolCount: protocols.size,
      riskLevel,
      diversificationScore: Math.min(protocols.size / 5, 1) // Max score when using 5+ protocols
    };
  }
}

// Export singleton instance
export const mantleTokenTracker = new MantleTokenTracker();