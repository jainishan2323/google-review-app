-- AlterTable
ALTER TABLE "AnonymousFeedback" ADD COLUMN     "analyzedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "analyzedAt" TIMESTAMP(3);
