import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function verifyDeathCertificate(
  filePath: string,
  originalName: string
) {
  const form = new FormData();

  form.append("file", fs.createReadStream(filePath), {
    filename: originalName,
  });

  const response = await axios.post(
    `${AI_SERVICE_URL}/verify-death-certificate`,
    form,
    {
      headers: {
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
    }
  );

  return response.data;
}
