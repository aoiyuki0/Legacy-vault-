import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function uploadToPinata(filePath: string): Promise<string> {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    throw new Error("PINATA_JWT is not defined");
  }

  const formData = new FormData();

  formData.append("file", fs.createReadStream(filePath));

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      maxBodyLength: Infinity,

      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${jwt}`,
      },
    }
  );

  return response.data.IpfsHash;
}
