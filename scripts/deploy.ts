import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const RSKAMM = await ethers.getContractFactory("RSKAMM");
  const rskAMM = await RSKAMM.deploy(
    "0xTokenAAddress", 
    "0xTokenBAddress"
  );

  await rskAMM.waitForDeployment();
  console.log("RSKAMM deployed to:", await rskAMM.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});