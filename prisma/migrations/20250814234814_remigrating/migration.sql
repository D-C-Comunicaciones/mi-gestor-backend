/*
  Warnings:

  - You are about to drop the column `name` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `typeDocumentId` on the `customers` table. All the data in the column will be lost.
  - Added the required column `birthDate` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeDocumentIdentificationId` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."customers" DROP CONSTRAINT "customers_typeDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."customers" DROP CONSTRAINT "customers_zoneId_fkey";

-- DropIndex
DROP INDEX "public"."customers_documentNumber_idx";

-- DropIndex
DROP INDEX "public"."customers_name_idx";

-- DropIndex
DROP INDEX "public"."customers_typeDocumentId_idx";

-- AlterTable
ALTER TABLE "public"."customers" DROP COLUMN "name",
DROP COLUMN "typeDocumentId",
ADD COLUMN     "birthDate" DATE NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "typeDocumentIdentificationId" INTEGER NOT NULL,
ALTER COLUMN "zoneId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "customers_firstName_idx" ON "public"."customers"("firstName");

-- CreateIndex
CREATE INDEX "customers_lastName_idx" ON "public"."customers"("lastName");

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_typeDocumentIdentificationId_fkey" FOREIGN KEY ("typeDocumentIdentificationId") REFERENCES "public"."type_document_identifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
