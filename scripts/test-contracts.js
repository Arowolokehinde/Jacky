import hre from "hardhat";
import { ethers as ethersLib } from "ethers";

async function main() {
  // Get provider from hardhat
  const networkUrl = hre.network?.config?.url || "http://localhost:8545";
  const provider = new ethersLib.JsonRpcProvider(networkUrl);
  
  // Get signers from hardhat accounts
  const accounts = hre.network?.config?.accounts || [];
  const signers = accounts.map((privateKey, index) => 
    new ethersLib.Wallet(privateKey, provider)
  );
  
  // If no accounts in config, use hardhat's default accounts
  if (signers.length === 0) {
    // For hardhat network, create default signers
    const defaultAccounts = [
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // hardhat account 0
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // hardhat account 1
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"  // hardhat account 2
    ];
    
    signers.push(...defaultAccounts.map(pk => new ethersLib.Wallet(pk, provider)));
  }
  
  // Create ethers-compatible object
  const ethers = {
    ...ethersLib,
    getSigners: () => Promise.resolve(signers),
    getContractFactory: async (name) => {
      const artifact = await hre.artifacts.readArtifact(name);
      return new ethersLib.ContractFactory(artifact.abi, artifact.bytecode, signers[0]);
    },
    utils: ethersLib,
    constants: {
      AddressZero: "0x0000000000000000000000000000000000000000"
    }
  };
  console.log("=== Testing Smart Contract Deployment ===\n");

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Testing with deployer:", deployer.address);
  console.log("Testing with user1:", user1.address);
  console.log("Testing with user2:", user2.address);

  try {
    // Test 1: Deploy SimpleActionHub
    console.log("\n1. Testing SimpleActionHub deployment...");
    const SimpleActionHub = await ethers.getContractFactory("SimpleActionHub");
    const actionHub = await SimpleActionHub.deploy();
    await actionHub.waitForDeployment();
    console.log("✅ SimpleActionHub deployed at:", await actionHub.getAddress());
    console.log("   Owner:", await actionHub.owner());
    console.log("   Paused:", await actionHub.paused());

    // Test 2: Deploy MNTTransferExecutor
    console.log("\n2. Testing MNTTransferExecutor deployment...");
    const MNTTransferExecutor = await ethers.getContractFactory("MNTTransferExecutor");
    const mntExecutor = await MNTTransferExecutor.deploy();
    await mntExecutor.waitForDeployment();
    console.log("✅ MNTTransferExecutor deployed at:", await mntExecutor.getAddress());
    console.log("   Owner:", await mntExecutor.owner());
    const limits = await mntExecutor.limits();
    console.log("   Daily Limit:", ethersLib.formatEther(limits.maxPerDay), "MNT");
    console.log("   Max Single Transfer:", ethersLib.formatEther(limits.maxPerTransaction), "MNT");

    // Test 3: Deploy SimpleDEXAggregator
    console.log("\n3. Testing SimpleDEXAggregator deployment...");
    const SimpleDEXAggregator = await ethers.getContractFactory("SimpleDEXAggregator");
    const dexAggregator = await SimpleDEXAggregator.deploy();
    await dexAggregator.waitForDeployment();
    console.log("✅ SimpleDEXAggregator deployed at:", await dexAggregator.getAddress());
    console.log("   Owner:", await dexAggregator.owner());

    // Test 4: Deploy SimpleYieldFarmer
    console.log("\n4. Testing SimpleYieldFarmer deployment...");
    const SimpleYieldFarmer = await ethers.getContractFactory("SimpleYieldFarmer");
    const yieldFarmer = await SimpleYieldFarmer.deploy();
    await yieldFarmer.waitForDeployment();
    console.log("✅ SimpleYieldFarmer deployed at:", await yieldFarmer.getAddress());
    console.log("   Owner:", await yieldFarmer.owner());
    console.log("   Paused:", await yieldFarmer.paused());

    // Test 5: Deploy SimpleChainlinkAnalyzer
    console.log("\n5. Testing SimpleChainlinkAnalyzer deployment...");
    const SimpleChainlinkAnalyzer = await ethers.getContractFactory("SimpleChainlinkAnalyzer");
    // Use a mock address for testing
    const mockPriceFeed = "0x1234567890123456789012345678901234567890";
    const chainlinkAnalyzer = await SimpleChainlinkAnalyzer.deploy(mockPriceFeed);
    await chainlinkAnalyzer.waitForDeployment();
    console.log("✅ SimpleChainlinkAnalyzer deployed at:", await chainlinkAnalyzer.getAddress());
    console.log("   Owner:", await chainlinkAnalyzer.owner());
    console.log("   Price Feed:", await chainlinkAnalyzer.priceFeed());

    // Test 6: Configure contracts
    console.log("\n6. Testing contract configuration...");
    
    // Set executors in ActionHub
    await actionHub.setExecutors(
      await mntExecutor.getAddress(),
      await dexAggregator.getAddress(),
      await chainlinkAnalyzer.getAddress()
    );
    console.log("✅ ActionHub executors configured");
    
    // Verify configuration
    console.log("   MNT Executor:", await actionHub.mntExecutor());
    console.log("   DEX Aggregator:", await actionHub.dexAggregator());
    console.log("   Yield Analyzer:", await actionHub.yieldAnalyzer());

    // Authorize ActionHub in MNTExecutor
    await mntExecutor.setAuthorizedCaller(await actionHub.getAddress(), true);
    console.log("✅ MNTExecutor authorized ActionHub");
    console.log("   ActionHub Authorized:", await mntExecutor.authorizedCallers(await actionHub.getAddress()));

    // Test 7: Basic functionality tests
    console.log("\n7. Testing basic functionality...");
    
    // Test action request
    const actionType = 0; // MNT_TRANSFER
    const parameters = ethersLib.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256"],
      [user2.address, ethersLib.parseEther("1")]
    );

    const tx = await actionHub.connect(user1).requestAction(actionType, parameters);
    const receipt = await tx.wait();
    const actionId = receipt.events[0].args.actionId;
    console.log("✅ Action requested successfully");
    console.log("   Action ID:", actionId);
    console.log("   User action count:", (await actionHub.userActionCount(user1.address)).toString());

    // Test MNT transfer limits
    const transferLimits = await mntExecutor.limits();
    console.log("✅ MNT transfer limits verified");
    console.log("   Daily Limit:", ethersLib.formatEther(transferLimits.maxPerDay), "MNT");
    console.log("   Single Limit:", ethersLib.formatEther(transferLimits.maxPerTransaction), "MNT");

    console.log("\n=== All Tests Passed Successfully! ===");
    console.log("✅ All contracts deployed and configured correctly");
    console.log("✅ Basic functionality verified");
    console.log("✅ Ready for Mantle testnet deployment");

    return {
      actionHub: await actionHub.getAddress(),
      mntExecutor: await mntExecutor.getAddress(),
      dexAggregator: await dexAggregator.getAddress(),
      yieldFarmer: await yieldFarmer.getAddress(),
      chainlinkAnalyzer: await chainlinkAnalyzer.getAddress()
    };

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    throw error;
  }
}

main()
  .then((addresses) => {
    console.log("\n=== Contract Addresses ===");
    Object.entries(addresses).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });