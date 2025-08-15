// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleActionHub
 * @dev Simplified central coordinator for Franky's actions on Mantle testnet
 */
contract ActionHub {
    
    enum ActionType {
        MNT_TRANSFER,
        TOKEN_SWAP, 
        YIELD_FARMING
    }

    struct ActionRequest {
        ActionType actionType;
        address initiator;
        bytes parameters;
        uint256 timestamp;
        bool executed;
        bool success;
    }

    // State variables (simplified)
    address public owner;
    address public mntExecutor;
    address public dexAggregator; 
    address public yieldAnalyzer;
    
    mapping(bytes32 => ActionRequest) public actions;
    mapping(address => uint256) public userActionCount;
    bool public paused = false;
    
    // Events
    event ActionRequested(bytes32 indexed actionId, ActionType actionType, address user);
    event ActionExecuted(bytes32 indexed actionId, bool success);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Set executor contracts
     */
    function setExecutors(
        address _mntExecutor,
        address _dexAggregator,
        address _yieldAnalyzer
    ) external onlyOwner {
        mntExecutor = _mntExecutor;
        dexAggregator = _dexAggregator;
        yieldAnalyzer = _yieldAnalyzer;
    }

    /**
     * @dev Request action execution
     */
    function requestAction(
        ActionType actionType,
        bytes calldata parameters
    ) external whenNotPaused returns (bytes32 actionId) {
        
        actionId = keccak256(
            abi.encodePacked(
                msg.sender,
                actionType,
                parameters,
                block.timestamp,
                userActionCount[msg.sender]
            )
        );

        actions[actionId] = ActionRequest({
            actionType: actionType,
            initiator: msg.sender,
            parameters: parameters,
            timestamp: block.timestamp,
            executed: false,
            success: false
        });

        userActionCount[msg.sender]++;
        emit ActionRequested(actionId, actionType, msg.sender);
        
        return actionId;
    }

    /**
     * @dev Execute action
     */
    function executeAction(bytes32 actionId) external whenNotPaused {
        ActionRequest storage action = actions[actionId];
        
        require(action.initiator == msg.sender, "Not initiator");
        require(!action.executed, "Already executed");
        require(block.timestamp <= action.timestamp + 1 hours, "Expired");

        action.executed = true;
        bool success = false;

        if (action.actionType == ActionType.MNT_TRANSFER) {
            success = _executeMNTTransfer(action.parameters);
        } else if (action.actionType == ActionType.TOKEN_SWAP) {
            success = _executeTokenSwap(action.parameters);
        } else if (action.actionType == ActionType.YIELD_FARMING) {
            success = _executeYieldAnalysis(action.parameters);
        }

        action.success = success;
        emit ActionExecuted(actionId, success);
    }

    /**
     * @dev Execute MNT transfer
     */
    function _executeMNTTransfer(bytes memory parameters) internal returns (bool) {
        if (mntExecutor == address(0)) return false;
        
        (address recipient, uint256 amount) = abi.decode(parameters, (address, uint256));
        
        (bool success, ) = mntExecutor.call{value: amount}(
            abi.encodeWithSignature("transfer(address,uint256)", recipient, amount)
        );
        
        return success;
    }

    /**
     * @dev Execute token swap
     */
    function _executeTokenSwap(bytes memory parameters) internal returns (bool) {
        if (dexAggregator == address(0)) return false;
        
        (bool success, ) = dexAggregator.call(
            abi.encodeWithSignature("executeSwap(bytes)", parameters)
        );
        
        return success;
    }

    /**
     * @dev Execute yield analysis
     */
    function _executeYieldAnalysis(bytes memory parameters) internal view returns (bool) {
        if (yieldAnalyzer == address(0)) return false;
        
        (bool success, ) = yieldAnalyzer.staticcall(
            abi.encodeWithSignature("getBestYieldOpportunities(uint256)", 
                abi.decode(parameters, (uint256)))
        );
        
        return success;
    }

    /**
     * @dev Admin functions
     */
    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}