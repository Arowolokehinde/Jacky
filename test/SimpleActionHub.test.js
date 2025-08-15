import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleActionHub", function () {
    let actionHub;
    let owner;
    let user1;
    let user2;
    let mockMNTExecutor;
    let mockDEXAggregator;
    let mockYieldAnalyzer;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy SimpleActionHub
        const SimpleActionHub = await ethers.getContractFactory("SimpleActionHub");
        actionHub = await SimpleActionHub.deploy();
        await actionHub.deployed();

        // Deploy mock contracts for testing
        const MockContract = await ethers.getContractFactory("MockExecutor");
        mockMNTExecutor = await MockContract.deploy();
        mockDEXAggregator = await MockContract.deploy();
        mockYieldAnalyzer = await MockContract.deploy();

        // Set executors
        await actionHub.setExecutors(
            mockMNTExecutor.address,
            mockDEXAggregator.address,
            mockYieldAnalyzer.address
        );
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await actionHub.owner()).to.equal(owner.address);
        });

        it("Should not be paused initially", async function () {
            expect(await actionHub.paused()).to.equal(false);
        });
    });

    describe("Executor Management", function () {
        it("Should allow owner to set executors", async function () {
            const newExecutor = user1.address;
            await actionHub.setExecutors(newExecutor, newExecutor, newExecutor);
            
            expect(await actionHub.mntExecutor()).to.equal(newExecutor);
            expect(await actionHub.dexAggregator()).to.equal(newExecutor);
            expect(await actionHub.yieldAnalyzer()).to.equal(newExecutor);
        });

        it("Should not allow non-owner to set executors", async function () {
            await expect(
                actionHub.connect(user1).setExecutors(user1.address, user1.address, user1.address)
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("Action Requests", function () {
        it("Should create action request successfully", async function () {
            const actionType = 0; // MNT_TRANSFER
            const parameters = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [user2.address, ethers.utils.parseEther("1")]
            );

            const tx = await actionHub.connect(user1).requestAction(actionType, parameters);
            const receipt = await tx.wait();
            
            // Check event emission
            const event = receipt.events.find(e => e.event === "ActionRequested");
            expect(event).to.not.be.undefined;
            expect(event.args.actionType).to.equal(actionType);
            expect(event.args.user).to.equal(user1.address);

            // Check user action count increased
            expect(await actionHub.userActionCount(user1.address)).to.equal(1);
        });

        it("Should not allow action request when paused", async function () {
            await actionHub.pause();
            
            const actionType = 0;
            const parameters = "0x";
            
            await expect(
                actionHub.connect(user1).requestAction(actionType, parameters)
            ).to.be.revertedWith("Paused");
        });

        it("Should generate unique action IDs", async function () {
            const actionType = 0;
            const parameters = "0x";

            const tx1 = await actionHub.connect(user1).requestAction(actionType, parameters);
            const receipt1 = await tx1.wait();
            const actionId1 = receipt1.events[0].args.actionId;

            const tx2 = await actionHub.connect(user1).requestAction(actionType, parameters);
            const receipt2 = await tx2.wait();
            const actionId2 = receipt2.events[0].args.actionId;

            expect(actionId1).to.not.equal(actionId2);
        });
    });

    describe("Action Execution", function () {
        let actionId;
        
        beforeEach(async function () {
            const actionType = 0; // MNT_TRANSFER
            const parameters = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [user2.address, ethers.utils.parseEther("1")]
            );

            const tx = await actionHub.connect(user1).requestAction(actionType, parameters);
            const receipt = await tx.wait();
            actionId = receipt.events[0].args.actionId;
        });

        it("Should execute action successfully", async function () {
            // Fund the action hub for MNT transfer
            await owner.sendTransaction({
                to: actionHub.address,
                value: ethers.utils.parseEther("2")
            });

            const tx = await actionHub.connect(user1).executeAction(actionId);
            const receipt = await tx.wait();
            
            // Check event emission
            const event = receipt.events.find(e => e.event === "ActionExecuted");
            expect(event).to.not.be.undefined;
            expect(event.args.actionId).to.equal(actionId);
        });

        it("Should not allow non-initiator to execute action", async function () {
            await expect(
                actionHub.connect(user2).executeAction(actionId)
            ).to.be.revertedWith("Not initiator");
        });

        it("Should not allow execution when paused", async function () {
            await actionHub.pause();
            
            await expect(
                actionHub.connect(user1).executeAction(actionId)
            ).to.be.revertedWith("Paused");
        });

        it("Should not allow double execution", async function () {
            // Fund the action hub
            await owner.sendTransaction({
                to: actionHub.address,
                value: ethers.utils.parseEther("2")
            });

            await actionHub.connect(user1).executeAction(actionId);
            
            await expect(
                actionHub.connect(user1).executeAction(actionId)
            ).to.be.revertedWith("Already executed");
        });

        it("Should not allow execution of expired action", async function () {
            // Fast forward time by more than 1 hour
            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine");
            
            await expect(
                actionHub.connect(user1).executeAction(actionId)
            ).to.be.revertedWith("Expired");
        });
    });

    describe("Pause/Unpause", function () {
        it("Should allow owner to pause", async function () {
            await actionHub.pause();
            expect(await actionHub.paused()).to.equal(true);
        });

        it("Should allow owner to unpause", async function () {
            await actionHub.pause();
            await actionHub.unpause();
            expect(await actionHub.paused()).to.equal(false);
        });

        it("Should not allow non-owner to pause", async function () {
            await expect(
                actionHub.connect(user1).pause()
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow owner to emergency withdraw", async function () {
            // Send some ETH to contract
            await owner.sendTransaction({
                to: actionHub.address,
                value: ethers.utils.parseEther("1")
            });

            const initialBalance = await owner.getBalance();
            const tx = await actionHub.emergencyWithdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            
            const finalBalance = await owner.getBalance();
            expect(finalBalance).to.be.above(initialBalance.sub(gasUsed));
        });

        it("Should not allow non-owner to emergency withdraw", async function () {
            await expect(
                actionHub.connect(user1).emergencyWithdraw()
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("Receive Function", function () {
        it("Should accept ETH transfers", async function () {
            const amount = ethers.utils.parseEther("1");
            
            await expect(
                owner.sendTransaction({
                    to: actionHub.address,
                    value: amount
                })
            ).to.not.be.reverted;
            
            expect(await ethers.provider.getBalance(actionHub.address)).to.equal(amount);
        });
    });
});