-- AlterTable
ALTER TABLE "AnonymousFeedback" ADD COLUMN     "negativeTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "negativeTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
