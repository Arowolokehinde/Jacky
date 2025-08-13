import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, mantle, mantleTestnet } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, mantle, mantleTestnet],
  connectors: [
    injected(),
    coinbaseWallet(),
    // Temporarily disabled until you get a WalletConnect project ID
    // walletConnect({ 
    //   projectId,
    //   metadata: {
    //     name: 'Jacky AI DeFi Copilot',
    //     description: 'Your intelligent guide to decentralized finance',
    //     url: 'https://jacky-ai.com',
    //     icons: ['https://jacky-ai.com/icon.png']
    //   }
    // }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [mantle.id]: http('https://rpc.mantle.xyz'),
    [mantleTestnet.id]: http('https://rpc.testnet.mantle.xyz'),
  },
})

// Mantle Network configuration for easy access
export const mantleNetwork = {
  id: 5000,
  name: 'Mantle',
  network: 'mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    public: { http: ['https://rpc.mantle.xyz'] },
    default: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.mantle.xyz' },
  },
}

export const mantleTestnetNetwork = {
  id: 5001,
  name: 'Mantle Testnet',
  network: 'mantle-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Testnet Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    public: { http: ['https://rpc.testnet.mantle.xyz'] },
    default: { http: ['https://rpc.testnet.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Testnet Explorer', url: 'https://explorer.testnet.mantle.xyz' },
  },
}

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}