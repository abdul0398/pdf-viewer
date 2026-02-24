-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfUpload" (
    "id" TEXT NOT NULL,
    "uploadToken" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "accessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PdfUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewSession" (
    "id" TEXT NOT NULL,
    "viewToken" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViewSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PdfUpload_uploadToken_key" ON "PdfUpload"("uploadToken");

-- CreateIndex
CREATE UNIQUE INDEX "ViewSession_viewToken_key" ON "ViewSession"("viewToken");

-- AddForeignKey
ALTER TABLE "PdfUpload" ADD CONSTRAINT "PdfUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewSession" ADD CONSTRAINT "ViewSession_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "PdfUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
