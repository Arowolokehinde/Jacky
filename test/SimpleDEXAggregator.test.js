import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleDEXAggregator", function () {
    let dexAggregator;
    let owner;
    let user1;
    let user2;
    let mockToken1;
    let mockToken2;
    let mockAgniRouter;
    let mockFusionXRouter;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy SimpleDEXAggregator
        const SimpleDEXAggregator = await ethers.getContractFactory("SimpleDEXAggregator");
        dexAggregator = await SimpleDEXAggregator.deploy();
        await dexAggregator.deployed();

        // Deploy mock tokens
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockToken1 = await MockERC20.deploy("Token1", "TK1", ethers.utils.parseEther("1000000"));
        mockToken2 = await MockERC20.deploy("Token2", "TK2", ethers.utils.parseEther("1000000"));

        // Deploy mock routers
        const MockRouter = await ethers.getContractFactory("MockDEXRouter");
        mockAgniRouter = await MockRouter.deploy();
        mockFusionXRouter = await MockRouter.deploy();

        // Set routers
        await dexAggregator.setRouters(mockAgniRouter.address, mockFusionXRouter.address);

        // Setup mock router responses
        await mockAgniRouter.setAmountsOut([ethers.utils.parseEther("100"), ethers.utils.parseEther("95")]);
        await mockFusionXRouter.setAmountsOut([ethers.utils.parseEther("100"), ethers.utils.parseEther("98")]);

        // Give user1 some tokens
        await mockToken1.transfer(user1.address, ethers.utils.parseEther("1000"));
        await mockToken2.transfer(user1.address, ethers.utils.parseEther("1000"));
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await dexAggregator.owner()).to.equal(owner.address);
        });

        it("Should have no routers initially", async function () {
            const newAggregator = await (await ethers.getContractFactory("SimpleDEXAggregator")).deploy();
            expect(await newAggregator.agniRouter()).to.equal(ethers.constants.AddressZero);
            expect(await newAggregator.fusionXRouter()).to.equal(ethers.constants.AddressZero);
        });
    });

    describe("Router Management", function () {
        it("Should allow owner to set routers", async function () {
            await dexAggregator.setRouters(user1.address, user2.address);
            expect(await dexAggregator.agniRouter()).to.equal(user1.address);
            expect(await dexAggregator.fusionXRouter()).to.equal(user2.address);
        });

        it("Should not allow non-owner to set routers", async function () {
            await expect(
                dexAggregator.connect(user1).setRouters(user1.address, user2.address)
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("Token Swaps", function () {
        beforeEach(async function () {
            // Approve aggregator to spend user tokens
            await mockToken1.connect(user1).approve(dexAggregator.address, ethers.utils.parseEther("1000"));
        });

        it("Should execute swap with preferred DEX (Agni)", async function () {
            const swapParams = {
                tokenIn: mockToken1.address,
                tokenOut: mockToken2.address,
                amountIn: ethers.utils.parseEther("100"),
                amountOutMin: ethers.utils.parseEther("90"),
                recipient: user1.address,
                preferredDEX: "agni"
            };

            const tx = await dexAggregator.connect(user1).executeSwap(swapParams);
            const receipt = await tx.wait();

            // Check event emission
            const event = receipt.events.find(e => e.event === "SwapExecuted");
            expect(event).to.not.be.undefined;
            expect(event.args.tokenIn).to.equal(mockToken1.address);
            expect(event.args.tokenOut).to.equal(mockToken2.address);
            expect(event.args.dexUsed).to.equal("agni");
        });

        it("Should execute swap with preferred DEX (FusionX)", async function () {
            const swapParams = {
                tokenIn: mockToken1.address,
                tokenOut: mockToken2.address,
                amountIn: ethers.utils.parseEther("100"),
                amountOutMin: ethers.utils.parseEther("90"),
                recipient: user1.address,
                preferredDEX: "fusionx"
            };

            const tx = await dexAggregator.connect(user1).executeSwap(swapParams);
            const receipt = await tx.wait();

            const event = receipt.events.find(e => e.event === "SwapExecuted");
            expect(event.args.dexUsed).to.equal("fusionx");
        });

        it("Should auto-select best router when no preference", async function () {
            // FusionX offers better rate (98 vs 95)
            const swapParams = {
                tokenIn: mockToken1.address,
                tokenOut: mockToken2.address,
                amountIn: ethers.utils.parseEther("100"),
                amountOutMin: ethers.utils.parseEther("90"),
                recipient: user1.address,
                preferredDEX: ""
            };

            const tx = await dexAggregator.connect(user1).executeSwap(swapParams);
            const receipt = await tx.wait();

            const event = receipt.events.find(e => e.event === "SwapExecuted");
            expect(event.args.dexUsed).to.equal("fusionx"); // Should pick better rate
        });

        it("Should revert if same token swap", async function () {
            const swapParams = {
                tokenIn: mockToken1.address,
                tokenOut: mockToken1.address,
                amountIn: ethers.utils.parseEther("100"),
                amountOutMin: ethers.utils.parseEther("90"),
                recipient: user1.address,
                preferredDEX: "agni"
            };

            await expect(
                dexAggregator.connect(user1).executeSwap(swapParams)
            ).to.be.revertedWith("Same token");
        });

        it("Should revert if invalid amount", async function () {
            const swapParams = {
                tokenIn: mockToken1.address,
                tokenOut: mockToken2.address,
                amountIn: 0,
                amountOutMin: ethers.utils.parseEther("90"),
                recipient: user1.address,
                preferredDEX: "agni"
            };

            await expect(
                dexAggregator.connect(user1).executeSwap(swapParams)
            ).to.be.revertedWith("Invalid amount");
        });

        it("Should revert if invalid recipient", async function () {
            const swapParams = {
                tokenIn: mockToken1.address,
                tokenOut: mockToken2.address,
                amountIn: ethers.utils.parseEther("100"),
                amountOutMin: ethers.utils.parseEther("90"),
                recipient: ethers.constants.AddressZero,
                preferredDEX: "agni"
            };

            await expect(
                dexAggregator.connect(user1).executeSwap(swapParams)
            ).to.be.revertedWith("Invalid recipient");
        });

        it("Should revert if no router available", async function () {
            // Clear routers
            await dexAggregator.setRouters(ethers.constants.AddressZero, ethers.constants.AddressZero);

            const swapParams = {
                tokenIn: mockToken1.address,
                tokenOut: mockToken2.address,
                amountIn: ethers.utils.parseEther("100"),
                amountOutMin: ethers.utils.parseEther("90"),
                recipient: user1.address,
                preferredDEX: "agni"
            };

            await expect(
                dexAggregator.connect(user1).executeSwap(swapParams)
            ).to.be.revertedWith("No router available");
        });

        it("Should return correct amount out", async function () {
            const swapParams = {
                tokenIn: mockToken1.address,
                tokenOut: mockToken2.address,
                amountIn: ethers.utils.parseEther("100"),
                amountOutMin: ethers.utils.parseEther("90"),
                recipient: user1.address,
                preferredDEX: "fusionx"
            };

            const amountOut = await dexAggregator.connect(user1).callStatic.executeSwap(swapParams);
            expect(amountOut).to.equal(ethers.utils.parseEther("98")); // Mock returns 98
        });
    });

    describe("Swap Quotes", function () {
        it("Should return quote from best router", async function () {
            const [amountOut, bestDEX] = await dexAggregator.getSwapQuote(
                mockToken1.address,
                mockToken2.address,
                ethers.utils.parseEther("100")
            );

            expect(amountOut).to.equal(ethers.utils.parseEther("98")); // FusionX is better
            expect(bestDEX).to.equal("fusionx");
        });

        it("Should return zero quote if no routers", async function () {
            await dexAggregator.setRouters(ethers.constants.AddressZero, ethers.constants.AddressZero);

            const [amountOut, bestDEX] = await dexAggregator.getSwapQuote(
                mockToken1.address,
                mockToken2.address,
                ethers.utils.parseEther("100")
            );

            expect(amountOut).to.equal(0);
            expect(bestDEX).to.equal("");
        });

        it("Should handle router failures gracefully", async function () {
            // Set up one router to fail
            await mockAgniRouter.setShouldFail(true);

            const [amountOut, bestDEX] = await dexAggregator.getSwapQuote(
                mockToken1.address,
                mockToken2.address,
                ethers.utils.parseEther("100")
            );

            expect(amountOut).to.equal(ethers.utils.parseEther("98")); // Should still get FusionX quote
            expect(bestDEX).to.equal("fusionx");
        });
    });

    describe("Emergency Functions", function () {
        beforeEach(async function () {
            // Send some tokens to the contract
            await mockToken1.transfer(dexAggregator.address, ethers.utils.parseEther("100"));
            
            // Send some ETH to the contract
            await owner.sendTransaction({
                to: dexAggregator.address,
                value: ethers.utils.parseEther("1")
            });
        });

        it("Should allow owner to emergency withdraw tokens", async function () {
            const initialBalance = await mockToken1.balanceOf(owner.address);
            
            await dexAggregator.emergencyWithdraw(mockToken1.address);
            
            const finalBalance = await mockToken1.balanceOf(owner.address);
            expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("100"));
        });

        it("Should allow owner to emergency withdraw ETH", async function () {
            const initialBalance = await owner.getBalance();
            
            const tx = await dexAggregator.emergencyWithdraw(ethers.constants.AddressZero);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            
            const finalBalance = await owner.getBalance();
            expect(finalBalance).to.be.above(initialBalance.sub(gasUsed));
        });

        it("Should not allow non-owner to emergency withdraw", async function () {
            await expect(
                dexAggregator.connect(user1).emergencyWithdraw(mockToken1.address)
            ).to.be.revertedWith("Not owner");
        });
    });
});