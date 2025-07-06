pragma solidity ^0.8.0;  

contract RSKAMM {
    address public tokenA;
    address public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public constant FEE = 30; // 0.3% fee  

    constructor(address _tokenA, address _tokenB) {
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function swap(uint256 amountAIn) external {
        uint256 amountBOut = (amountAIn * reserveB) / (reserveA + amountAIn);
        uint256 fee = (amountBOut * FEE) / 10000;  
        amountBOut -= fee;

        // Transfer logic here (simplified for brevity)
        reserveA += amountAIn;
        reserveB -= amountBOut;
    }
}