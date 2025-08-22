export interface PriceFeed {
  pair: string;
  address: string;
  decimals: number;
  description: string;
}

export const MANTLE_PRICE_FEEDS: { [key: string]: PriceFeed } = {
  'MNT/USD': {
    pair: 'MNT/USD',
    address: '0x4c8962833Db7206fd45671e9DC806e4FcC0dCB78', // Official Chainlink MNT/USD on Mantle testnet
    decimals: 8,
    description: 'Mantle Token / USD'
  },
  'ETH/USD': {
    pair: 'ETH/USD', 
    address: '0x9bD31B110C559884c49d1bA3e60C1724F2E336a7', // Official Chainlink ETH/USD on Mantle testnet
    decimals: 8,
    description: 'Ethereum / USD'
  },
  'USDC/USD': {
    pair: 'USDC/USD',
    address: '0x1d6F6dbD68BD438950c37b1D514e49306F65291E', // Official Chainlink USDC/USD on Mantle testnet
    decimals: 8,
    description: 'USD Coin / USD'
  },
  'BTC/USD': {
    pair: 'BTC/USD',
    address: '0xecC446a3219da4594d5Ede8314f500212e496E17', // Official Chainlink BTC/USD on Mantle testnet
    decimals: 8,
    description: 'Bitcoin / USD'
  },
  'LINK/USD': {
    pair: 'LINK/USD',
    address: '0x06BBD3C28C174E164a7ca0D48E287C09Cc1241Fb', // Official Chainlink LINK/USD on Mantle testnet
    decimals: 8,
    description: 'Chainlink Token / USD'
  },
  'USDT/USD': {
    pair: 'USDT/USD',
    address: '0x71c184d899c1774d597d8D80526FB02dF708A69a', // Official Chainlink USDT/USD on Mantle testnet
    decimals: 8,
    description: 'Tether / USD'
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
  private publicClient: {
    readContract: (params: {
      address: `0x${string}`;
      abi: unknown[];
      functionName: string;
      args?: unknown[];
    }) => Promise<unknown>;
  } | null = null;
  
  constructor(publicClient?: unknown) {
    if (publicClient && typeof publicClient === 'object' && 'readContract' in publicClient) {
      this.publicClient = publicClient as {
        readContract: (params: {
          address: `0x${string}`;
          abi: unknown[];
          functionName: string;
          args?: unknown[];
        }) => Promise<unknown>;
      };
    }
  }

  // Method to connect a client after instantiation
  connect(publicClient: unknown) {
    if (publicClient && typeof publicClient === 'object' && 'readContract' in publicClient) {
      this.publicClient = publicClient as {
        readContract: (params: {
          address: `0x${string}`;
          abi: unknown[];
          functionName: string;
          args?: unknown[];
        }) => Promise<unknown>;
      };
    }
  }

  // Phase 3: Get current token prices for agent analysis
  async getTokenPrice(symbol: string): Promise<TokenPrice | null> {
    try {
      // Try Chainlink first for supported pairs
      const pair = `${symbol.toUpperCase()}/USD`;
      const feedInfo = MANTLE_PRICE_FEEDS[pair];
      
      if (feedInfo && feedInfo.address !== '0x' && this.publicClient) {
        const chainlinkPrice = await this.getChainlinkPrice(feedInfo.address);
        if (chainlinkPrice !== null && chainlinkPrice > 0) {
          return {
            symbol: symbol.toUpperCase(),
            price: chainlinkPrice,
            decimals: feedInfo.decimals,
            timestamp: Date.now(),
            source: 'chainlink'
          };
        }
      }
      
      // No fallback - pricing removed completely
      return null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      // No fallback - pricing removed completely
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

      const result = await this.publicClient.readContract({
        address: feedAddress as `0x${string}`,
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