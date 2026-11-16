
import express from "express";
import { prisma } from "./lib/prisma.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

// Liveness：確認 API Process 正常運作
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "fantasy-rpg-api",
    timestamp: new Date().toISOString()
  });
});

// Readiness：確認 PostgreSQL 可以正常查詢
app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ready",
      database: "connected"
    });
  } catch (error) {
    console.error("Database readiness check failed");

    res.status(503).json({
      status: "not_ready"
    });
  }
});

// 正常關閉資料庫連線
const server = app.listen(PORT, () => {
  console.log(`Fantasy RPG API running on port ${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
