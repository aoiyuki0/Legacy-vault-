import { Router } from "express";
import { supabase } from "../config/supabase";

const router = Router();

router.get("/database", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Supabase connection working",
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Unknown error",
    });
  }
});

export default router;
