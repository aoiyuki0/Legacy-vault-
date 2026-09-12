// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LegacyVault {

    enum AssetStatus {
        Locked,
        ClaimPending,
        Unlocked
    }

    struct Asset {
        uint256 id;
        address owner;
        address nominee;
        string name;
        string ipfsCid;
        AssetStatus status;
        bool nomineeAccepted;
    }

    uint256 private nextAssetId;

    mapping(uint256 => Asset) public assets;

    mapping(address => uint256[]) private ownerAssets;

    mapping(address => uint256[]) private nomineeAssets;

    event VaultRegistered(
        address indexed owner
    );

    event AssetCreated(
        uint256 indexed assetId,
        address indexed owner,
        string name
    );

    event NomineeAssigned(
        uint256 indexed assetId,
        address indexed nominee
    );

    event NomineeAccepted(
        uint256 indexed assetId,
        address indexed nominee
    );

    event ClaimSubmitted(
        uint256 indexed assetId,
        address indexed nominee
    );

    event AssetUnlocked(
        uint256 indexed assetId,
        address indexed nominee
    );

    function registerVault() external {
        emit VaultRegistered(msg.sender);
    }

    function createAsset(
        string calldata name,
        string calldata ipfsCid
    ) external returns (uint256) {

        uint256 assetId = nextAssetId;

        assets[assetId] = Asset({
            id: assetId,
            owner: msg.sender,
            nominee: address(0),
            name: name,
            ipfsCid: ipfsCid,
            status: AssetStatus.Locked,
            nomineeAccepted: false
        });

        ownerAssets[msg.sender].push(assetId);

        nextAssetId++;

        emit AssetCreated(
            assetId,
            msg.sender,
            name
        );

        return assetId;
    }

    function assignNominee(
        uint256 assetId,
        address nominee
    ) external {

        Asset storage asset = assets[assetId];

        require(
            asset.owner == msg.sender,
            "Only owner can assign nominee"
        );

        require(
            nominee != address(0),
            "Invalid nominee"
        );

        asset.nominee = nominee;

        nomineeAssets[nominee].push(assetId);

        emit NomineeAssigned(
            assetId,
            nominee
        );
    }

    function acceptNomination(
        uint256 assetId
    ) external {

        Asset storage asset = assets[assetId];

        require(
            asset.nominee == msg.sender,
            "Only nominee can accept"
        );

        asset.nomineeAccepted = true;

        emit NomineeAccepted(
            assetId,
            msg.sender
        );
    }

    function submitClaim(
        uint256 assetId
    ) external {

        Asset storage asset = assets[assetId];

        require(
            asset.nominee == msg.sender,
            "Only nominee can claim"
        );

        require(
            asset.nomineeAccepted,
            "Nomination not accepted"
        );

        require(
            asset.status == AssetStatus.Locked,
            "Invalid asset status"
        );

        asset.status = AssetStatus.ClaimPending;

        emit ClaimSubmitted(
            assetId,
            msg.sender
        );
    }

    function unlockAsset(
        uint256 assetId
    ) external {

        Asset storage asset = assets[assetId];

        require(
            asset.status == AssetStatus.ClaimPending,
            "Claim not pending"
        );

        asset.status = AssetStatus.Unlocked;

        emit AssetUnlocked(
            assetId,
            asset.nominee
        );
    }

    function getOwnerAssets(
        address owner
    ) external view returns (uint256[] memory) {
        return ownerAssets[owner];
    }

    function getNomineeAssets(
        address nominee
    ) external view returns (uint256[] memory) {
        return nomineeAssets[nominee];
    }

    function getAsset(
        uint256 assetId
    ) external view returns (Asset memory) {
        return assets[assetId];
    }
}