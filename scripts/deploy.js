import hre from "hardhat";
import { ethers } from "ethers";
import * as dotenv from 'dotenv';

// Load .env.local file
dotenv.config({ path: '.env.local' });

async function main() {
  console.log("Hardhat config networks:", Object.keys(hre.config.networks));
  console.log("Current network name:", hre.network.name);
  
  // Use hardhat config directly
  const mantleSepoliaConfig = hre.config.networks.mantleSepolia;
  if (!mantleSepoliaConfig) {
    throw new Error("mantleSepolia network not found in config");
  }
  
  // Use the hardcoded URL directly since config object is not resolving properly
  const mantleSepoliaUrl = "https://rpc.sepolia.mantle.xyz";
  console.log("Using URL:", mantleSepoliaUrl);
  const provider = new ethers.JsonRpcProvider(mantleSepoliaUrl);
  
  // Get private key from environment directly
  const privateKey = process.env.ACCOUNT_PRIVATE_KEY;
  console.log("Private key type:", typeof privateKey);
  console.log("Private key length:", privateKey?.length);
  console.log("Has private key:", !!privateKey);
  
  if (!privateKey || privateKey === "" || privateKey === "your_private_key_here") {
    throw new Error("No valid private key found. Please set ACCOUNT_PRIVATE_KEY in your .env.local file.");
  }
  
  // Create wallet
  const deployer = new ethers.Wallet(privateKey, provider);
  
  // Get current nonce to avoid nonce issues
  let currentNonce = await provider.getTransactionCount(deployer.address, "pending");
  console.log("Starting nonce:", currentNonce);
  
  // Create ethers-compatible object for contract factories with nonce management
  const ethersHelper = {
    getSigners: () => Promise.resolve([deployer]),
    getContractFactory: async (name) => {
      const artifact = await hre.artifacts.readArtifact(name);
      return new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
    }
  };
  
  // Helper function to deploy with proper nonce
  const deployWithNonce = async (factory, ...args) => {
    const contract = await factory.deploy(...args, { nonce: currentNonce });
    currentNonce++;
    await contract.waitForDeployment();
    return contract;
  };
  
  // Helper function to send transaction with proper nonce
  const sendTxWithNonce = async (contract, methodName, ...args) => {
    const tx = await contract[methodName](...args, { nonce: currentNonce });
    currentNonce++;
    return await tx.wait();
  };

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Mantle testnet Chainlink price feed addresses
  const CHAINLINK_FEED_ADDRESS = "0x4c8962833Db7206fd45671e9DC806e4FcC0dCB78"; // MNT/USD price feed

  console.log("\n1. Deploying SimpleActionHub...");
  const SimpleActionHub = await ethersHelper.getContractFactory("SimpleActionHub");
  const actionHub = await deployWithNonce(SimpleActionHub);
  console.log("SimpleActionHub deployed to:", await actionHub.getAddress());

  console.log("\n2. Deploying MNTTransferExecutor...");
  const MNTTransferExecutor = await ethersHelper.getContractFactory("MNTTransferExecutor");
  const mntExecutor = await deployWithNonce(MNTTransferExecutor);
  console.log("MNTTransferExecutor deployed to:", await mntExecutor.getAddress());

  console.log("\n3. Deploying SimpleDEXAggregator...");
  const SimpleDEXAggregator = await ethersHelper.getContractFactory("SimpleDEXAggregator");
  const dexAggregator = await deployWithNonce(SimpleDEXAggregator);
  console.log("SimpleDEXAggregator deployed to:", await dexAggregator.getAddress());

  console.log("\n4. Deploying SimpleYieldFarmer...");
  const SimpleYieldFarmer = await ethersHelper.getContractFactory("SimpleYieldFarmer");
  const yieldFarmer = await deployWithNonce(SimpleYieldFarmer);
  console.log("SimpleYieldFarmer deployed to:", await yieldFarmer.getAddress());

  console.log("\n5. Deploying SimpleChainlinkAnalyzer...");
  const SimpleChainlinkAnalyzer = await ethersHelper.getContractFactory("SimpleChainlinkAnalyzer");
  const chainlinkAnalyzer = await deployWithNonce(SimpleChainlinkAnalyzer);
  console.log("SimpleChainlinkAnalyzer deployed to:", await chainlinkAnalyzer.getAddress());
  
  // Set the price feed for MNT token
  const MNT_TOKEN_ADDRESS = "0x35578E7e8949B5a59d40704dCF6D6faEC2Fb1D17"; // MNT token on Mantle Sepolia
  console.log("Setting MNT price feed...");
  await sendTxWithNonce(chainlinkAnalyzer, "setPriceFeed", MNT_TOKEN_ADDRESS, CHAINLINK_FEED_ADDRESS);
  console.log("✓ MNT price feed configured for token:", MNT_TOKEN_ADDRESS);

  console.log("\n6. Setting up connections between contracts...");
  
  // Set executors in ActionHub
  await sendTxWithNonce(actionHub, "setExecutors", 
    await mntExecutor.getAddress(),
    await dexAggregator.getAddress(),
    await chainlinkAnalyzer.getAddress()
  );
  console.log("✓ ActionHub executors configured");

  // Authorize ActionHub to call MNTExecutor
  await sendTxWithNonce(mntExecutor, "setAuthorizedCaller", await actionHub.getAddress(), true);
  console.log("✓ MNTExecutor authorized ActionHub");

  // Set DEX routers for Mantle testnet
  // TODO: Verify these addresses are correct for Mantle Sepolia testnet
  const AGNI_ROUTER = "0x319B69888b0d11cEC22caA5034e25FfFBDc88421"; // Agni Finance (verify testnet address)
  const FUSIONX_ROUTER = "0x5989FB161568b9F133eDf5Cf6787f5597762797F"; // FusionX (from testnet transactions)
  
  await sendTxWithNonce(dexAggregator, "setRouters", AGNI_ROUTER, FUSIONX_ROUTER);
  console.log("✓ DEX routers configured");

  console.log("\n=== Deployment Summary ===");
  console.log("SimpleActionHub:", await actionHub.getAddress());
  console.log("MNTTransferExecutor:", await mntExecutor.getAddress());
  console.log("SimpleDEXAggregator:", await dexAggregator.getAddress());
  console.log("SimpleYieldFarmer:", await yieldFarmer.getAddress());
  console.log("SimpleChainlinkAnalyzer:", await chainlinkAnalyzer.getAddress());

  console.log("\n=== Configuration Status ===");
  console.log("✓ CHAINLINK_FEED_ADDRESS configured with MNT/USD price feed");
  console.log(" Update AGNI_ROUTER and FUSIONX_ROUTER with actual Mantle testnet addresses");
  console.log(" Fund MNTTransferExecutor with MNT for transfers");
  console.log("⚠ Add private key to .env.local file for testnet deployment");

  // Save deployment addresses for verification
  const deploymentInfo = {
    network: "mantleSepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      SimpleActionHub: await actionHub.getAddress(),
      MNTTransferExecutor: await mntExecutor.getAddress(),
      SimpleDEXAggregator: await dexAggregator.getAddress(),
      SimpleYieldFarmer: await yieldFarmer.getAddress(),
      SimpleChainlinkAnalyzer: await chainlinkAnalyzer.getAddress()
    },
    configuration: {
      chainlinkFeed: CHAINLINK_FEED_ADDRESS,
      agniRouter: AGNI_ROUTER,
      fusionXRouter: FUSIONX_ROUTER
    }
  };

  console.log("\n=== Deployment Complete ===");
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });