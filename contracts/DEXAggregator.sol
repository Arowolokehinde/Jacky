// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Simple interfaces for Mantle DEXs
interface IAgniRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external view returns (uint256[] memory amounts);
}

interface IFusionXRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external view returns (uint256[] memory amounts);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title SimpleDEXAggregator
 * @dev Essential token swap functionality for Franky AI on Mantle
 */
contract DEXAggregator {
    
    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        address recipient;
        string preferredDEX; // "agni" or "fusionx"
    }

    // State variables
    address public owner;
    address public agniRouter;
    address public fusionXRouter;
    
    // Events
    event SwapExecuted(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        string dexUsed
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Set DEX router addresses
     */
    function setRouters(address _agniRouter, address _fusionXRouter) external onlyOwner {
        agniRouter = _agniRouter;
        fusionXRouter = _fusionXRouter;
    }

    /**
     * @dev Execute token swap
     */
    function executeSwap(SwapParams calldata params) external returns (uint256 amountOut) {
        require(params.tokenIn != params.tokenOut, "Same token");
        require(params.amountIn > 0, "Invalid amount");
        require(params.recipient != address(0), "Invalid recipient");

        // Transfer tokens from user
        IERC20(params.tokenIn).transferFrom(params.recipient, address(this), params.amountIn);
        
        // Choose router
        address router;
        string memory dexUsed;
        
        if (_isEqual(params.preferredDEX, "agni") && agniRouter != address(0)) {
            router = agniRouter;
            dexUsed = "agni";
        } else if (_isEqual(params.preferredDEX, "fusionx") && fusionXRouter != address(0)) {
            router = fusionXRouter;
            dexUsed = "fusionx";
        } else {
            // Auto-select best route
            (router, dexUsed) = _getBestRouter(params.tokenIn, params.tokenOut, params.amountIn);
        }
        
        require(router != address(0), "No router available");
        
        // Approve and execute swap
        IERC20(params.tokenIn).approve(router, params.amountIn);
        
        address[] memory path = new address[](2);
        path[0] = params.tokenIn;
        path[1] = params.tokenOut;
        
        uint256[] memory amounts;
        if (_isEqual(dexUsed, "agni")) {
            amounts = IAgniRouter(router).swapExactTokensForTokens(
                params.amountIn,
                params.amountOutMin,
                path,
                params.recipient,
                block.timestamp + 300
            );
        } else {
            amounts = IFusionXRouter(router).swapExactTokensForTokens(
                params.amountIn,
                params.amountOutMin,
                path,
                params.recipient,
                block.timestamp + 300
            );
        }
        
        amountOut = amounts[amounts.length - 1];
        
        emit SwapExecuted(
            params.recipient,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            dexUsed
        );
        
        return amountOut;
    }

    /**
     * @dev Get swap quote
     */
    function getSwapQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut, string memory bestDEX) {
        (address router, string memory dex) = _getBestRouter(tokenIn, tokenOut, amountIn);
        
        if (router == address(0)) return (0, "");
        
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        try IAgniRouter(router).getAmountsOut(amountIn, path) returns (uint256[] memory amounts) {
            return (amounts[amounts.length - 1], dex);
        } catch {
            return (0, "");
        }
    }

    /**
     * @dev Get best router for swap
     */
    function _getBestRouter(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (address bestRouter, string memory bestDEX) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        
        uint256 bestAmountOut = 0;
        
        // Check Agni
        if (agniRouter != address(0)) {
            try IAgniRouter(agniRouter).getAmountsOut(amountIn, path) returns (uint256[] memory amounts) {
                if (amounts[amounts.length - 1] > bestAmountOut) {
                    bestAmountOut = amounts[amounts.length - 1];
                    bestRouter = agniRouter;
                    bestDEX = "agni";
                }
            } catch {}
        }
        
        // Check FusionX
        if (fusionXRouter != address(0)) {
            try IFusionXRouter(fusionXRouter).getAmountsOut(amountIn, path) returns (uint256[] memory amounts) {
                if (amounts[amounts.length - 1] > bestAmountOut) {
                    bestAmountOut = amounts[amounts.length - 1];
                    bestRouter = fusionXRouter;
                    bestDEX = "fusionx";
                }
            } catch {}
        }
        
        return (bestRouter, bestDEX);
    }

    /**
     * @dev String comparison utility
     */
    function _isEqual(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /**
     * @dev Emergency functions
     */
    function emergencyWithdraw(address token) external onlyOwner {
        if (token == address(0)) {
            payable(owner).transfer(address(this).balance);
        } else {
            IERC20(token).transfer(owner, IERC20(token).balanceOf(address(this)));
        }
    }
}