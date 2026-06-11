/*
  Warnings:

  - You are about to drop the column `name` on the `FeedbackCategory` table. All the data in the column will be lost.
  - You are about to drop the column `negativeChips` on the `FeedbackCategory` table. All the data in the column will be lost.
  - You are about to drop the column `positiveChips` on the `FeedbackCategory` table. All the data in the column will be lost.
  - The `welcomeMessage` column on the `FormConfig` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Polarity" AS ENUM ('positive', 'negative');

-- CreateEnum
CREATE TYPE "TagSource" AS ENUM ('template', 'custom', 'insight');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "businessType" TEXT NOT NULL DEFAULT 'restaurant';

-- AlterTable
ALTER TABLE "FeedbackCategory" DROP COLUMN "name",
DROP COLUMN "negativeChips",
DROP COLUMN "positiveChips",
ADD COLUMN     "canonicalKey" TEXT,
ADD COLUMN     "labels" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "FormConfig" ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
DROP COLUMN "welcomeMessage",
ADD COLUMN     "welcomeMessage" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "polarity" "Polarity" NOT NULL,
    "labels" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" "TagSource" NOT NULL DEFAULT 'template',
    "authoredLanguage" TEXT NOT NULL DEFAULT 'en',
    "canonicalKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintOrder" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "hasNfc" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'green-black',
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),

    CONSTRAINT "PrintOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppFeedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "businessId" TEXT,

    CONSTRAINT "AppFeedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FeedbackCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintOrder" ADD CONSTRAINT "PrintOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
