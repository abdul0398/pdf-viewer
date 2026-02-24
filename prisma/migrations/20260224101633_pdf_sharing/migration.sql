/*
  Warnings:

  - You are about to drop the column `accessed` on the `PdfUpload` table. All the data in the column will be lost.
  - You are about to drop the column `uploadToken` on the `PdfUpload` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PdfUpload` table. All the data in the column will be lost.
  - You are about to drop the column `uploadId` on the `ViewSession` table. All the data in the column will be lost.
  - Added the required column `uploadedBy` to the `PdfUpload` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shareId` to the `ViewSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PdfUpload" DROP CONSTRAINT "PdfUpload_userId_fkey";

-- DropForeignKey
ALTER TABLE "ViewSession" DROP CONSTRAINT "ViewSession_uploadId_fkey";

-- DropIndex
DROP INDEX "PdfUpload_uploadToken_key";

-- AlterTable
ALTER TABLE "PdfUpload" DROP COLUMN "accessed",
DROP COLUMN "uploadToken",
DROP COLUMN "userId",
ADD COLUMN     "fileSize" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uploadedBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ViewSession" DROP COLUMN "uploadId",
ADD COLUMN     "shareId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PdfShare" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PdfShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PdfShare_uploadId_userId_key" ON "PdfShare"("uploadId", "userId");

-- AddForeignKey
ALTER TABLE "PdfUpload" ADD CONSTRAINT "PdfUpload_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfShare" ADD CONSTRAINT "PdfShare_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "PdfUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfShare" ADD CONSTRAINT "PdfShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewSession" ADD CONSTRAINT "ViewSession_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "PdfShare"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
