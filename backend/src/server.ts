import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import testRoutes from "./routes/testRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import blockchainRoutes from "./routes/blockchainRoutes";
import aiRoutes from "./routes/aiRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/test", testRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Legacy Vault Backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Legacy Vault API is healthy",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Legacy Vault Backend running on port ${PORT}`);
});
