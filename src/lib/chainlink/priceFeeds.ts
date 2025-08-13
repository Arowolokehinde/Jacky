// Chainlink Price Feed Integration for Mantle Network
// Phase 3: Read-only price data for agent analysis
// Phase 4: Real-time pricing for transaction execution

export interface PriceFeed {
  pair: string;
  address: string;
  decimals: number;
  description: string;
}

// Mantle Network Chainlink Price Feed Addresses
// Note: These are placeholder addresses - need to verify actual Chainlink deployment on Mantle
export const MANTLE_PRICE_FEEDS: { [key: string]: PriceFeed } = {
  'MNT/USD': {
    pair: 'MNT/USD',
    address: '0x', // To be updated with actual Chainlink address
    decimals: 8,
    description: 'Mantle Token / USD'
  },
  'ETH/USD': {
    pair: 'ETH/USD', 
    address: '0x', // To be updated with actual Chainlink address
    decimals: 8,
    description: 'Ethereum / USD'
  },
  'USDC/USD': {
    pair: 'USDC/USD',
    address: '0x', // To be updated with actual Chainlink address
    decimals: 8,
    description: 'USD Coin / USD'
  }
};

export interface TokenPrice {
  symbol: string;
  price: number;
  decimals: number;
  timestamp: number;
  source: 'chainlink' | 'dex' | 'api';
}

export class MantleChainlinkService {
  private publicClient: unknown; // Will be initialized with Viem client
  
  constructor(publicClient?: unknown) {
    this.publicClient = publicClient;
  }

  // Phase 3: Get current token prices for agent analysis
  async getTokenPrice(symbol: string): Promise<TokenPrice | null> {
    try {
      // For Phase 3, use fallback API pricing until Chainlink is fully set up
      return await this.getFallbackPrice(symbol);
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  // Phase 3: Batch price fetching for portfolio analysis
  async getBatchPrices(symbols: string[]): Promise<{ [symbol: string]: TokenPrice }> {
    const prices: { [symbol: string]: TokenPrice } = {};
    
    const pricePromises = symbols.map(async (symbol) => {
      const price = await this.getTokenPrice(symbol);
      if (price) {
        prices[symbol] = price;
      }
    });

    await Promise.all(pricePromises);
    return prices;
  }

  // Fallback pricing for Phase 3 (before full Chainlink integration)
  private async getFallbackPrice(symbol: string): Promise<TokenPrice | null> {
    try {
      // Using CoinGecko API as fallback for Phase 3
      const coinIds: { [key: string]: string } = {
        'MNT': 'mantle',
        'ETH': 'ethereum',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'AGNI': 'agni-fi', // May not exist yet
        'MOE': 'merchant-moe' // May not exist yet
      };

      const coinId = coinIds[symbol.toUpperCase()];
      if (!coinId) return null;

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const priceData = data[coinId];
      
      if (!priceData) return null;

      return {
        symbol: symbol.toUpperCase(),
        price: priceData.usd || 0,
        decimals: 8,
        timestamp: Date.now(),
        source: 'api'
      };
    } catch (error) {
      console.error(`Error fetching fallback price for ${symbol}:`, error);
      return null;
    }
  }

  // Phase 4: Direct Chainlink price feed reading (when contracts are deployed)
  async getChainlinkPrice(feedAddress: string): Promise<number | null> {
    if (!this.publicClient || !feedAddress || feedAddress === '0x') {
      return null;
    }

    try {
      // Price Feed ABI for latestRoundData
      const priceFeedABI = [
        {
          inputs: [],
          name: 'latestRoundData',
          outputs: [
            { name: 'roundId', type: 'uint80' },
            { name: 'answer', type: 'int256' },
            { name: 'startedAt', type: 'uint256' },
            { name: 'updatedAt', type: 'uint256' },
            { name: 'answeredInRound', type: 'uint80' }
          ],
          stateMutability: 'view',
          type: 'function'
        }
      ];

      // Type assertion for viem client
      const client = this.publicClient as {
        readContract: (params: {
          address: string;
          abi: unknown[];
          functionName: string;
        }) => Promise<unknown[]>;
      };

      const result = await client.readContract({
        address: feedAddress,
        abi: priceFeedABI,
        functionName: 'latestRoundData'
      });

      // Chainlink prices typically have 8 decimals
      const price = Number((result as unknown[])[1]) / 1e8;
      return price;
    } catch (error) {
      console.error('Error reading Chainlink price feed:', error);
      return null;
    }
  }

  // Utility function to calculate portfolio value
  async calculatePortfolioValue(holdings: { symbol: string; balance: number }[]): Promise<number> {
    let totalValue = 0;
    
    for (const holding of holdings) {
      const price = await this.getTokenPrice(holding.symbol);
      if (price) {
        totalValue += holding.balance * price.price;
      }
    }
    
    return totalValue;
  }

  // Phase 4 preparation: Validate price data before transactions
  validatePriceData(price: TokenPrice, maxAgeMinutes: number = 10): boolean {
    const now = Date.now();
    const ageMinutes = (now - price.timestamp) / (1000 * 60);
    
    return ageMinutes <= maxAgeMinutes && price.price > 0;
  }
}

// Export singleton instance
export const mantleChainlinkService = new MantleChainlinkService();

// Phase 4 TODO: Research and add actual Chainlink price feed addresses for Mantle Network
export const TODO_PHASE_4_CHAINLINK = {
  research: 'Find official Chainlink price feed contracts on Mantle Network',
  contracts: 'Update MANTLE_PRICE_FEEDS with real addresses',
  integration: 'Replace fallback API with direct Chainlink reads',
  validation: 'Add price staleness checks for transaction safety'
};