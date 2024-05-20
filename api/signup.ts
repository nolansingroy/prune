// api/signup.ts
import { VercelRequest, VercelResponse } from "@vercel/node";

export default (req: VercelRequest, res: VercelResponse) => {
  // Set CORS headers to allow requests from http://localhost:3006
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3006");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Respond to OPTIONS preflight request
    res.status(200).end();
  } else if (req.method === "POST") {
    const { email } = req.body;
    console.log("Received email:", email);

    // Add your email processing logic here

    res.status(200).json({ message: `Email received successfully, ${email}` });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};
