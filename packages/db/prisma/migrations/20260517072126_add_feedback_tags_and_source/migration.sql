-- AlterTable
ALTER TABLE "AnonymousFeedback" ADD COLUMN     "generatedReview" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'private',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
