import { expect } from "chai";
import hre from "hardhat";

const { ethers } = await hre.network.connect();

describe("LegacyVault", function () {

  async function deployVault() {
    const [owner, nominee, other] = await ethers.getSigners();

    const LegacyVault = await ethers.getContractFactory("LegacyVault");

    const vault = await LegacyVault.deploy();

    await vault.waitForDeployment();

    return {
      vault,
      owner,
      nominee,
      other
    };
  }

  it("should register a vault", async function () {
    const { vault, owner } = await deployVault();

    await expect(
      vault.connect(owner).registerVault()
    )
      .to.emit(vault, "VaultRegistered")
      .withArgs(owner.address);
  });

  it("should create an asset", async function () {
    const { vault, owner } = await deployVault();

    await expect(
      vault.connect(owner).createAsset(
        "Property Documents",
        "QmExampleCID123"
      )
    )
      .to.emit(vault, "AssetCreated")
      .withArgs(
        0,
        owner.address,
        "Property Documents"
      );

    const asset = await vault.getAsset(0);

    expect(asset.owner).to.equal(owner.address);
    expect(asset.name).to.equal("Property Documents");
    expect(asset.ipfsCid).to.equal("QmExampleCID123");
  });

  it("should allow owner to assign nominee", async function () {
    const { vault, owner, nominee } = await deployVault();

    await vault.connect(owner).createAsset(
      "Bank Account",
      "QmBankCID"
    );

    await expect(
      vault.connect(owner).assignNominee(
        0,
        nominee.address
      )
    )
      .to.emit(vault, "NomineeAssigned")
      .withArgs(0, nominee.address);

    const asset = await vault.getAsset(0);

    expect(asset.nominee).to.equal(nominee.address);
  });

  it("should allow nominee to accept nomination", async function () {
    const { vault, owner, nominee } = await deployVault();

    await vault.connect(owner).createAsset(
      "House",
      "QmHouseCID"
    );

    await vault.connect(owner).assignNominee(
      0,
      nominee.address
    );

    await expect(
      vault.connect(nominee).acceptNomination(0)
    )
      .to.emit(vault, "NomineeAccepted")
      .withArgs(0, nominee.address);

    const asset = await vault.getAsset(0);

    expect(asset.nomineeAccepted).to.equal(true);
  });

  it("should complete the claim and unlock flow", async function () {
    const { vault, owner, nominee } = await deployVault();

    await vault.connect(owner).createAsset(
      "Digital Assets",
      "QmDigitalCID"
    );

    await vault.connect(owner).assignNominee(
      0,
      nominee.address
    );

    await vault.connect(nominee).acceptNomination(0);

    await expect(
      vault.connect(nominee).submitClaim(0)
    )
      .to.emit(vault, "ClaimSubmitted")
      .withArgs(0, nominee.address);

    let asset = await vault.getAsset(0);

    expect(asset.status).to.equal(1);

    await expect(
      vault.connect(nominee).unlockAsset(0)
    )
      .to.emit(vault, "AssetUnlocked")
      .withArgs(0, nominee.address);

    asset = await vault.getAsset(0);

    expect(asset.status).to.equal(2);
  });

  it("should prevent someone else from assigning a nominee", async function () {
    const { vault, owner, nominee, other } = await deployVault();

    await vault.connect(owner).createAsset(
      "Secret Asset",
      "QmSecretCID"
    );

    await expect(
      vault.connect(other).assignNominee(
        0,
        nominee.address
      )
    ).to.be.revertedWith(
      "Only owner can assign nominee"
    );
  });

  it("should prevent a non-nominee from accepting", async function () {
    const { vault, owner, nominee, other } = await deployVault();

    await vault.connect(owner).createAsset(
      "House",
      "QmHouseCID"
    );

    await vault.connect(owner).assignNominee(
      0,
      nominee.address
    );

    await expect(
      vault.connect(other).acceptNomination(0)
    ).to.be.revertedWith(
      "Only nominee can accept"
    );
  });

});