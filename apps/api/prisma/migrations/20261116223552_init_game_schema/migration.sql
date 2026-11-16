-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('LOBBY', 'COLLECTING_ACTIONS', 'AWAITING_HOST', 'AWAITING_SPARK', 'RESOLVING', 'REVEALING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionRole" AS ENUM ('HOST', 'PLAYER');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('COLLECTING', 'AWAITING_HOST', 'AWAITING_SPARK', 'RESOLVING', 'REVEALING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ActionOutcome" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILURE');

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "worldName" VARCHAR(100) NOT NULL,
    "worldSetting" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "initialScene" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'LOBBY',
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "maxRounds" INTEGER NOT NULL DEFAULT 8,
    "maxPlayers" INTEGER NOT NULL DEFAULT 4,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "crisis" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "nickname" VARCHAR(40) NOT NULL,
    "characterName" VARCHAR(60) NOT NULL,
    "characterClass" VARCHAR(40) NOT NULL,
    "background" TEXT NOT NULL,
    "courage" INTEGER NOT NULL DEFAULT 0,
    "insight" INTEGER NOT NULL DEFAULT 0,
    "bond" INTEGER NOT NULL DEFAULT 0,
    "spark" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "role" "SessionRole" NOT NULL DEFAULT 'PLAYER',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'COLLECTING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attribute" VARCHAR(20) NOT NULL,
    "die1" INTEGER,
    "die2" INTEGER,
    "usedSpark" BOOLEAN,
    "total" INTEGER,
    "outcome" "ActionOutcome",
    "progressGain" INTEGER,
    "crisisGain" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "players_roomId_idx" ON "players"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "players_roomId_nickname_key" ON "players"("roomId", "nickname");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_playerId_idx" ON "sessions"("playerId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_roomId_number_key" ON "rounds"("roomId", "number");

-- CreateIndex
CREATE INDEX "actions_playerId_idx" ON "actions"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "actions_roundId_playerId_key" ON "actions"("roundId", "playerId");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
