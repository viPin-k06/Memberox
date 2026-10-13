import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Memberox API is running!");
});

app.listen(PORT, () => {
  console.log(`Memberox backend running on http://localhost:${PORT}`);
});
