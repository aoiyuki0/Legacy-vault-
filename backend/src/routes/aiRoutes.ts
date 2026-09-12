import { Router } from "express";
import fs from "fs";
import { upload } from "../middleware/upload";
import { verifyDeathCertificate } from "../services/aiService";

const router = Router();

router.post("/verify-death-certificate", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No certificate uploaded",
    });
  }

  try {
    const result = await verifyDeathCertificate(req.file.path, req.file.originalname);

    fs.unlinkSync(req.file.path);

    return res.json(result);
  } catch (error) {
    console.error(error);

    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }

    return res.status(500).json({
      success: false,
      message: "AI verification service failed",
    });
  }
});

export default router;
