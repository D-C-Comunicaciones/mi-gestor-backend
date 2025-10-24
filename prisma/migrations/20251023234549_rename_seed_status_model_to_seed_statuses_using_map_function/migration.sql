/*
  Warnings:

  - You are about to drop the `SeedStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."SeedStatus";

-- CreateTable
CREATE TABLE "public"."seed_statuses" (
    "id" SERIAL NOT NULL,
    "model" TEXT NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seed_statuses_model_key" ON "public"."seed_statuses"("model");

-- CreateIndex
CREATE INDEX "seed_statuses_model_seeded_createdAt_updatedAt_idx" ON "public"."seed_statuses"("model", "seeded", "createdAt", "updatedAt");
