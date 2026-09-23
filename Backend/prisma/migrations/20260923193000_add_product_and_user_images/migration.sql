-- AlterTable
ALTER TABLE "products" ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "profilePictureUrl" TEXT,
ADD COLUMN "profilePicturePublicId" TEXT;
