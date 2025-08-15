import { BaseAgent } from './BaseAgent';
import { AgentResponse, AgentContext } from './types';

export interface ContractAction {
  type: 'mnt_transfer' | 'token_swap' | 'yield_analysis';
  contractAddress: string;
  functionName: string;
  parameters: Record<string, unknown>;
  estimatedGas: string;
}

export class FrankyAgent extends BaseAgent {
  private contracts = {
    mntTransfer: '0x991a8F634ED1d64C13848F575867f3740806ae2D',
    dexAggregator: '0x1b667C35aFbAD54E64520B9BEF8E68Da123c2a74', 
    chainlinkAnalyzer: '0x2b3AbFD1D90694e8eFeB0840e4ff1ce2bCf429d2'
  };

  constructor() {
    super('Franky - Mantle DeFi Agent', 'defi_executor', 'high');
  }

  async analyze(context: AgentContext): Promise<AgentResponse> {
    if (!context.userAddress) {
      return this.generateWalletRequiredResponse();
    }

    try {
      const action = this.parseAction(context.userQuery, context.userAddress);
      
      if (!action) {
        return this.generateHelpResponse();
      }

      return await this.prepareContractAction(action);
    } catch (error) {
      console.error('Franky error:', error);
      return this.generateErrorResponse();
    }
  }

  private parseAction(query: string, userAddress: string): ContractAction | null {
    const q = query.toLowerCase();

    // MNT Transfer: "send 100 MNT to 0x..."
    const transferMatch = q.match(/send\s+(\d+\.?\d*)\s*mnt\s+to\s+(0x[a-f0-9]{40})/i);
    if (transferMatch) {
      return {
        type: 'mnt_transfer',
        contractAddress: transferMatch[2], // Direct transfer to recipient
        functionName: 'transfer',
        parameters: {
          recipient: transferMatch[2],
          amount: transferMatch[1],
          from: userAddress
        },
        estimatedGas: '0.001'
      };
    }

    // Token Swap: "swap 100 MNT for USDC"
    const swapMatch = q.match(/swap\s+(\d+\.?\d*)\s*(\w+)\s+for\s+(\w+)/i);
    if (swapMatch) {
      return {
        type: 'token_swap',
        contractAddress: this.contracts.dexAggregator,
        functionName: 'executeBestSwap',
        parameters: {
          fromToken: swapMatch[2].toUpperCase(),
          toToken: swapMatch[3].toUpperCase(),
          amount: swapMatch[1],
          user: userAddress
        },
        estimatedGas: '0.002'
      };
    }

    // Yield Analysis: "find best yield" or "analyze yield"
    if (q.includes('yield') || q.includes('farming') || q.includes('apy')) {
      return {
        type: 'yield_analysis',
        contractAddress: this.contracts.chainlinkAnalyzer,
        functionName: 'getTokenPrice',
        parameters: {
          token: '0x35578E7e8949B5a59d40704dCF6D6faEC2Fb1D17'
        },
        estimatedGas: '0.0005'
      };
    }

    return null;
  }

  private async prepareContractAction(action: ContractAction): Promise<AgentResponse> {
    const actionDescriptions = {
      mnt_transfer: `Send ${action.parameters.amount} MNT to ${action.parameters.recipient}`,
      token_swap: `Swap ${action.parameters.amount} ${action.parameters.fromToken} for ${action.parameters.toToken}`,
      yield_analysis: 'Analyze current yield opportunities on Mantle'
    };

    const recommendations = action.type === 'mnt_transfer' 
      ? [
          `Recipient: ${action.parameters.recipient}`,
          `Amount: ${action.parameters.amount} MNT`,
          `Method: Direct native transfer`,
          `Gas estimate: ${action.estimatedGas} MNT`,
          'Ready to execute - confirm transaction in wallet'
        ]
      : action.type === 'yield_analysis'
      ? [
          '📊 Get real-time yield data from Chainlink oracles',
          '💰 View current MNT price and market data',
          '⚡ Instant analysis - no transaction required',
          'Click below to fetch latest data'
        ]
      : [
          `Contract: ${action.contractAddress}`,
          `Function: ${action.functionName}`,
          `Gas estimate: ${action.estimatedGas} MNT`,
          'Ready to execute - confirm transaction in wallet'
        ];

    return {
      agentName: this.name,
      confidence: 0.9,
      analysis: actionDescriptions[action.type],
      recommendations,
      warnings: [],
      data: {
        contractAction: action,
        requiresTransaction: true
      }
    };
  }

  private generateWalletRequiredResponse(): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.8,
      analysis: 'Please connect your wallet to perform DeFi actions on Mantle.',
      recommendations: [
        'Connect wallet to continue',
        'Supported: MetaMask, WalletConnect',
        'Network: Mantle (Chain ID 5000)'
      ],
      warnings: ['Wallet connection required'],
      data: { requiresWallet: true }
    };
  }

  private generateHelpResponse(): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.7,
      analysis: 'I can help you with DeFi actions on Mantle. Here are the available commands:',
      recommendations: [
        '💸 "Send 100 MNT to 0x..." - Transfer MNT tokens',
        '🔄 "Swap 50 MNT for USDC" - Exchange tokens via DEX',
        '📊 "Find best yield" - Analyze yield farming opportunities'
      ],
      warnings: [],
      data: { helpMode: true }
    };
  }

  private generateErrorResponse(): AgentResponse {
    return {
      agentName: this.name,
      confidence: 0.3,
      analysis: 'Unable to process your request. Please try a different command.',
      recommendations: [
        'Check your wallet connection',
        'Verify contract addresses are set',
        'Try: "Send 10 MNT to 0x..." or "Swap 50 MNT for USDC"'
      ],
      warnings: ['Action processing failed'],
      data: { error: true }
    };
  }
}