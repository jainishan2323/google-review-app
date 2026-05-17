-- AlterTable
ALTER TABLE "AnonymousFeedback" ADD COLUMN     "unmappedInsights" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "unmappedInsights" TEXT[] DEFAULT ARRAY[]::TEXT[];
