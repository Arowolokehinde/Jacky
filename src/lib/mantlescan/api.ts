// MantleScan API Service for Real Portfolio Data
// Based on Etherscan V2 API structure (MantleScan uses same format)

export interface MantleScanConfig {
  baseUrl: string;
  apiKey?: string; // Optional for basic queries
  chainId: number;
}

export interface TokenBalance {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  balance: string;
}

export interface Transaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  methodId?: string;
  functionName?: string;
}

export interface TokenTransfer {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
  gasUsed: string;
}

export interface AccountBalance {
  account: string;
  balance: string; // in wei
}

const MANTLE_MAINNET_CONFIG: MantleScanConfig = {
  baseUrl: 'https://mantlescan.xyz/api', // Using mantlescan.xyz as primary
  chainId: 5000,
};

const MANTLE_TESTNET_CONFIG: MantleScanConfig = {
  baseUrl: 'https://sepolia.mantlescan.xyz/api', // Testnet endpoint
  chainId: 5001,
};

export class MantleScanService {
  private config: MantleScanConfig;

  constructor(isTestnet: boolean = false, apiKey?: string) {
    this.config = isTestnet ? MANTLE_TESTNET_CONFIG : MANTLE_MAINNET_CONFIG;
    this.config.apiKey = apiKey;
  }

  // Get native MNT balance for a single address
  async getBalance(address: string): Promise<string> {
    try {
      const url = this.buildUrl('account', 'balance', {
        address,
        tag: 'latest'
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1') {
        return data.result; // Balance in wei
      }
      throw new Error(data.message || 'Failed to fetch balance');
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  // Get native MNT balances for multiple addresses (max 20)
  async getBalanceMulti(addresses: string[]): Promise<AccountBalance[]> {
    try {
      if (addresses.length > 20) {
        throw new Error('Maximum 20 addresses allowed');
      }

      const url = this.buildUrl('account', 'balancemulti', {
        address: addresses.join(','),
        tag: 'latest'
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1') {
        return data.result;
      }
      throw new Error(data.message || 'Failed to fetch balances');
    } catch (error) {
      console.error('Error fetching multiple balances:', error);
      return [];
    }
  }

  // Get normal transactions for an address
  async getTransactions(
    address: string,
    startBlock: number = 0,
    endBlock: number = 999999999,
    page: number = 1,
    offset: number = 10000
  ): Promise<Transaction[]> {
    try {
      const url = this.buildUrl('account', 'txlist', {
        address,
        startblock: startBlock.toString(),
        endblock: endBlock.toString(),
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc' // Latest transactions first
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1') {
        return data.result;
      }
      return []; // Return empty array if no transactions
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  // Get ERC-20 token transfers for an address
  async getTokenTransfers(
    address: string,
    contractAddress?: string,
    startBlock: number = 0,
    endBlock: number = 999999999,
    page: number = 1,
    offset: number = 10000
  ): Promise<TokenTransfer[]> {
    try {
      const params: Record<string, string> = {
        address,
        startblock: startBlock.toString(),
        endblock: endBlock.toString(),
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc'
      };

      if (contractAddress) {
        params.contractaddress = contractAddress;
      }

      const url = this.buildUrl('account', 'tokentx', params);

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1') {
        return data.result;
      }
      return [];
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return [];
    }
  }

  // Get comprehensive portfolio data
  async getPortfolioData(address: string): Promise<{
    nativeBalance: string;
    transactions: Transaction[];
    tokenTransfers: TokenTransfer[];
    uniqueTokens: string[];
  }> {
    try {
      const [nativeBalance, transactions, tokenTransfers] = await Promise.all([
        this.getBalance(address),
        this.getTransactions(address, 0, 999999999, 1, 100), // Last 100 transactions
        this.getTokenTransfers(address, undefined, 0, 999999999, 1, 100) // Last 100 token transfers
      ]);

      // Extract unique token contracts
      const uniqueTokens = [...new Set(tokenTransfers.map(tx => tx.contractAddress))];

      return {
        nativeBalance,
        transactions,
        tokenTransfers,
        uniqueTokens
      };
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      throw error;
    }
  }

  // Get recent DeFi activity (swaps, LP, staking)
  async getDeFiActivity(address: string, days: number = 30): Promise<{
    swaps: TokenTransfer[];
    liquidityProvision: TokenTransfer[];
    stakingActivity: Transaction[];
  }> {
    try {
      const recentTokenTransfers = await this.getTokenTransfers(address);
      const recentTransactions = await this.getTransactions(address);

      // Filter by time (last X days)
      const cutoffTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);

      const recentTokenTx = recentTokenTransfers.filter(
        tx => parseInt(tx.timeStamp) > cutoffTime
      );

      const recentTx = recentTransactions.filter(
        tx => parseInt(tx.timeStamp) > cutoffTime
      );

      // Categorize DeFi activities based on common patterns
      const swaps = recentTokenTx.filter(tx => 
        this.isLikelySwap(tx)
      );

      const liquidityProvision = recentTokenTx.filter(tx =>
        this.isLikelyLiquidity(tx)
      );

      const stakingActivity = recentTx.filter(tx =>
        tx.functionName?.includes('stake') ||
        tx.functionName?.includes('claim') ||
        tx.functionName?.includes('withdraw')
      );

      return {
        swaps,
        liquidityProvision,
        stakingActivity
      };
    } catch (error) {
      console.error('Error fetching DeFi activity:', error);
      return { swaps: [], liquidityProvision: [], stakingActivity: [] };
    }
  }

  // Helper method to build API URLs
  private buildUrl(module: string, action: string, params: Record<string, string>): string {
    const searchParams = new URLSearchParams({
      module,
      action,
      ...params
    });

    if (this.config.apiKey) {
      searchParams.set('apikey', this.config.apiKey);
    }

    return `${this.config.baseUrl}?${searchParams.toString()}`;
  }

  // Helper to identify likely swap transactions
  private isLikelySwap(tx: TokenTransfer): boolean {
    // Common DEX router addresses on Mantle (to be updated with actual addresses)
    const dexRouters = [
      '0x', // Agni Finance router
      '0x', // FusionX router
      // Add actual router addresses
    ];

    // Check if transaction involves known DEX routers or has swap-like patterns
    return dexRouters.some(router => 
      tx.to.toLowerCase() === router.toLowerCase()
    ) || tx.tokenSymbol.includes('LP') === false; // Simple heuristic for now
  }

  // Helper to identify likely liquidity provision transactions
  private isLikelyLiquidity(tx: TokenTransfer): boolean {
    // Check for LP token patterns or known liquidity contracts
    return tx.tokenSymbol.includes('LP') || 
           tx.tokenName.toLowerCase().includes('liquidity') ||
           tx.tokenName.toLowerCase().includes('pair');
  }

  // Convert wei to human readable format
  static formatBalance(balance: string, decimals: number = 18): string {
    if (!balance || balance === '0') return '0';
    
    const divisor = Math.pow(10, decimals);
    const formatted = parseFloat(balance) / divisor;
    
    return formatted.toFixed(4);
  }

  // Get transaction age in hours
  static getTransactionAge(timestamp: string): number {
    const txTime = parseInt(timestamp) * 1000; // Convert to milliseconds
    const now = Date.now();
    return (now - txTime) / (1000 * 60 * 60); // Hours
  }
}

// Export configured instances
export const mantleScanMainnet = new MantleScanService(false);
export const mantleScanTestnet = new MantleScanService(true);