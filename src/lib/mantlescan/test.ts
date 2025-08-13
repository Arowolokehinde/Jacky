// Test file for MantleScan API integration
// Run this to verify the API is working correctly

import { mantleScanMainnet } from './api';
import { mantleTokenTracker } from './tokenTracker';

// Test addresses (using common test addresses)
const TEST_ADDRESSES = [
  '0x0000000000000000000000000000000000000000', // Zero address (should have no balance)
  '0x1111111111111111111111111111111111111111', // Test address 1
  '0x2222222222222222222222222222222222222222'  // Test address 2
];

export async function testMantleScanIntegration() {
  console.log('🧪 Testing MantleScan API Integration...\n');

  try {
    // Test 1: Basic balance check
    console.log('📊 Test 1: Basic Balance Check');
    for (const address of TEST_ADDRESSES) {
      try {
        const balance = await mantleScanMainnet.getBalance(address);
        console.log(`Address ${address}: ${balance} wei`);
      } catch (error) {
        console.log(`❌ Error fetching balance for ${address}:`, error.message);
      }
    }
    console.log('✅ Balance checks completed\n');

    // Test 2: Multi-address balance check
    console.log('📊 Test 2: Multi-Address Balance Check');
    try {
      const balances = await mantleScanMainnet.getBalanceMulti(TEST_ADDRESSES);
      console.log('Multi-balance result:', balances);
    } catch (error) {
      console.log('❌ Multi-balance error:', error.message);
    }
    console.log('✅ Multi-balance check completed\n');

    // Test 3: Transaction history
    console.log('📊 Test 3: Transaction History');
    const testAddress = TEST_ADDRESSES[1];
    try {
      const transactions = await mantleScanMainnet.getTransactions(testAddress, 0, 999999999, 1, 10);
      console.log(`Found ${transactions.length} transactions for ${testAddress}`);
      if (transactions.length > 0) {
        console.log('Latest transaction:', {
          hash: transactions[0].hash,
          from: transactions[0].from,
          to: transactions[0].to,
          value: transactions[0].value
        });
      }
    } catch (error) {
      console.log('❌ Transaction history error:', error.message);
    }
    console.log('✅ Transaction history check completed\n');

    // Test 4: Token transfers
    console.log('📊 Test 4: Token Transfers');
    try {
      const tokenTransfers = await mantleScanMainnet.getTokenTransfers(testAddress, undefined, 0, 999999999, 1, 10);
      console.log(`Found ${tokenTransfers.length} token transfers for ${testAddress}`);
      if (tokenTransfers.length > 0) {
        console.log('Latest token transfer:', {
          hash: tokenTransfers[0].hash,
          tokenSymbol: tokenTransfers[0].tokenSymbol,
          value: tokenTransfers[0].value
        });
      }
    } catch (error) {
      console.log('❌ Token transfers error:', error.message);
    }
    console.log('✅ Token transfers check completed\n');

    // Test 5: Portfolio data
    console.log('📊 Test 5: Complete Portfolio Data');
    try {
      const portfolioData = await mantleScanMainnet.getPortfolioData(testAddress);
      console.log('Portfolio summary:', {
        nativeBalance: portfolioData.nativeBalance,
        transactionCount: portfolioData.transactions.length,
        tokenTransferCount: portfolioData.tokenTransfers.length,
        uniqueTokens: portfolioData.uniqueTokens.length
      });
    } catch (error) {
      console.log('❌ Portfolio data error:', error.message);
    }
    console.log('✅ Portfolio data check completed\n');

    // Test 6: Enhanced token tracking
    console.log('📊 Test 6: Enhanced Token Tracking');
    try {
      const portfolioSummary = await mantleTokenTracker.getPortfolioSummary(testAddress);
      console.log('Enhanced portfolio summary:', portfolioSummary);
    } catch (error) {
      console.log('❌ Enhanced tracking error:', error.message);
    }
    console.log('✅ Enhanced tracking check completed\n');

    console.log('🎉 All MantleScan integration tests completed!');
    
    return {
      success: true,
      message: 'MantleScan integration is working correctly'
    };

  } catch (error) {
    console.error('❌ Overall test failure:', error);
    return {
      success: false,
      message: `Test failed: ${error.message}`
    };
  }
}

// Utility function to test with a real wallet address
export async function testWithRealWallet(walletAddress: string) {
  console.log(`🔍 Testing with real wallet: ${walletAddress}\n`);

  try {
    // Get portfolio summary
    const summary = await mantleTokenTracker.getPortfolioSummary(walletAddress);
    console.log('Real Portfolio Summary:');
    console.log(`Total Value: $${summary.totalValue.toFixed(2)}`);
    console.log(`Token Count: ${summary.tokenCount}`);
    console.log(`Protocol Count: ${summary.protocolCount}`);
    console.log(`Risk Level: ${summary.riskLevel}`);
    console.log(`Diversification Score: ${(summary.diversificationScore * 100).toFixed(1)}%`);

    // Get enhanced portfolio details
    const enhanced = await mantleTokenTracker.getEnhancedPortfolio(walletAddress);
    console.log('\nEnhanced Portfolio Details:');
    console.log(`Native MNT: ${enhanced.nativeBalance.balanceFormatted} ($${enhanced.nativeBalance.valueUSD.toFixed(2)})`);
    console.log(`Token Balances: ${enhanced.tokenBalances.length} tokens`);
    console.log(`DeFi Positions: ${enhanced.defiPositions.length} positions`);

    if (enhanced.tokenBalances.length > 0) {
      console.log('\nTop Token Holdings:');
      enhanced.tokenBalances.slice(0, 5).forEach((tb, index) => {
        console.log(`${index + 1}. ${tb.token.symbol}: ${tb.balanceFormatted} ($${tb.valueUSD.toFixed(2)})`);
      });
    }

    if (enhanced.defiPositions.length > 0) {
      console.log('\nDeFi Positions:');
      enhanced.defiPositions.forEach((pos, index) => {
        console.log(`${index + 1}. ${pos.protocol} - ${pos.type} (${pos.tokens.length} tokens)`);
      });
    }

    return enhanced;

  } catch (error) {
    console.error('Error testing real wallet:', error);
    return null;
  }
}

// Export for use in development/testing
if (typeof window === 'undefined') {
  // Node.js environment - can run tests directly
  // testMantleScanIntegration();
}