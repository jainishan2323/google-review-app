-- CreateTable
CREATE TABLE "FormConfig" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "brandColor" TEXT NOT NULL DEFAULT '#2563EB',
    "logoUrl" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Thanks for visiting! We''d love your feedback.',
    "positiveChips" TEXT[] DEFAULT ARRAY['Great Service', 'Clean Environment', 'Friendly Staff', 'Highly Recommend']::TEXT[],
    "negativeChips" TEXT[] DEFAULT ARRAY['Long Wait', 'Poor Communication', 'Needs Improvement', 'Unprofessional']::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormConfig_businessId_key" ON "FormConfig"("businessId");

-- AddForeignKey
ALTER TABLE "FormConfig" ADD CONSTRAINT "FormConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
