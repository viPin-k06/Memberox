import express from "express";
import "dotenv/config";
import { supabase } from "./config/supabase.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Memberox API is running!");
});

app.get("/api/test-supabase", async (req, res) => {
  const { error } = await supabase.auth.getSession();

  if (error) {
    return res.status(500).json({
      message: "Supabase request failed",
      error: error.message,
    });
  }
  res.json({
    message: "Supabase client is configured",
  });
});

app.listen(PORT, () => {
  console.log(`Memberox backend running on http://localhost:${PORT}`);
});
