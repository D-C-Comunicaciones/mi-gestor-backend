/*
  Warnings:

  - Changed the type of `documentNumber` on the `customers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."customers" DROP COLUMN "documentNumber",
ADD COLUMN     "documentNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "changes_modelId_idx" ON "public"."changes"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_documentNumber_key" ON "public"."customers"("documentNumber");

-- CreateIndex
CREATE INDEX "customers_documentNumber_idx" ON "public"."customers"("documentNumber");
