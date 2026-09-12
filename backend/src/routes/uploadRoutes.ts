import { Router } from "express";
import fs from "fs";
import { upload } from "../middleware/upload";
import { uploadToPinata } from "../services/pinataService";

const router = Router();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const cid = await uploadToPinata(req.file.path);

    fs.unlinkSync(req.file.path);

    return res.json({
      success: true,
      cid,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "IPFS upload failed",
    });
  }
});

export default router;
