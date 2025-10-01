-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "collectionRouteId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_collectionRouteId_fkey" FOREIGN KEY ("collectionRouteId") REFERENCES "public"."collection_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
