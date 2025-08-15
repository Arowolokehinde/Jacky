// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title SimpleChainlinkAnalyzer
 * @dev Essential yield analysis with Chainlink price feeds for Franky AI
 * @notice Simplified version focusing only on core functionality
 */
contract ChainlinkAnalyzer {
    
    // Protocol data structure (simplified)
    struct ProtocolData {
        string name;
        uint256 apy;          // APY in basis points (1200 = 12%)
        uint256 tvl;          // Total Value Locked in USD
        uint256 riskScore;    // 1-100 (100 = highest risk)
        bool isActive;
    }

    // Yield opportunity for Franky recommendations
    struct YieldOpportunity {
        string protocol;
        uint256 apy;
        uint256 riskScore;
        bool recommended;
    }

    // State variables
    address public owner;
    mapping(string => ProtocolData) public protocols;
    mapping(address => AggregatorV3Interface) public priceFeeds;
    string[] public protocolList;

    // Events
    event ProtocolUpdated(string protocol, uint256 apy, uint256 tvl);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        _initializeProtocols();
    }

    /**
     * @dev Get best yield opportunities for Franky AI
     * @param riskTolerance Risk tolerance 1-100
     * @return opportunities Array of recommended protocols
     */
    function getBestYieldOpportunities(uint256 riskTolerance) 
        external 
        view 
        returns (YieldOpportunity[] memory opportunities) 
    {
        require(riskTolerance >= 1 && riskTolerance <= 100, "Invalid risk tolerance");
        
        uint256 count = 0;
        
        // Count suitable opportunities
        for (uint256 i = 0; i < protocolList.length; i++) {
            ProtocolData memory protocol = protocols[protocolList[i]];
            if (protocol.isActive && protocol.riskScore <= riskTolerance) {
                count++;
            }
        }
        
        opportunities = new YieldOpportunity[](count);
        uint256 index = 0;
        
        // Populate opportunities
        for (uint256 i = 0; i < protocolList.length; i++) {
            ProtocolData memory protocol = protocols[protocolList[i]];
            if (protocol.isActive && protocol.riskScore <= riskTolerance) {
                opportunities[index] = YieldOpportunity({
                    protocol: protocol.name,
                    apy: protocol.apy,
                    riskScore: protocol.riskScore,
                    recommended: protocol.apy > 500 && protocol.riskScore <= 50 // >5% APY, <50 risk
                });
                index++;
            }
        }
        
        return opportunities;
    }

    /**
     * @dev Get current token price from Chainlink
     * @param token Token address
     * @return price Current price
     */
    function getTokenPrice(address token) external view returns (uint256 price) {
        AggregatorV3Interface priceFeed = priceFeeds[token];
        require(address(priceFeed) != address(0), "No price feed");
        
        (, int256 answer, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(answer > 0 && block.timestamp - updatedAt <= 3600, "Stale price");
        
        return uint256(answer);
    }

    /**
     * @dev Update protocol data (owner only)
     */
    function updateProtocol(
        string calldata protocol,
        uint256 apy,
        uint256 tvl,
        uint256 riskScore
    ) external onlyOwner {
        protocols[protocol].apy = apy;
        protocols[protocol].tvl = tvl;
        protocols[protocol].riskScore = riskScore;
        
        emit ProtocolUpdated(protocol, apy, tvl);
    }

    /**
     * @dev Set price feed for token
     */
    function setPriceFeed(address token, address feed) external onlyOwner {
        priceFeeds[token] = AggregatorV3Interface(feed);
    }

    /**
     * @dev Initialize Mantle protocols
     */
    function _initializeProtocols() internal {
        // Agni Finance
        protocols["agni"] = ProtocolData({
            name: "Agni Finance",
            apy: 1200,     // 12%
            tvl: 121000000, // $121M
            riskScore: 35,
            isActive: true
        });
        protocolList.push("agni");
        
        // Lendle
        protocols["lendle"] = ProtocolData({
            name: "Lendle",
            apy: 800,      // 8%
            tvl: 45000000, // $45M
            riskScore: 25,
            isActive: true
        });
        protocolList.push("lendle");
        
        // FusionX
        protocols["fusionx"] = ProtocolData({
            name: "FusionX",
            apy: 1500,     // 15%
            tvl: 28000000, // $28M
            riskScore: 45,
            isActive: true
        });
        protocolList.push("fusionx");
    }

    /**
     * @dev Get protocol data
     */
    function getProtocol(string calldata protocol) external view returns (ProtocolData memory) {
        return protocols[protocol];
    }

    /**
     * @dev Get all tracked protocols
     */
    function getAllProtocols() external view returns (string[] memory) {
        return protocolList;
    }
}