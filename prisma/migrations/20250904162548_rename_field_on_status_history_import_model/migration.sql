/*
  Warnings:

  - You are about to drop the column `status` on the `import_history_statuses` table. All the data in the column will be lost.
  - Added the required column `name` to the `import_history_statuses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."import_history_statuses" DROP COLUMN "status",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "import_historials_modelName_startedAt_completedAt_errorReco_idx" ON "public"."import_historials"("modelName", "startedAt", "completedAt", "errorRecords", "successfulRecords", "errorDetails", "importHistoryStatusId");

-- CreateIndex
CREATE INDEX "import_history_statuses_name_idx" ON "public"."import_history_statuses"("name");

-- CreateIndex
CREATE INDEX "import_history_statuses_description_idx" ON "public"."import_history_statuses"("description");
