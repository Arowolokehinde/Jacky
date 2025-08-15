// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title SimpleYieldFarmer
 * @dev Basic yield farming functionality for Franky AI on Mantle testnet
 */
contract YieldFarmer {
    
    struct YieldStrategy {
        string name;
        address stakingContract;
        address rewardToken;
        address lpToken;
        uint256 apy;
        uint256 minDeposit;
        bool isActive;
    }

    struct UserPosition {
        uint256 strategyId;
        uint256 stakedAmount;
        uint256 depositTimestamp;
        bool isActive;
    }

    // State variables
    address public owner;
    mapping(uint256 => YieldStrategy) public strategies;
    mapping(address => mapping(uint256 => UserPosition)) public userPositions;
    uint256 public nextStrategyId = 1;

    // Events
    event StrategyAdded(uint256 indexed strategyId, string name, uint256 apy);
    event FundsDeposited(address indexed user, uint256 indexed strategyId, uint256 amount);
    event FundsWithdrawn(address indexed user, uint256 indexed strategyId, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        _initializeStrategies();
    }

    /**
     * @dev Execute yield farming action
     */
    function executeYieldAction(
        uint256 strategyId,
        uint256 amount,
        address user
    ) external returns (bool) {
        YieldStrategy storage strategy = strategies[strategyId];
        require(strategy.isActive, "Strategy not active");
        require(amount >= strategy.minDeposit, "Below minimum deposit");
        
        // Transfer tokens from user
        IERC20(strategy.lpToken).transferFrom(user, address(this), amount);
        
        // Update user position
        UserPosition storage position = userPositions[user][strategyId];
        
        if (position.isActive) {
            position.stakedAmount += amount;
        } else {
            position.strategyId = strategyId;
            position.stakedAmount = amount;
            position.depositTimestamp = block.timestamp;
            position.isActive = true;
        }
        
        // Approve staking contract
        IERC20(strategy.lpToken).approve(strategy.stakingContract, amount);
        
        emit FundsDeposited(user, strategyId, amount);
        return true;
    }

    /**
     * @dev Withdraw from strategy
     */
    function withdraw(uint256 strategyId, uint256 amount) external {
        UserPosition storage position = userPositions[msg.sender][strategyId];
        require(position.isActive, "No active position");
        require(amount <= position.stakedAmount, "Insufficient staked amount");
        
        position.stakedAmount -= amount;
        if (position.stakedAmount == 0) {
            position.isActive = false;
        }
        
        // Transfer tokens back to user
        YieldStrategy storage strategy = strategies[strategyId];
        IERC20(strategy.lpToken).transfer(msg.sender, amount);
        
        emit FundsWithdrawn(msg.sender, strategyId, amount);
    }

    /**
     * @dev Get best strategy for amount and risk tolerance
     */
    function getBestStrategy(uint256 amount, uint256 /* riskTolerance */) 
        external 
        view 
        returns (uint256 strategyId, uint256 expectedAPY) 
    {
        uint256 bestAPY = 0;
        uint256 bestStrategy = 0;
        
        for (uint256 i = 1; i < nextStrategyId; i++) {
            YieldStrategy memory strategy = strategies[i];
            
            if (strategy.isActive && 
                amount >= strategy.minDeposit && 
                strategy.apy > bestAPY) {
                bestAPY = strategy.apy;
                bestStrategy = i;
            }
        }
        
        return (bestStrategy, bestAPY);
    }

    /**
     * @dev Add new strategy (owner only)
     */
    function addStrategy(
        string calldata name,
        address stakingContract,
        address rewardToken,
        address lpToken,
        uint256 apy,
        uint256 minDeposit
    ) external onlyOwner {
        uint256 strategyId = nextStrategyId++;
        
        strategies[strategyId] = YieldStrategy({
            name: name,
            stakingContract: stakingContract,
            rewardToken: rewardToken,
            lpToken: lpToken,
            apy: apy,
            minDeposit: minDeposit,
            isActive: true
        });
        
        emit StrategyAdded(strategyId, name, apy);
    }

    /**
     * @dev Initialize default strategies
     */
    function _initializeStrategies() internal {
        // Agni Finance LP strategy
        strategies[nextStrategyId] = YieldStrategy({
            name: "Agni MNT-USDC LP",
            stakingContract: address(0), // Set to actual contract
            rewardToken: address(0),     // AGNI token
            lpToken: address(0),         // MNT-USDC LP token
            apy: 1200,                   // 12% APY
            minDeposit: 100 ether,       // 100 LP tokens minimum
            isActive: false              // Will be activated when addresses are set
        });
        nextStrategyId++;
        
        // Lendle lending strategy
        strategies[nextStrategyId] = YieldStrategy({
            name: "Lendle MNT Lending",
            stakingContract: address(0), // Set to actual contract
            rewardToken: address(0),     // LEND token
            lpToken: address(0),         // MNT token
            apy: 800,                    // 8% APY
            minDeposit: 1000 ether,      // 1000 MNT minimum
            isActive: false              // Will be activated when addresses are set
        });
        nextStrategyId++;
    }

    /**
     * @dev Get user position
     */
    function getUserPosition(address user, uint256 strategyId) 
        external 
        view 
        returns (UserPosition memory) 
    {
        return userPositions[user][strategyId];
    }

    /**
     * @dev Get strategy details
     */
    function getStrategy(uint256 strategyId) external view returns (YieldStrategy memory) {
        return strategies[strategyId];
    }

    /**
     * @dev Emergency functions
     */
    function pauseStrategy(uint256 strategyId) external onlyOwner {
        strategies[strategyId].isActive = false;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }
}