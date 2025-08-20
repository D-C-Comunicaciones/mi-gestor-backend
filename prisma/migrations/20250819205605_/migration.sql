/*
  Warnings:

  - You are about to drop the column `createdAt` on the `loans` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `loans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."loans" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
