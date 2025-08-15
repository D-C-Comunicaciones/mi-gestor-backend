/*
  Warnings:

  - Changed the type of `documentNumber` on the `collectors` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."collectors" DROP COLUMN "documentNumber",
ADD COLUMN     "documentNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "collectors_documentNumber_key" ON "public"."collectors"("documentNumber");
