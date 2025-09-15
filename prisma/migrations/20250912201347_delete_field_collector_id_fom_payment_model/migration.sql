/*
  Warnings:

  - You are about to drop the column `collectorId` on the `payments` table. All the data in the column will be lost.
  - Made the column `recordedByUserId` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_collectorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_recordedByUserId_fkey";

-- DropIndex
DROP INDEX "public"."payments_collectorId_idx";

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "collectorId",
ALTER COLUMN "recordedByUserId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "payments_recordedByUserId_idx" ON "public"."payments"("recordedByUserId");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
