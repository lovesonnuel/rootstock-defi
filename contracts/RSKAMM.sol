pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RSKAMM is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalLiquidity;
    
    uint256 private constant FEE_BASIS_POINTS = 30; // 0.3% fee
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MINIMUM_LIQUIDITY = 1000;

    mapping(address => uint256) public liquidityOf;

    event Swap(address indexed user, address tokenIn, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed provider, uint256 liquidityMinted);
    event LiquidityRemoved(address indexed provider, uint256 liquidityBurned);

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token addresses");
        require(_tokenA != _tokenB, "Identical tokens");
        
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function addLiquidity(uint256 amountADesired, uint256 amountBDesired, uint256 minLiquidity) 
        external 
        nonReentrant 
        returns (uint256 liquidity) 
    {
        require(amountADesired > 0 && amountBDesired > 0, "Insufficient amounts");

        uint256 amountA;
        uint256 amountB;

        if (totalLiquidity == 0) {
            amountA = amountADesired;
            amountB = amountBDesired;
            liquidity = _sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            require(liquidity > 0, "Insufficient liquidity minted");
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
            liquidity = _min((amountA * totalLiquidity) / reserveA, (amountB * totalLiquidity) / reserveB);
        }

        require(liquidity >= minLiquidity, "Insufficient liquidity received");

        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);

        reserveA += amountA;
        reserveB += amountB;
        totalLiquidity += liquidity;
        liquidityOf[msg.sender] += liquidity;

        emit LiquidityAdded(msg.sender, liquidity);
    }

    function removeLiquidity(uint256 liquidity) 
        external 
        nonReentrant 
        returns (uint256 amountA, uint256 amountB) 
    {
        require(liquidity > 0, "Insufficient liquidity");
        require(liquidityOf[msg.sender] >= liquidity, "Insufficient liquidity balance");

        amountA = (liquidity * reserveA) / totalLiquidity;
        amountB = (liquidity * reserveB) / totalLiquidity;

        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");

        liquidityOf[msg.sender] -= liquidity;
        totalLiquidity -= liquidity;
        reserveA -= amountA;
        reserveB -= amountB;

        tokenA.safeTransfer(msg.sender, amountA);
        tokenB.safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, liquidity);
    }

    function swapAForB(uint256 amountAIn) external nonReentrant {
        require(amountAIn > 0, "Insufficient input amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");

        uint256 amountBOut = _getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut > 0, "Insufficient output amount");

        tokenA.safeTransferFrom(msg.sender, address(this), amountAIn);
        tokenB.safeTransfer(msg.sender, amountBOut);

        reserveA += amountAIn;
        reserveB -= amountBOut;

        emit Swap(msg.sender, address(tokenA), amountAIn, amountBOut);
    }

    function swapBForA(uint256 amountBIn) external nonReentrant {
        require(amountBIn > 0, "Insufficient input amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");

        uint256 amountAOut = _getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut > 0, "Insufficient output amount");

        tokenB.safeTransferFrom(msg.sender, address(this), amountBIn);
        tokenA.safeTransfer(msg.sender, amountAOut);

        reserveB += amountBIn;
        reserveA -= amountAOut;

        emit Swap(msg.sender, address(tokenB), amountBIn, amountAOut);
    }

    function getAmountOut(uint256 amountIn, bool isTokenA) external view returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        if (isTokenA) {
            return _getAmountOut(amountIn, reserveA, reserveB);
        } else {
            return _getAmountOut(amountIn, reserveB, reserveA);
        }
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        private 
        pure 
        returns (uint256) 
    {
        uint256 amountInWithFee = amountIn * (BASIS_POINTS - FEE_BASIS_POINTS);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * BASIS_POINTS) + amountInWithFee;
        return numerator / denominator;
    }

    function _sqrt(uint256 x) private pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}