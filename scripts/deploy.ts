import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  console.log("Deploying LegacyVault...");

  const LegacyVault = await ethers.getContractFactory("LegacyVault");

  const vault = await LegacyVault.deploy();

  await vault.waitForDeployment();

  const address = await vault.getAddress();

  console.log("LegacyVault deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});