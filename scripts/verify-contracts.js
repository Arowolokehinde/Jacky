import hre from "hardhat";

async function main() {
  console.log("🔍 Starting contract verification on Mantle Sepolia...\n");

  // Contract addresses from your successful deployment
  const contracts = {
    SimpleActionHub: "0xe9eC4BcB98f9240f6CfE37693A19b310F9A71E95",
    MNTTransferExecutor: "0x991a8F634ED1d64C13848F575867f3740806ae2D",
    SimpleDEXAggregator: "0x1b667C35aFbAD54E64520B9BEF8E68Da123c2a74",
    SimpleYieldFarmer: "0xB0d09d7b72fdcF1ce30a8F7A0FA87aBbB9C44d6D",
    SimpleChainlinkAnalyzer: "0x2b3AbFD1D90694e8eFeB0840e4ff1ce2bCf429d2"
  };

  // Verify each contract
  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`📋 Verifying ${name} at ${address}...`);
      
      if (name === "SimpleChainlinkAnalyzer") {
        // SimpleChainlinkAnalyzer has no constructor parameters
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: []
        });
      } else {
        // Other contracts have no constructor parameters
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: []
        });
      }
      
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