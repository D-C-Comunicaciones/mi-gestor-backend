/*
  Warnings:

  - You are about to drop the column `gracePeriod` on the `loans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "gracePeriod",
ADD COLUMN     "gracePeriodId" INTEGER;

-- CreateTable
CREATE TABLE "public"."grace_periods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "grace_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grace_periods_days_idx" ON "public"."grace_periods"("days");

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_gracePeriodId_fkey" FOREIGN KEY ("gracePeriodId") REFERENCES "public"."grace_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
