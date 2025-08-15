/*
  Warnings:

  - Added the required column `modelId` to the `changes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."changes" ADD COLUMN     "modelId" INTEGER NOT NULL;
