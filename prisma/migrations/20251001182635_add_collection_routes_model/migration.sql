/*
  Warnings:

  - You are about to drop the `CollectionRoute` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CollectionRoute" DROP CONSTRAINT "CollectionRoute_collectorId_fkey";

-- DropTable
DROP TABLE "public"."CollectionRoute";

-- CreateTable
CREATE TABLE "public"."collection_routes" (
    "id" SERIAL NOT NULL,
    "collectorId" INTEGER,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "collection_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collection_routes_collectorId_isActive_createdBy_createdAt__idx" ON "public"."collection_routes"("collectorId", "isActive", "createdBy", "createdAt", "updatedAt", "name", "id");

-- AddForeignKey
ALTER TABLE "public"."collection_routes" ADD CONSTRAINT "collection_routes_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "public"."collectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
