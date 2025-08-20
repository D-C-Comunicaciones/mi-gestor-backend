/*
  Warnings:

  - You are about to drop the column `term` on the `loans` table. All the data in the column will be lost.
  - Added the required column `termId` to the `loans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "term",
ADD COLUMN     "termId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."terms" (
    "id" SERIAL NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terms_value_idx" ON "public"."terms"("value");

-- AddForeignKey
ALTER TABLE "public"."loans" ADD CONSTRAINT "loans_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
