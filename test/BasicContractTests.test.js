import { expect } from "chai";
import { ethers } from "hardhat";

describe("Basic Contract Functionality", function () {
    let simpleActionHub;
    let mntTransferExecutor;
    let simpleDEXAggregator;
    let simpleYieldFarmer;
    let simpleChainlinkAnalyzer;
    let owner;
    let user1;

    before(async function () {
        [owner, user1] = await ethers.getSigners();
        console.log("Testing with owner:", owner.address);
        console.log("Testing with user1:", user1.address);
    });

    describe("Contract Deployments", function () {
        it("Should deploy SimpleActionHub successfully", async function () {
            const SimpleActionHub = await ethers.getContractFactory("SimpleActionHub");
            simpleActionHub = await SimpleActionHub.deploy();
            await simpleActionHub.deployed();
            
            expect(await simpleActionHub.owner()).to.equal(owner.address);
            console.log("✅ SimpleActionHub deployed at:", simpleActionHub.address);
        });

        it("Should deploy MNTTransferExecutor successfully", async function () {
            const MNTTransferExecutor = await ethers.getContractFactory("MNTTransferExecutor");
            mntTransferExecutor = await MNTTransferExecutor.deploy();
            await mntTransferExecutor.deployed();
            
            expect(await mntTransferExecutor.owner()).to.equal(owner.address);
            console.log("✅ MNTTransferExecutor deployed at:", mntTransferExecutor.address);
        });

        it("Should deploy SimpleDEXAggregator successfully", async function () {
            const SimpleDEXAggregator = await ethers.getContractFactory("SimpleDEXAggregator");
            simpleDEXAggregator = await SimpleDEXAggregator.deploy();
            await simpleDEXAggregator.deployed();
            
            expect(await simpleDEXAggregator.owner()).to.equal(owner.address);
            console.log("✅ SimpleDEXAggregator deployed at:", simpleDEXAggregator.address);
        });

        it("Should deploy SimpleYieldFarmer successfully", async function () {
            const SimpleYieldFarmer = await ethers.getContractFactory("SimpleYieldFarmer");
            simpleYieldFarmer = await SimpleYieldFarmer.deploy();
            await simpleYieldFarmer.deployed();
            
            expect(await simpleYieldFarmer.owner()).to.equal(owner.address);
            console.log("✅ SimpleYieldFarmer deployed at:", simpleYieldFarmer.address);
        });

        it("Should deploy SimpleChainlinkAnalyzer successfully", async function () {
            const SimpleChainlinkAnalyzer = await ethers.getContractFactory("SimpleChainlinkAnalyzer");
            simpleChainlinkAnalyzer = await SimpleChainlinkAnalyzer.deploy();
            await simpleChainlinkAnalyzer.deployed();
            
            expect(await simpleChainlinkAnalyzer.owner()).to.equal(owner.address);
            console.log("✅ SimpleChainlinkAnalyzer deployed at:", simpleChainlinkAnalyzer.address);
        });
    });

    describe("Basic Integration", function () {
        it("Should connect ActionHub to executors", async function () {
            await simpleActionHub.setExecutors(
                mntTransferExecutor.address,
                simpleDEXAggregator.address,
                simpleChainlinkAnalyzer.address
            );

            expect(await simpleActionHub.mntExecutor()).to.equal(mntTransferExecutor.address);
            expect(await simpleActionHub.dexAggregator()).to.equal(simpleDEXAggregator.address);
            expect(await simpleActionHub.yieldAnalyzer()).to.equal(simpleChainlinkAnalyzer.address);
            
            console.log("✅ ActionHub connected to all executors");
        });

        it("Should authorize ActionHub in MNT executor", async function () {
            await mntTransferExecutor.setAuthorizedCaller(simpleActionHub.address, true);
            
            expect(await mntTransferExecutor.authorizedCallers(simpleActionHub.address)).to.equal(true);
            console.log("✅ ActionHub authorized in MNT executor");
        });

        it("Should get yield opportunities from Chainlink analyzer", async function () {
            const opportunities = await simpleChainlinkAnalyzer.getBestYieldOpportunities(50);
            
            expect(opportunities.length).to.be.greaterThan(0);
            console.log("✅ Retrieved", opportunities.length, "yield opportunities");
            
            // Log first opportunity
            if (opportunities.length > 0) {
                console.log("   First opportunity:", opportunities[0].protocol, "APY:", opportunities[0].apy.toString());
            }
        });

        it("Should check protocol data", async function () {
            const agniData = await simpleChainlinkAnalyzer.getProtocol("agni");
            
            expect(agniData.name).to.equal("Agni Finance");
            expect(agniData.isActive).to.equal(true);
            console.log("✅ Agni Finance protocol data:", agniData.name, "APY:", agniData.apy.toString());
        });

        it("Should test action request flow", async function () {
            // Create a test action request
            const actionType = 0; // MNT_TRANSFER
            const parameters = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [user1.address, ethers.utils.parseEther("1")]
            );

            const tx = await simpleActionHub.requestAction(actionType, parameters);
            const receipt = await tx.wait();
            
            const event = receipt.events.find(e => e.event === "ActionRequested");
            expect(event).to.not.be.undefined;
            
            console.log("✅ Action request created successfully");
            console.log("   Action ID:", event.args.actionId);
        });
    });

    describe("Contract State Verification", function () {
        it("Should verify all contracts are properly initialized", async function () {
            // Check ActionHub
            expect(await simpleActionHub.paused()).to.equal(false);
            
            // Check MNT executor limits
            expect(await mntTransferExecutor.dailyLimit()).to.equal(ethers.utils.parseEther("10000"));
            expect(await mntTransferExecutor.maxSingleTransfer()).to.equal(ethers.utils.parseEther("1000"));
            
            // Check Chainlink analyzer protocols
            const protocols = await simpleChainlinkAnalyzer.getAllProtocols();
            expect(protocols.length).to.equal(3); // agni, lendle, fusionx
            
            console.log("✅ All contracts properly initialized");
            console.log("   Tracked protocols:", protocols.length);
        });

        it("Should verify contract addresses are set correctly", async function () {
            const addresses = {
                SimpleActionHub: simpleActionHub.address,
                MNTTransferExecutor: mntTransferExecutor.address,
                SimpleDEXAggregator: simpleDEXAggregator.address,
                SimpleYieldFarmer: simpleYieldFarmer.address,
                SimpleChainlinkAnalyzer: simpleChainlinkAnalyzer.address
            };

            console.log("📋 Final Contract Addresses:");
            Object.entries(addresses).forEach(([name, address]) => {
                console.log(`   ${name}: ${address}`);
                expect(address).to.match(/^0x[a-fA-F0-9]{40}$/); // Valid address format
            });
        });
    });

    after(async function () {
        console.log("\n🎯 All tests completed successfully!");
        console.log("📦 Contracts are ready for Mantle testnet deployment");
    });
});