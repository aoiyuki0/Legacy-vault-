import { Router } from "express";
import { unlockAsset } from "../services/blockchainService";

const router = Router();

router.post(
  "/unlock/:assetId",
  async (req, res) => {

    try {

      const assetId =
        Number(req.params.assetId);

      if (Number.isNaN(assetId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid asset ID"
        });
      }

      const receipt =
        await unlockAsset(assetId);

      return res.json({
        success: true,
        transactionHash: receipt.hash
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Blockchain transaction failed"
      });
    }
  }
);

export default router;