/*
  Warnings:

  - You are about to drop the column `zoneId` on the `collectors` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."collectors" DROP CONSTRAINT "collectors_zoneId_fkey";

-- DropIndex
DROP INDEX "public"."collectors_firstName_idx";

-- DropIndex
DROP INDEX "public"."collectors_isActive_idx";

-- DropIndex
DROP INDEX "public"."collectors_lastName_idx";

-- DropIndex
DROP INDEX "public"."collectors_zoneId_idx";

-- DropIndex
DROP INDEX "public"."notes_createdBy_idx";

-- AlterTable
ALTER TABLE "public"."collectors" DROP COLUMN "zoneId";

-- CreateTable
CREATE TABLE "public"."CollectionRoute" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "CollectionRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collectors_firstName_lastName_isActive_idx" ON "public"."collectors"("firstName", "lastName", "isActive");

-- CreateIndex
CREATE INDEX "notes_createdBy_model_modelId_createdAt_idx" ON "public"."notes"("createdBy", "model", "modelId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."CollectionRoute" ADD CONSTRAINT "CollectionRoute_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."collectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
