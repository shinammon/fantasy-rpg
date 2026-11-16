
import express from "express";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "fantasy-rpg-api",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Fantasy RPG API running on port ${PORT}`);
});
