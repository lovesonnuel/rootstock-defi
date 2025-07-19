# RSK AMM & Atomic Swap

A decentralized exchange (DEX) implementation on RSK (Rootstock) featuring an Automated Market Maker (AMM) and atomic swap functionality. Built with Hardhat, Viem, TypeScript, and OpenZeppelin contracts following Clean Code principles.

## Overview

This project implements two key DeFi primitives:

- **RSKAMM**: A constant-product AMM (x*y=k) for token swapping with 0.3% fees
- **RSKAtomicSwap**: Hash Time-Locked Contract (HTLC) for trustless atomic swaps

## Architecture

```
BTC → PowPeg → rBTC → AMM swap
```

The AMM uses the constant-product formula `x * y = k` where liquidity providers maintain the product constant while traders swap tokens. When you trade token A for token B, the amount you receive follows: `amountOut = (amountIn * reserveB) / (reserveA + amountIn)`, minus the 0.3% fee.

## Quick Start

### Prerequisites

- Node.js >= 16
- npm or yarn
- RSK testnet account with test rBTC

### Installation

```bash
git clone <your-repo-url>
cd hardhat-project
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# RSK Testnet Configuration
PRIVATE_KEY=your_private_key_here
RSK_TESTNET_URL=https://public-node.testnet.rsk.co

# Token Addresses (update with actual deployed tokens)
TOKEN_A_ADDRESS=0x...
TOKEN_B_ADDRESS=0x...
```

### Compilation

```bash
npm run compile
```

### Testing

```bash
npm test
```

### Deployment

Deploy to RSK testnet:

```bash
npm run deploy:testnet
```

Or run the deploy script directly:

```bash
npx hardhat run scripts/deploy.ts --network rskTestnet
```

## Smart Contracts

### RSKAMM.sol

Production-ready AMM with:
- ✅ SafeERC20 token transfers
- ✅ Reentrancy protection
- ✅ Liquidity management (add/remove)
- ✅ Constant-product formula with fees
- ✅ Reserve validation to prevent rug pulls
- ✅ Events for tracking

Key functions:
- `addLiquidity(amountADesired, amountBDesired)`: Add liquidity to earn fees
- `removeLiquidity(liquidity)`: Remove liquidity and claim tokens
- `swapAForB(amountAIn)`: Swap token A for token B
- `swapBForA(amountBIn)`: Swap token B for token A
- `getAmountOut(amountIn, isTokenA)`: Preview swap output

### RSKAtomicSwap.sol

HTLC implementation for atomic swaps:
- Cross-chain compatibility
- Time-locked contracts
- Hash-based secret revelation
- Trustless execution

## Network Configuration

The project is configured for RSK testnet:
- **Network**: RSK Testnet
- **RPC URL**: https://public-node.testnet.rsk.co
- **Chain ID**: 31
- **Block Explorer**: https://explorer.testnet.rsk.co

## Development

### Project Structure

```
├── contracts/          # Solidity contracts
│   ├── RSKAMM.sol      # AMM implementation
│   └── RSKAtomicSwap.sol # Atomic swap contract
├── scripts/            # Deployment scripts
├── test/              # Test files
├── hardhat.config.ts  # Hardhat configuration
└── package.json       # Dependencies and scripts
```

### Available Scripts

```bash
npm run compile      # Compile contracts
npm run test        # Run tests with Viem
npm run deploy:testnet # Deploy to RSK testnet using Viem
npm run typechain   # Generate TypeScript bindings
```

### Testing Strategy

Tests cover:
- Pool deployment and initialization
- Liquidity addition/removal
- Token swaps with fee calculation
- Edge cases and error conditions
- Gas optimization verification

## Security Features

- **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- **Safe Transfers**: SafeERC20 for all token operations
- **Input Validation**: Comprehensive require() checks
- **Reserve Validation**: Prevents zero-liquidity exploits
- **Immutable Tokens**: Token addresses set at deployment

## Gas Optimization

- Immutable variables for token addresses
- Efficient constant-product calculations
- Minimal external calls
- Optimized storage patterns

## Viem Integration

This project uses **Viem** for enhanced TypeScript support and modern Web3 development:

**Key Benefits:**
-  **Type Safety**: Full TypeScript support with inferred types
-  **Tree Shakeable**: Smaller bundle sizes
-  **Security**: Built-in protection against common Web3 vulnerabilities
-  **Developer Experience**: Better autocomplete and error handling

**Example Usage:**
```typescript
import { parseEther, formatEther } from 'viem';
import hre from 'hardhat';

// Deploy contract
const amm = await hre.viem.deployContract("RSKAMM", [tokenA, tokenB]);

// Read data
const reserves = await amm.read.reserveA();

// Write transaction 
await amm.write.swapAForB([parseEther("10")]);
```

## License

MIT License
