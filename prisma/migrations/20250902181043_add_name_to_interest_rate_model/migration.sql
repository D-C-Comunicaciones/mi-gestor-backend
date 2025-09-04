/*
  Warnings:

  - Added the required column `name` to the `interest_rates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."interest_rates" ADD COLUMN     "name" TEXT NOT NULL;
