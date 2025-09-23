-- CreateTable
CREATE TABLE "public"."import_historials" (
    "id" SERIAL NOT NULL,
    "modelName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "successfulRecords" INTEGER NOT NULL DEFAULT 0,
    "errorRecords" INTEGER NOT NULL DEFAULT 0,
    "importHistoryStatusId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "errorDetails" TEXT,

    CONSTRAINT "import_historials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_history_statuses" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "import_history_statuses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."import_historials" ADD CONSTRAINT "import_historials_importHistoryStatusId_fkey" FOREIGN KEY ("importHistoryStatusId") REFERENCES "public"."import_history_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
