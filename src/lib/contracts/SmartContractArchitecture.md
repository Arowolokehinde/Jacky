# Smart Contract Architecture for Jacky AI DeFi Copilot
## Deployed on Mantle Network

### Overview
Smart contracts to support secure DeFi operations for Franky (Portfolio Manager) and Kranky (Staking Expert) agents. All contracts will be deployed on Mantle Network (Chain ID: 5000).

## Core Contracts

### 1. **JackyAggregator.sol** - Main Router Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract JackyAggregator is ReentrancyGuard, Pausable, Ownable {
    // Main router for all DeFi operations
    // Interfaces with DEXs, staking contracts, and price feeds
    
    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        address recipient;
        uint256 deadline;
    }
    
    struct StakingParams {
        address stakingContract;
        uint256 amount;
        uint256 lockPeriod;
        bool autoCompound;
    }
    
    // Chainlink price feed integration
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    // Approved DEX routers (Agni, FusionX, etc.)
    mapping(address => bool) public approvedRouters;
    
    // Approved staking contracts
    mapping(address => bool) public approvedStakingContracts;
    
    events SwapExecuted(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event StakeExecuted(address indexed user, address stakingContract, uint256 amount);
    
    function executeSwap(SwapParams calldata params) external nonReentrant whenNotPaused {
        // Validate params with Chainlink price feeds
        // Execute swap through approved DEX
        // Emit events for Franky agent tracking
    }
    
    function executeStaking(StakingParams calldata params) external nonReentrant whenNotPaused {
        // Validate staking parameters
        // Execute staking through approved contracts
        // Update user staking positions
    }
    
    function getTokenPrice(address token) external view returns (uint256) {
        // Get real-time price from Chainlink
        AggregatorV3Interface priceFeed = priceFeeds[token];
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price);
    }
}
```

**Purpose**: Central router for all DeFi operations, integrates with Chainlink price feeds

**Features**:
- Secure swap execution with slippage protection
- Staking contract interaction
- Real-time Chainlink price validation
- Emergency pause functionality
- Multi-signature admin controls

---

### 2. **FrankyPortfolioManager.sol** - Portfolio Management
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FrankyPortfolioManager {
    struct UserPortfolio {
        mapping(address => uint256) tokenBalances;
        uint256 totalValue;
        uint256 lastUpdated;
        bool autoRebalance;
    }
    
    mapping(address => UserPortfolio) public portfolios;
    
    // Portfolio analytics for Franky agent
    struct PortfolioMetrics {
        uint256 totalValue;
        uint256 diversificationScore;
        uint256 riskScore;
        address[] topHoldings;
    }
    
    function updatePortfolio(address user) external {
        // Update user portfolio data
        // Calculate metrics for Franky agent
    }
    
    function getPortfolioMetrics(address user) external view returns (PortfolioMetrics memory) {
        // Return comprehensive portfolio data for agent analysis
    }
    
    function executeRebalancing(address user, address[] calldata tokensOut, address[] calldata tokensIn, uint256[] calldata amounts) external {
        // Automated portfolio rebalancing based on Franky recommendations
    }
}
```

**Purpose**: Track and manage user portfolios for Franky agent analysis

---

### 3. **KrankyStakingOptimizer.sol** - Staking Management
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract KrankyStakingOptimizer {
    struct StakingPosition {
        address protocol;
        uint256 stakedAmount;
        uint256 rewardsEarned;
        uint256 stakingTimestamp;
        uint256 unlockTimestamp;
        bool autoCompound;
    }
    
    mapping(address => StakingPosition[]) public userStakingPositions;
    
    // Supported staking protocols
    struct StakingProtocol {
        address contractAddress;
        uint256 currentAPY;
        uint256 minimumStake;
        uint256 lockupPeriod;
        bool isActive;
    }
    
    mapping(address => StakingProtocol) public stakingProtocols;
    
    function optimizeStaking(address user, uint256 totalAmount) external returns (uint256[] memory allocations) {
        // Optimal allocation algorithm based on APYs and risk
        // Returns allocation percentages for each protocol
    }
    
    function executeOptimalStaking(address user, uint256 amount, address[] calldata protocols, uint256[] calldata allocations) external {
        // Execute optimized staking strategy across multiple protocols
    }
    
    function claimAllRewards(address user) external {
        // Claim rewards from all staking positions
        // Auto-compound if enabled
    }
    
    function getStakingAnalytics(address user) external view returns (uint256 totalStaked, uint256 totalRewards, uint256 averageAPY) {
        // Return comprehensive staking data for Kranky agent
    }
}
```

**Purpose**: Optimize MNT staking across multiple protocols for maximum yield

---

### 4. **ChainlinkDataManager.sol** - Price Feed Integration
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ChainlinkDataManager {
    struct PriceFeed {
        AggregatorV3Interface feed;
        uint256 decimals;
        uint256 heartbeat; // Max acceptable staleness
        bool isActive;
    }
    
    mapping(address => PriceFeed) public priceFeeds;
    
    // Custom data feeds for DeFi metrics
    struct DeFiMetrics {
        uint256 protocolTVL;
        uint256 yieldRate;
        uint256 utilizationRate;
        uint256 lastUpdated;
    }
    
    mapping(address => DeFiMetrics) public defiMetrics;
    
    function getTokenPrice(address token) external view returns (uint256 price, uint256 timestamp) {
        PriceFeed memory feed = priceFeeds[token];
        require(feed.isActive, "Price feed not active");
        
        (, int256 price, , uint256 updatedAt, ) = feed.feed.latestRoundData();
        require(block.timestamp - updatedAt <= feed.heartbeat, "Price data stale");
        
        return (uint256(price), updatedAt);
    }
    
    function updateDeFiMetrics(address protocol, uint256 tvl, uint256 yield, uint256 utilization) external {
        // Update protocol metrics for agent analysis
        defiMetrics[protocol] = DeFiMetrics(tvl, yield, utilization, block.timestamp);
    }
    
    function getProtocolHealth(address protocol) external view returns (bool isHealthy) {
        // Analyze protocol health based on multiple metrics
        DeFiMetrics memory metrics = defiMetrics[protocol];
        // Health logic based on TVL, yield, utilization
        return true; // Simplified
    }
}
```

**Purpose**: Centralized Chainlink data management for all agents

---

## Deployment Plan

### Phase 1: Core Infrastructure (Week 1)
```bash
# Deploy to Mantle Testnet first
npx hardhat deploy --network mantle-testnet --tags core

# Contracts to deploy:
1. ChainlinkDataManager.sol
2. JackyAggregator.sol (basic version)
```

### Phase 2: Portfolio Management (Week 2)
```bash
# Add portfolio tracking
npx hardhat deploy --network mantle-testnet --tags portfolio

# Contracts:
3. FrankyPortfolioManager.sol
# Upgrade JackyAggregator with portfolio integration
```

### Phase 3: Staking Optimization (Week 3)
```bash
# Add staking features
npx hardhat deploy --network mantle-testnet --tags staking

# Contracts:
4. KrankyStakingOptimizer.sol
# Integrate with existing staking protocols
```

### Phase 4: Mainnet Deployment (Week 4)
```bash
# Deploy to Mantle Mainnet
npx hardhat deploy --network mantle-mainnet --tags all

# Full verification and integration testing
```

## Security Features

### 1. **Multi-Signature Admin**
```solidity
// Use Gnosis Safe for admin operations
// Require 2/3 signatures for critical functions
```

### 2. **Emergency Controls**
```solidity
// Pausable contracts for emergency stops
// Upgrade patterns for contract improvements
// Rate limiting for large transactions
```

### 3. **Oracle Security**
```solidity
// Multiple price feed validation
// Circuit breakers for extreme price movements
// Staleness checks for all data feeds
```

### 4. **User Protection**
```solidity
// Slippage protection for all swaps
// Maximum transaction limits
// Timelock for admin functions
```

## Gas Optimization

### 1. **Batch Operations**
```solidity
// Batch multiple swaps in single transaction
// Batch staking across multiple protocols
// Batch reward claiming
```

### 2. **Storage Optimization**
```solidity
// Packed structs for gas efficiency
// Minimal storage reads/writes
// Event-based data for off-chain indexing
```

## Integration Points

### Frontend Integration
```typescript
// Web3 hooks for contract interaction
// Real-time event listening
// Transaction status tracking
```

### Agent Integration
```typescript
// Contract state reading for portfolio analysis
// Transaction simulation before execution
// Real-time metrics for decision making
```

## Monitoring & Analytics

### 1. **Contract Events**
```solidity
// Comprehensive event logging
// User action tracking
// Performance metrics
```

### 2. **Dashboard Integration**
```typescript
// Real-time contract metrics
// User activity analytics
// Protocol performance tracking
```

---

## Contract Addresses (To be deployed)

### Mantle Testnet
- ChainlinkDataManager: `0x...`
- JackyAggregator: `0x...`
- FrankyPortfolioManager: `0x...`
- KrankyStakingOptimizer: `0x...`

### Mantle Mainnet
- ChainlinkDataManager: `0x...`
- JackyAggregator: `0x...`
- FrankyPortfolioManager: `0x...`
- KrankyStakingOptimizer: `0x...`

## Next Steps

1. **Set up Hardhat environment for Mantle**
2. **Implement basic contract versions**
3. **Integration testing with agents**
4. **Security audit before mainnet**
5. **Gradual feature rollout**

This architecture provides a secure, scalable foundation for the Jacky/Franky/Kranky agent system on Mantle Network.