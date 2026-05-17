/*
  Warnings:

  - You are about to drop the column `negativeChips` on the `FormConfig` table. All the data in the column will be lost.
  - You are about to drop the column `positiveChips` on the `FormConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FormConfig" DROP COLUMN "negativeChips",
DROP COLUMN "positiveChips";

-- CreateTable
CREATE TABLE "FeedbackCategory" (
    "id" TEXT NOT NULL,
    "formConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positiveChips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "negativeChips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackCategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedbackCategory" ADD CONSTRAINT "FeedbackCategory_formConfigId_fkey" FOREIGN KEY ("formConfigId") REFERENCES "FormConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
