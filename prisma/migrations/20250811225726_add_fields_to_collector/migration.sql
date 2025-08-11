/*
  Warnings:

  - A unique constraint covering the columns `[documentNumber]` on the table `collectors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `address` to the `collectors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthDate` to the `collectors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentNumber` to the `collectors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genderId` to the `collectors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeDocumentIdentificationId` to the `collectors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."collectors" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "birthDate" DATE NOT NULL,
ADD COLUMN     "documentNumber" TEXT NOT NULL,
ADD COLUMN     "genderId" INTEGER NOT NULL,
ADD COLUMN     "typeDocumentIdentificationId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "collectors_documentNumber_key" ON "public"."collectors"("documentNumber");

-- AddForeignKey
ALTER TABLE "public"."collectors" ADD CONSTRAINT "collectors_typeDocumentIdentificationId_fkey" FOREIGN KEY ("typeDocumentIdentificationId") REFERENCES "public"."type_document_identifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collectors" ADD CONSTRAINT "collectors_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "public"."genders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
