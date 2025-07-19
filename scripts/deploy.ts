import hre from "hardhat";
import { formatEther, parseEther } from "viem";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();
  
  console.log("Deploying contracts with account:", deployer.account.address);
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("Account balance:", formatEther(balance));

  console.log("\n=== Deploying Mock Tokens ===");
  
  const tokenA = await hre.viem.deployContract("MockERC20", [
    "RSK Token A", 
    "RTKA", 
    parseEther("1000000")
  ]);
  console.log("Token A deployed to:", tokenA.address);

  const tokenB = await hre.viem.deployContract("MockERC20", [
    "RSK Token B", 
    "RTKB", 
    parseEther("1000000")
  ]);
  console.log("Token B deployed to:", tokenB.address);

  console.log("\n=== Deploying RSKAMM ===");
  const rskAMM = await hre.viem.deployContract("RSKAMM", [
    tokenA.address,
    tokenB.address
  ]);
  console.log("RSKAMM deployed to:", rskAMM.address);

  console.log("\n=== Deploying RSKAtomicSwap ===");
  const atomicSwap = await hre.viem.deployContract("RSKAtomicSwap", []);
  console.log("RSKAtomicSwap deployed to:", atomicSwap.address);

  console.log("\n=== Seeding AMM with Initial Liquidity ===");
  const liquidityAmountA = parseEther("1000");
  const liquidityAmountB = parseEther("2000");

  await tokenA.write.approve([rskAMM.address, liquidityAmountA]);
  await tokenB.write.approve([rskAMM.address, liquidityAmountB]);

  await rskAMM.write.addLiquidity([liquidityAmountA, liquidityAmountB]);
  console.log("Initial liquidity added: 1000 RTKA, 2000 RTKB");

  const [reserveA, reserveB, totalLiquidity] = await Promise.all([
    rskAMM.read.reserveA() as Promise<bigint>,
    rskAMM.read.reserveB() as Promise<bigint>,
    rskAMM.read.totalLiquidity() as Promise<bigint>
  ]);

  console.log("\n=== Deployment Summary ===");
  console.log("Token A (RTKA):", tokenA.address);
  console.log("Token B (RTKB):", tokenB.address);
  console.log("RSKAMM:", rskAMM.address);
  console.log("RSKAtomicSwap:", atomicSwap.address);
  console.log("Reserve A:", formatEther(reserveA));
  console.log("Reserve B:", formatEther(reserveB));
  console.log("Total Liquidity:", formatEther(totalLiquidity));

  console.log("\n=== Next Steps ===");
  console.log("1. Update your .env file with the deployed addresses");
  console.log("2. Run tests: npm test");
  console.log("3. Try swapping tokens using the AMM functions");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});