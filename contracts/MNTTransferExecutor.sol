// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MNTTransferExecutor
 * @dev Executes MNT native token transfers for Franky AI conversational actions
 * @notice Handles "Send 100 MNT to [address]" type commands from Franky
 */
contract MNTTransferExecutor is Ownable, ReentrancyGuard {
    
    // Transfer limits for security
    struct TransferLimits {
        uint256 maxPerTransaction;
        uint256 maxPerDay;
        uint256 maxPerUser;
    }

    // Transfer tracking
    struct UserTransferInfo {
        uint256 totalTransferred;
        uint256 dailyTransferred;
        uint256 lastTransferDay;
        uint256 transactionCount;
    }

    // State variables
    TransferLimits public limits;
    mapping(address => UserTransferInfo) public userTransfers;
    mapping(address => bool) public authorizedCallers;
    
    uint256 public totalTransferred;
    uint256 public totalTransactions;
    
    // Events
    event MNTTransferred(
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes32 indexed actionId,
        uint256 gasUsed
    );
    
    event TransferLimitsUpdated(
        uint256 maxPerTransaction,
        uint256 maxPerDay,
        uint256 maxPerUser
    );
    
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);

    // Modifiers
    modifier onlyAuthorized() {
        require(
            authorizedCallers[msg.sender] || msg.sender == owner(),
            "Not authorized caller"
        );
        _;
    }

    modifier validTransfer(address _to, uint256 _amount) {
        require(_to != address(0), "Invalid recipient");
        require(_to != address(this), "Cannot transfer to self");
        require(_amount > 0, "Amount must be positive");
        require(_amount <= limits.maxPerTransaction, "Exceeds transaction limit");
        _;
    }

    constructor() {
        // Set default limits (can be adjusted by owner)
        limits = TransferLimits({
            maxPerTransaction: 10000 ether,  // 10,000 MNT per transaction
            maxPerDay: 50000 ether,          // 50,000 MNT per day per user
            maxPerUser: 100000 ether         // 100,000 MNT total per user
        });
    }

    /**
     * @dev Execute MNT transfer
     * @param _to Recipient address
     * @param _amount Amount to transfer in wei
     * @param _actionId Unique action ID from MantleActionHub
     */
    function transfer(
        address _to,
        uint256 _amount,
        bytes32 _actionId
    ) 
        external 
        payable
        nonReentrant 
        onlyAuthorized 
        validTransfer(_to, _amount)
    {
        uint256 gasStart = gasleft();
        
        // Check daily and total limits
        _checkTransferLimits(tx.origin, _amount);
        
        // Update user transfer info
        _updateUserTransferInfo(tx.origin, _amount);
        
        // Execute transfer
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Transfer failed");
        
        // Update global stats
        totalTransferred += _amount;
        totalTransactions++;
        
        uint256 gasUsed = gasStart - gasleft();
        
        emit MNTTransferred(tx.origin, _to, _amount, _actionId, gasUsed);
    }

    /**
     * @dev Batch transfer MNT to multiple recipients
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of amounts to transfer
     * @param _actionId Unique action ID from MantleActionHub
     */
    function batchTransfer(
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        bytes32 _actionId
    ) 
        external 
        payable
        nonReentrant 
        onlyAuthorized 
    {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        require(_recipients.length <= 10, "Too many recipients");
        
        uint256 totalAmount = 0;
        
        // Calculate total amount and validate each transfer
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");
            require(_amounts[i] > 0, "Invalid amount");
            totalAmount += _amounts[i];
        }
        
        require(totalAmount <= limits.maxPerTransaction, "Exceeds transaction limit");
        
        // Check limits for total amount
        _checkTransferLimits(tx.origin, totalAmount);
        
        // Execute transfers
        for (uint256 i = 0; i < _recipients.length; i++) {
            (bool success, ) = _recipients[i].call{value: _amounts[i]}("");
            require(success, "Transfer failed");
            
            emit MNTTransferred(tx.origin, _recipients[i], _amounts[i], _actionId, 0);
        }
        
        // Update user and global stats
        _updateUserTransferInfo(tx.origin, totalAmount);
        totalTransferred += totalAmount;
        totalTransactions++;
    }

    /**
     * @dev Check if transfer is within limits
     * @param _user User address
     * @param _amount Transfer amount
     */
    function _checkTransferLimits(address _user, uint256 _amount) internal view {
        UserTransferInfo memory userInfo = userTransfers[_user];
        
        // Check total user limit
        require(
            userInfo.totalTransferred + _amount <= limits.maxPerUser,
            "Exceeds user total limit"
        );
        
        // Check daily limit
        uint256 currentDay = block.timestamp / 1 days;
        uint256 dailyAmount = userInfo.lastTransferDay == currentDay 
            ? userInfo.dailyTransferred + _amount 
            : _amount;
            
        require(dailyAmount <= limits.maxPerDay, "Exceeds daily limit");
    }

    /**
     * @dev Update user transfer information
     * @param _user User address
     * @param _amount Transfer amount
     */
    function _updateUserTransferInfo(address _user, uint256 _amount) internal {
        UserTransferInfo storage userInfo = userTransfers[_user];
        uint256 currentDay = block.timestamp / 1 days;
        
        // Reset daily amount if new day
        if (userInfo.lastTransferDay != currentDay) {
            userInfo.dailyTransferred = 0;
            userInfo.lastTransferDay = currentDay;
        }
        
        // Update counters
        userInfo.totalTransferred += _amount;
        userInfo.dailyTransferred += _amount;
        userInfo.transactionCount++;
    }

    /**
     * @dev Get transfer quote with fees and limits
     * @param _user User address
     * @param _amount Transfer amount
     * @return canTransfer Whether transfer is possible
     * @return gasEstimate Estimated gas cost
     * @return remainingDaily Remaining daily limit
     * @return remainingTotal Remaining total limit
     */
    function getTransferQuote(address _user, uint256 _amount) 
        external 
        view 
        returns (
            bool canTransfer,
            uint256 gasEstimate,
            uint256 remainingDaily,
            uint256 remainingTotal
        ) 
    {
        UserTransferInfo memory userInfo = userTransfers[_user];
        uint256 currentDay = block.timestamp / 1 days;
        
        // Calculate remaining limits
        remainingTotal = limits.maxPerUser > userInfo.totalTransferred 
            ? limits.maxPerUser - userInfo.totalTransferred 
            : 0;
            
        if (userInfo.lastTransferDay == currentDay) {
            remainingDaily = limits.maxPerDay > userInfo.dailyTransferred 
                ? limits.maxPerDay - userInfo.dailyTransferred 
                : 0;
        } else {
            remainingDaily = limits.maxPerDay;
        }
        
        // Check if transfer is possible
        canTransfer = _amount > 0 
            && _amount <= limits.maxPerTransaction
            && _amount <= remainingDaily
            && _amount <= remainingTotal;
            
        // Estimate gas (21,000 for basic transfer + overhead)
        gasEstimate = 25000;
    }

    /**
     * @dev Get user transfer statistics
     * @param _user User address
     * @return info User transfer information
     */
    function getUserTransferInfo(address _user) 
        external 
        view 
        returns (UserTransferInfo memory info) 
    {
        return userTransfers[_user];
    }

    /**
     * @dev Update transfer limits (only owner)
     * @param _maxPerTransaction Maximum per transaction
     * @param _maxPerDay Maximum per day per user
     * @param _maxPerUser Maximum total per user
     */
    function updateTransferLimits(
        uint256 _maxPerTransaction,
        uint256 _maxPerDay,
        uint256 _maxPerUser
    ) external onlyOwner {
        require(_maxPerTransaction > 0, "Invalid transaction limit");
        require(_maxPerDay >= _maxPerTransaction, "Daily limit too low");
        require(_maxPerUser >= _maxPerDay, "User limit too low");
        
        limits = TransferLimits({
            maxPerTransaction: _maxPerTransaction,
            maxPerDay: _maxPerDay,
            maxPerUser: _maxPerUser
        });
        
        emit TransferLimitsUpdated(_maxPerTransaction, _maxPerDay, _maxPerUser);
    }

    /**
     * @dev Authorize/deauthorize caller (only owner)
     * @param _caller Caller address
     * @param _authorized Whether to authorize
     */
    function setAuthorizedCaller(address _caller, bool _authorized) external onlyOwner {
        authorizedCallers[_caller] = _authorized;
        emit AuthorizedCallerUpdated(_caller, _authorized);
    }

    /**
     * @dev Get contract statistics
     * @return _totalTransferred Total MNT transferred
     * @return _totalTransactions Total number of transactions
     * @return _contractBalance Current contract balance
     */
    function getContractStats() 
        external 
        view 
        returns (
            uint256 _totalTransferred,
            uint256 _totalTransactions,
            uint256 _contractBalance
        ) 
    {
        return (totalTransferred, totalTransactions, address(this).balance);
    }

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Receive MNT for transfers
    receive() external payable {}
}