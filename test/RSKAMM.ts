import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";

describe("RSKAMM", function () {
  async function deployAMMFixture() {
    const [owner, user1, user2] = await hre.viem.getWalletClients();

    const tokenA = await hre.viem.deployContract("MockERC20", [
      "Token A", 
      "TKA", 
      parseEther("1000000")
    ]);
    
    const tokenB = await hre.viem.deployContract("MockERC20", [
      "Token B", 
      "TKB", 
      parseEther("1000000")
    ]);

    const amm = await hre.viem.deployContract("RSKAMM", [
      tokenA.address, 
      tokenB.address
    ]);

    await tokenA.write.transfer([user1.account.address, parseEther("10000")]);
    await tokenB.write.transfer([user1.account.address, parseEther("10000")]);
    await tokenA.write.transfer([user2.account.address, parseEther("5000")]);
    await tokenB.write.transfer([user2.account.address, parseEther("5000")]);

    return { amm, tokenA, tokenB, owner, user1, user2 };
  }

  async function deployAMMWithLiquidityFixture() {
    const { amm, tokenA, tokenB, owner, user1, user2 } = await loadFixture(deployAMMFixture);

    await tokenA.write.approve([amm.address, parseEther("1000")], {
      account: user1.account,
    });
    await tokenB.write.approve([amm.address, parseEther("1000")], {
      account: user1.account,
    });

    await amm.write.addLiquidity([
      parseEther("100"),
      parseEther("200")
    ], {
      account: user1.account,
    });

    return { amm, tokenA, tokenB, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      const { amm, tokenA, tokenB } = await loadFixture(deployAMMFixture);

      expect(await amm.read.tokenA()).to.equal(tokenA.address);
      expect(await amm.read.tokenB()).to.equal(tokenB.address);
    });

    it("Should initialize with zero reserves", async function () {
      const { amm } = await loadFixture(deployAMMFixture);

      expect(await amm.read.reserveA()).to.equal(0n);
      expect(await amm.read.reserveB()).to.equal(0n);
      expect(await amm.read.totalLiquidity()).to.equal(0n);
    });
  });

  describe("Add Liquidity", function () {
    it("Should add initial liquidity correctly", async function () {
      const { amm, tokenA, tokenB, user1 } = await loadFixture(deployAMMFixture);

      await tokenA.write.approve([amm.address, parseEther("100")], {
        account: user1.account,
      });
      await tokenB.write.approve([amm.address, parseEther("200")], {
        account: user1.account,
      });

      await amm.write.addLiquidity([
        parseEther("100"),
        parseEther("200")
      ], {
        account: user1.account,
      });

      expect(await amm.read.reserveA()).to.equal(parseEther("100"));
      expect(await amm.read.reserveB()).to.equal(parseEther("200"));
      const liquidity = await amm.read.liquidityOf([user1.account.address]) as bigint;
      expect(liquidity > 0n).to.be.true;
    });
  });

  describe("Token Swaps", function () {
    it("Should swap token A for token B", async function () {
      const { amm, tokenA, tokenB, user2 } = await loadFixture(deployAMMWithLiquidityFixture);

      const initialTokenBBalance = await tokenB.read.balanceOf([user2.account.address]) as bigint;
      const swapAmount = parseEther("10");

      await tokenA.write.approve([amm.address, swapAmount], {
        account: user2.account,
      });
      await amm.write.swapAForB([swapAmount], {
        account: user2.account,
      });

      const finalTokenBBalance = await tokenB.read.balanceOf([user2.account.address]) as bigint;
      expect(finalTokenBBalance > initialTokenBBalance).to.be.true;
    });

    it("Should calculate output amount correctly", async function () {
      const { amm } = await loadFixture(deployAMMWithLiquidityFixture);

      const amountOut = await amm.read.getAmountOut([parseEther("10"), true]) as bigint;
      expect(amountOut > 0n).to.be.true;

      const amountOutB = await amm.read.getAmountOut([parseEther("20"), false]) as bigint;
      expect(amountOutB > 0n).to.be.true;
    });
  });

  describe("Constant Product Formula", function () {
    it("Should maintain constant product invariant after swaps", async function () {
      const { amm, tokenA, user2 } = await loadFixture(deployAMMWithLiquidityFixture);

      const initialReserveA = await amm.read.reserveA() as bigint;
      const initialReserveB = await amm.read.reserveB() as bigint;
      const initialProduct = initialReserveA * initialReserveB;

      const swapAmount = parseEther("5");
      await tokenA.write.approve([amm.address, swapAmount], {
        account: user2.account,
      });
      await amm.write.swapAForB([swapAmount], {
        account: user2.account,
      });

      const finalReserveA = await amm.read.reserveA() as bigint;
      const finalReserveB = await amm.read.reserveB() as bigint;
      const finalProduct = finalReserveA * finalReserveB;

      expect(finalProduct > initialProduct).to.be.true;
    });
  });
});