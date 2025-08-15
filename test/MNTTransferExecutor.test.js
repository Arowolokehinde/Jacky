import { expect } from "chai";
import { ethers } from "hardhat";

describe("MNTTransferExecutor", function () {
    let mntExecutor;
    let owner;
    let user1;
    let user2;
    let actionHub;

    beforeEach(async function () {
        [owner, user1, user2, actionHub] = await ethers.getSigners();

        // Deploy MNTTransferExecutor
        const MNTTransferExecutor = await ethers.getContractFactory("MNTTransferExecutor");
        mntExecutor = await MNTTransferExecutor.deploy();
        await mntExecutor.deployed();

        // Authorize action hub
        await mntExecutor.setAuthorizedCaller(actionHub.address, true);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await mntExecutor.owner()).to.equal(owner.address);
        });

        it("Should have correct initial limits", async function () {
            expect(await mntExecutor.dailyLimit()).to.equal(ethers.utils.parseEther("10000"));
            expect(await mntExecutor.maxSingleTransfer()).to.equal(ethers.utils.parseEther("1000"));
        });
    });

    describe("Authorization", function () {
        it("Should allow owner to authorize callers", async function () {
            await mntExecutor.setAuthorizedCaller(user1.address, true);
            expect(await mntExecutor.authorizedCallers(user1.address)).to.equal(true);
        });

        it("Should allow owner to revoke authorization", async function () {
            await mntExecutor.setAuthorizedCaller(user1.address, true);
            await mntExecutor.setAuthorizedCaller(user1.address, false);
            expect(await mntExecutor.authorizedCallers(user1.address)).to.equal(false);
        });

        it("Should not allow non-owner to authorize callers", async function () {
            await expect(
                mntExecutor.connect(user1).setAuthorizedCaller(user2.address, true)
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("MNT Transfers", function () {
        beforeEach(async function () {
            // Fund the contract
            await owner.sendTransaction({
                to: mntExecutor.address,
                value: ethers.utils.parseEther("5000")
            });
        });

        it("Should execute valid MNT transfer", async function () {
            const amount = ethers.utils.parseEther("100");
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            const initialBalance = await user2.getBalance();
            
            await mntExecutor.connect(actionHub).transfer(
                user2.address,
                amount,
                actionId,
                { value: amount }
            );
            
            const finalBalance = await user2.getBalance();
            expect(finalBalance.sub(initialBalance)).to.equal(amount);
        });

        it("Should emit TransferExecuted event", async function () {
            const amount = ethers.utils.parseEther("100");
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            await expect(
                mntExecutor.connect(actionHub).transfer(
                    user2.address,
                    amount,
                    actionId,
                    { value: amount }
                )
            ).to.emit(mntExecutor, "TransferExecuted")
             .withArgs(actionId, actionHub.address, user2.address, amount);
        });

        it("Should not allow transfers above single limit", async function () {
            const amount = ethers.utils.parseEther("1001"); // Above 1000 MNT limit
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            await expect(
                mntExecutor.connect(actionHub).transfer(
                    user2.address,
                    amount,
                    actionId,
                    { value: amount }
                )
            ).to.be.revertedWith("Exceeds single transfer limit");
        });

        it("Should not allow transfers to zero address", async function () {
            const amount = ethers.utils.parseEther("100");
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            await expect(
                mntExecutor.connect(actionHub).transfer(
                    ethers.constants.AddressZero,
                    amount,
                    actionId,
                    { value: amount }
                )
            ).to.be.revertedWith("Invalid recipient");
        });

        it("Should not allow zero amount transfers", async function () {
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            await expect(
                mntExecutor.connect(actionHub).transfer(
                    user2.address,
                    0,
                    actionId
                )
            ).to.be.revertedWith("Invalid amount");
        });

        it("Should not allow unauthorized callers", async function () {
            const amount = ethers.utils.parseEther("100");
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            await expect(
                mntExecutor.connect(user1).transfer(
                    user2.address,
                    amount,
                    actionId,
                    { value: amount }
                )
            ).to.be.revertedWith("Not authorized");
        });

        it("Should track daily transfer amounts", async function () {
            const amount = ethers.utils.parseEther("500");
            const actionId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test1"));
            const actionId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test2"));
            
            await mntExecutor.connect(actionHub).transfer(
                user2.address,
                amount,
                actionId1,
                { value: amount }
            );
            
            const today = Math.floor(Date.now() / 86400000); // Days since epoch
            expect(await mntExecutor.dailyTransfers(today)).to.equal(amount);
            
            await mntExecutor.connect(actionHub).transfer(
                user2.address,
                amount,
                actionId2,
                { value: amount }
            );
            
            expect(await mntExecutor.dailyTransfers(today)).to.equal(amount.mul(2));
        });

        it("Should not exceed daily limit", async function () {
            // Set a lower daily limit for testing
            await mntExecutor.updateLimits(ethers.utils.parseEther("1000"), ethers.utils.parseEther("500"));
            
            const amount = ethers.utils.parseEther("400");
            const actionId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test1"));
            const actionId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test2"));
            const actionId3 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test3"));
            
            // First transfer should succeed
            await mntExecutor.connect(actionHub).transfer(
                user2.address,
                amount,
                actionId1,
                { value: amount }
            );
            
            // Second transfer should succeed
            await mntExecutor.connect(actionHub).transfer(
                user2.address,
                amount,
                actionId2,
                { value: amount }
            );
            
            // Third transfer should fail (would exceed daily limit)
            await expect(
                mntExecutor.connect(actionHub).transfer(
                    user2.address,
                    amount,
                    actionId3,
                    { value: amount }
                )
            ).to.be.revertedWith("Exceeds daily limit");
        });
    });

    describe("Limit Management", function () {
        it("Should allow owner to update limits", async function () {
            const newDailyLimit = ethers.utils.parseEther("20000");
            const newSingleLimit = ethers.utils.parseEther("2000");
            
            await mntExecutor.updateLimits(newDailyLimit, newSingleLimit);
            
            expect(await mntExecutor.dailyLimit()).to.equal(newDailyLimit);
            expect(await mntExecutor.maxSingleTransfer()).to.equal(newSingleLimit);
        });

        it("Should not allow non-owner to update limits", async function () {
            await expect(
                mntExecutor.connect(user1).updateLimits(
                    ethers.utils.parseEther("20000"),
                    ethers.utils.parseEther("2000")
                )
            ).to.be.revertedWith("Not owner");
        });

        it("Should not allow zero limits", async function () {
            await expect(
                mntExecutor.updateLimits(0, ethers.utils.parseEther("1000"))
            ).to.be.revertedWith("Invalid limits");
            
            await expect(
                mntExecutor.updateLimits(ethers.utils.parseEther("10000"), 0)
            ).to.be.revertedWith("Invalid limits");
        });

        it("Should not allow single limit higher than daily limit", async function () {
            await expect(
                mntExecutor.updateLimits(
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("2000")
                )
            ).to.be.revertedWith("Invalid limits");
        });
    });

    describe("Emergency Functions", function () {
        beforeEach(async function () {
            // Fund the contract
            await owner.sendTransaction({
                to: mntExecutor.address,
                value: ethers.utils.parseEther("1000")
            });
        });

        it("Should allow owner to pause transfers", async function () {
            await mntExecutor.pause();
            expect(await mntExecutor.paused()).to.equal(true);
            
            const amount = ethers.utils.parseEther("100");
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            await expect(
                mntExecutor.connect(actionHub).transfer(
                    user2.address,
                    amount,
                    actionId,
                    { value: amount }
                )
            ).to.be.revertedWith("Contract paused");
        });

        it("Should allow owner to emergency withdraw", async function () {
            const initialBalance = await owner.getBalance();
            const contractBalance = await ethers.provider.getBalance(mntExecutor.address);
            
            const tx = await mntExecutor.emergencyWithdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            
            const finalBalance = await owner.getBalance();
            expect(finalBalance).to.be.above(initialBalance.add(contractBalance).sub(gasUsed).sub(ethers.utils.parseEther("0.01")));
        });

        it("Should not allow non-owner to emergency withdraw", async function () {
            await expect(
                mntExecutor.connect(user1).emergencyWithdraw()
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("Statistics", function () {
        it("Should track total transfers", async function () {
            const amount = ethers.utils.parseEther("100");
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            // Fund the contract
            await owner.sendTransaction({
                to: mntExecutor.address,
                value: ethers.utils.parseEther("1000")
            });
            
            const initialTotal = await mntExecutor.totalTransfers();
            
            await mntExecutor.connect(actionHub).transfer(
                user2.address,
                amount,
                actionId,
                { value: amount }
            );
            
            expect(await mntExecutor.totalTransfers()).to.equal(initialTotal.add(amount));
        });

        it("Should track user transfer counts", async function () {
            const amount = ethers.utils.parseEther("100");
            const actionId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
            
            // Fund the contract
            await owner.sendTransaction({
                to: mntExecutor.address,
                value: ethers.utils.parseEther("1000")
            });
            
            const initialCount = await mntExecutor.userTransferCounts(user2.address);
            
            await mntExecutor.connect(actionHub).transfer(
                user2.address,
                amount,
                actionId,
                { value: amount }
            );
            
            expect(await mntExecutor.userTransferCounts(user2.address)).to.equal(initialCount.add(1));
        });
    });

    describe("Receive Function", function () {
        it("Should accept ETH transfers", async function () {
            const amount = ethers.utils.parseEther("1");
            
            await expect(
                owner.sendTransaction({
                    to: mntExecutor.address,
                    value: amount
                })
            ).to.not.be.reverted;
            
            expect(await ethers.provider.getBalance(mntExecutor.address)).to.equal(amount);
        });
    });
});