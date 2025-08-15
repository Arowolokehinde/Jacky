const hre = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification on Mantle Sepolia...\n");

  // New contract addresses from latest deployment
  const contracts = {
    ActionHub: "0x593C0cbA6a0e377d7BcB118AEeb691955db82078",
    MNTTransferExecutor: "0x59a10e9f83641e83F9761A5Cc4A7307016D3F8C0",
    DEXAggregator: "0x51649792320C676b2E38ACcfb7cD61Ab0D2a3f5A",
    YieldFarmer: "0x658988D01a0Ee07DE0C5Ac96213857351EaF13e9",
    ChainlinkAnalyzer: "0x720AAFc7B13469Af6666AF5187f7A52F19936D35"
  };

  // Verify each contract
  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`📋 Verifying ${name} at ${address}...`);
      
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: []
      });
      
      console.log(`✅ ${name} verified successfully!\n`);
      
    } catch (error) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log(`✅ ${name} already verified!\n`);
      } else {
        console.log(`❌ ${name} verification failed: ${error.message}\n`);
      }
    }
  }

  console.log("🎉 Contract verification process completed!");
  console.log("\n📍 View your contracts on Mantlescan:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`${name}: https://sepolia.mantlescan.xyz/address/${address}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });