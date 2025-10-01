-- CreateTable
CREATE TABLE "public"."notes" (
    "id" SERIAL NOT NULL,
    "modelId" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_createdBy_idx" ON "public"."notes"("createdBy");

-- AddForeignKey
ALTER TABLE "public"."notes" ADD CONSTRAINT "notes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
