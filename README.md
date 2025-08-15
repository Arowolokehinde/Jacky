#  Mantle Labs AI DeFi Copilot

**Your intelligent guide to decentralized finance on Mantle Network**

##  Overview

MantleLabs AI DeFi Copilot is an intelligent conversational interface for decentralized finance operations, specifically optimized for the **Mantle Network**. It features a sophisticated multi-agent system that can analyze portfolios, assess risks, suggest strategies, and potentially execute DeFi transactions through natural language interactions.

### ✨ Key Features

- **🤖 Multi-Agent AI System**: Specialized agents for portfolio analysis, risk assessment, and strategy recommendations
- **💰 Mantle Network Integration**: Optimized for Mantle DeFi protocols (Agni Finance, FusionX, Lendle, etc.)
- **🔗 Web3 Wallet Connection**: Full wallet integration with MetaMask and WalletConnect support
- **📊 Real-time Portfolio Analysis**: Live balance tracking and portfolio composition analysis
- **⚡ Smart Query Routing**: Automatically routes queries to appropriate specialized agents
- **🎨 Beautiful UI/UX**: Modern chat interface with smooth animations and responsive design

## 🏗️ Architecture

### Multi-Agent System

The application uses a sophisticated agent coordinator system:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  Portfolio Agent    │    │   Risk Agent        │    │  Strategy Agent     │
│                     │    │                     │    │                     │
│ • Balance Analysis  │    │ • Risk Assessment   │    │ • Yield Strategies  │
│ • Token Holdings    │    │ • Safety Scoring    │    │ • Protocol Recs     │
│ • Diversification   │    │ • Warning Systems   │    │ • Optimization      │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       │
                              ┌─────────────────────┐
                              │  Agent Coordinator  │
                              │                     │
                              │ • Query Routing     │
                              │ • Response Synthesis│
                              │ • Parallel Execution│
                              └─────────────────────┘
```

### Agent Categories

1. **Conversational Agents** (`requiresWallet: false`)
   - General DeFi education and protocol explanations
   - No wallet connection needed

2. **Analysis Agents** (`requiresWallet: true`)
   - Portfolio analysis, risk assessment, strategy suggestions
   - Requires wallet connection for data access

3. **Execution Agents** (`requiresWallet: true, requiresTransaction: true`)
   - Token swaps, staking, liquidity operations
   - Currently in development phase

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Web3 wallet (MetaMask recommended)
- Groq API key for AI functionality

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone [repository-url]
   cd jacky-ai-defi
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   NEXT_PUBLIC_APP_NAME=Jacky AI DeFi Copilot
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000**

### Getting Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up/login and create a new API key
3. Add the key to your `.env.local` file

## 🎮 Usage Examples

### Without Wallet Connection
- **"What is DeFi?"** → Educational response about decentralized finance
- **"Explain yield farming"** → Detailed explanation of yield farming concepts
- **"Tell me about Mantle Network"** → Information about Mantle ecosystem

### With Wallet Connected
- **"Analyze my portfolio"** → Detailed breakdown of your holdings
- **"What are my risks?"** → Risk assessment and safety recommendations
- **"Suggest a strategy"** → Personalized DeFi strategy recommendations
- **"Show my balances"** → Live portfolio composition and values

## 📁 Project Structure

```
src/
├── app/
│   ├── api/chat/          # Chat API endpoint with agent routing
│   ├── layout.tsx         # Root layout with Web3 providers
│   └── page.tsx           # Main chat interface
├── components/
│   ├── ChatInterface.tsx  # Main chat UI component
│   ├── ChatMessage.tsx    # Individual message rendering
│   ├── ChatInput.tsx      # Message input with loading states
│   ├── Sidebar.tsx        # Navigation and wallet connection
│   └── WalletConnection.tsx # Web3 wallet integration
├── contexts/
│   ├── ChatContext.tsx    # Chat state management
│   └── WagmiProvider.tsx  # Web3 configuration and providers
├── lib/
│   ├── agents/            # Multi-agent system
│   │   ├── AgentTypes.ts          # Agent definitions and query routing
│   │   ├── BaseAgent.ts           # Base agent class with LLM integration
│   │   ├── MantleAgentCoordinator.ts # Coordinates multiple agents
│   │   ├── MantlePortfolioAgent.ts   # Portfolio analysis specialist
│   │   ├── MantleRiskAgent.ts        # Risk assessment specialist
│   │   ├── MantleStrategyAgent.ts    # Strategy recommendation specialist
│   │   └── types.ts               # Agent interface definitions
│   ├── chainlink/         # Price feed integrations
│   ├── mantlescan/        # Mantle blockchain API clients
│   ├── config.ts          # Application configuration
│   ├── groq.ts           # Groq AI API integration
│   └── gemini.ts         # Gemini AI API integration (backup)
└── types/
    └── chat.ts           # Chat-related TypeScript types
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Icon library

### Web3 Integration
- **Wagmi 2** - React hooks for Ethereum
- **Viem 2** - TypeScript interface for Ethereum
- **RainbowKit 2** - Wallet connection UI

### AI & Backend
- **Groq SDK** - Fast AI inference
- **Llama 3.1** - Language model for agent reasoning
- **Custom Agent System** - Specialized DeFi agents

### Data Sources
- **Chainlink Price Feeds** - Real-time token prices
- **Mantle Blockchain APIs** - Portfolio data and transactions
- **DefiLlama Integration** - Protocol TVL and metrics

## 🧪 Development Phases

### ✅ Phase 1: Core AI Infrastructure (COMPLETE)
- Basic conversational AI system
- Chat interface and state management
- Groq API integration with system prompts

### ✅ Phase 2: Web3 Integration (COMPLETE)
- Wallet connection (MetaMask, WalletConnect)
- Mantle Network configuration
- Basic portfolio balance reading

### 🚧 Phase 3: Multi-Agent System (IN PROGRESS)
- ✅ Agent architecture and coordinator
- ✅ Portfolio, Risk, and Strategy agents
- ✅ Intelligent query routing and classification
- 🔄 Live blockchain data integration
- 🔄 Agent response optimization

### 🔜 Phase 4: DeFi Operations
- Token swap execution through Agni/FusionX
- Staking operations (mETH, MNT)
- Liquidity provision management
- Transaction simulation and confirmation

### 🔜 Phase 5: Advanced Features
- Historical portfolio performance tracking
- Automated strategy execution
- Cross-protocol yield optimization
- Social trading features

## 🔧 Configuration

### Supported Networks
- **Mantle Mainnet** (Chain ID: 5000)
- **Mantle Testnet** (Chain ID: 5001)

### Integrated Protocols
- **Agni Finance** - Primary DEX (TVL: ~$121M)
- **FusionX** - Secondary DEX and yield farming
- **Lendle** - Lending protocol
- **Mantle Staking** - mETH/MNT staking

### Environment Variables
```env
# Required
GROQ_API_KEY=your_groq_api_key_here

# Optional
NEXT_PUBLIC_APP_NAME=Mantle Labs AI DeFi Copilot
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Chat interface loads without errors
- [ ] Wallet connection works (MetaMask/WalletConnect)
- [ ] Agent routing responds correctly to different query types
- [ ] Portfolio analysis works with connected wallet
- [ ] Risk assessment provides relevant warnings
- [ ] Strategy recommendations are contextual
- [ ] Error states display properly
- [ ] Mobile responsive design works
- [ ] Network switching to Mantle works

### Test Query Examples

**Educational Queries (No wallet needed):**
```
"What is yield farming?"
"How do AMMs work?"
"Explain impermanent loss"
"Tell me about Mantle Network"
```

**Analysis Queries (Wallet required):**
```
"Analyze my portfolio"
"What are my biggest risks?"
"Show my token balances"
"Recommend a strategy based on my holdings"
```

## 📊 Agent System Details

### Query Classification System
The system automatically routes queries based on keywords and context:

```typescript
// Examples of query classification
"analyze portfolio" → Portfolio Agent
"what are my risks" → Risk Agent + Portfolio Agent  
"suggest strategy" → Strategy Agent + Portfolio Agent
"swap tokens" → Execution Agent (future)
```

### Agent Coordination
- **Parallel Execution**: Multiple agents run simultaneously for efficiency
- **Response Synthesis**: Coordinator combines agent outputs into coherent responses  
- **Priority Routing**: Query-specific agent prioritization
- **Fallback Handling**: Graceful degradation when agents are unavailable

## 🛡️ Security Considerations

- **No Private Key Storage**: Uses standard Web3 wallet patterns
- **Read-Only Operations**: Current agents only read blockchain data
- **Transaction Previews**: All operations will show full transaction details
- **Network Validation**: Ensures operations occur on correct networks

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Run linting: `npm run lint`
6. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Add appropriate error handling
- Include JSDoc comments for complex functions

## 📝 License

This project is private and proprietary. All rights reserved.
---

**Built with ❤️ for the Mantle DeFi ecosystem**