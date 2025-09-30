/*
  Warnings:

  - You are about to drop the column `date` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "date",
ADD COLUMN     "appliedToCapital" DECIMAL(20,2) NOT NULL DEFAULT 0,
ADD COLUMN     "appliedToInterest" DECIMAL(20,2) NOT NULL DEFAULT 0,
ADD COLUMN     "appliedToLateFee" DECIMAL(20,2) NOT NULL DEFAULT 0,
ADD COLUMN     "collectorId" INTEGER,
ADD COLUMN     "paymentDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "payments_collectorId_idx" ON "public"."payments"("collectorId");

-- CreateIndex
CREATE INDEX "payments_paymentDate_idx" ON "public"."payments"("paymentDate");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."collectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
