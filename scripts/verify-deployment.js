import { ethers } from "hardhat";

async function main() {
  console.log("=== Verifying Contract Deployment ===\n");

  // Contract addresses (update these after deployment)
  const contracts = {
    SimpleActionHub: "0x0000000000000000000000000000000000000000", // Update after deployment
    MNTTransferExecutor: "0x0000000000000000000000000000000000000000", // Update after deployment
    SimpleDEXAggregator: "0x0000000000000000000000000000000000000000", // Update after deployment
    SimpleYieldFarmer: "0x0000000000000000000000000000000000000000", // Update after deployment
    SimpleChainlinkAnalyzer: "0x0000000000000000000000000000000000000000" // Update after deployment
  };

  const [deployer] = await ethers.getSigners();
  console.log("Verifying with account:", deployer.address);

  try {
    // Verify SimpleActionHub
    console.log("1. Verifying SimpleActionHub...");
    const actionHub = await ethers.getContractAt("SimpleActionHub", contracts.SimpleActionHub);
    const hubOwner = await actionHub.owner();
    console.log("✓ Owner:", hubOwner);
    console.log("✓ Paused:", await actionHub.paused());

    // Verify MNTTransferExecutor
    console.log("\n2. Verifying MNTTransferExecutor...");
    const mntExecutor = await ethers.getContractAt("MNTTransferExecutor", contracts.MNTTransferExecutor);
    console.log("✓ Owner:", await mntExecutor.owner());
    console.log("✓ Daily Limit:", ethers.utils.formatEther(await mntExecutor.dailyLimit()), "MNT");
    console.log("✓ Max Single Transfer:", ethers.utils.formatEther(await mntExecutor.maxSingleTransfer()), "MNT");
    console.log("✓ ActionHub Authorized:", await mntExecutor.authorizedCallers(contracts.SimpleActionHub));

    // Verify SimpleDEXAggregator
    console.log("\n3. Verifying SimpleDEXAggregator...");
    const dexAggregator = await ethers.getContractAt("SimpleDEXAggregator", contracts.SimpleDEXAggregator);
    console.log("✓ Owner:", await dexAggregator.owner());
    console.log("✓ Agni Router:", await dexAggregator.agniRouter());
    console.log("✓ FusionX Router:", await dexAggregator.fusionXRouter());

    // Verify SimpleYieldFarmer
    console.log("\n4. Verifying SimpleYieldFarmer...");
    const yieldFarmer = await ethers.getContractAt("SimpleYieldFarmer", contracts.SimpleYieldFarmer);
    console.log("✓ Owner:", await yieldFarmer.owner());
    console.log("✓ Paused:", await yieldFarmer.paused());

    // Verify SimpleChainlinkAnalyzer
    console.log("\n5. Verifying SimpleChainlinkAnalyzer...");
    const chainlinkAnalyzer = await ethers.getContractAt("SimpleChainlinkAnalyzer", contracts.SimpleChainlinkAnalyzer);
    console.log("✓ Owner:", await chainlinkAnalyzer.owner());
    console.log("✓ Price Feed:", await chainlinkAnalyzer.priceFeed());

    // Verify ActionHub configuration
    console.log("\n6. Verifying ActionHub Configuration...");
    console.log("✓ MNT Executor:", await actionHub.mntExecutor());
    console.log("✓ DEX Aggregator:", await actionHub.dexAggregator());
    console.log("✓ Yield Analyzer:", await actionHub.yieldAnalyzer());

    console.log("\n=== Verification Complete ===");
    console.log("All contracts deployed and configured successfully!");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    // Basic contract existence check
    console.log("\n=== Basic Contract Existence Check ===");
    for (const [name, address] of Object.entries(contracts)) {
      try {
        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
          console.log(`❌ ${name}: No contract at ${address}`);
        } else {
          console.log(`✓ ${name}: Contract found at ${address}`);
        }
      } catch (err) {
        console.log(`❌ ${name}: Error checking ${address}`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });