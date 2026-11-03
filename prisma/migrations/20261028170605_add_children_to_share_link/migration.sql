-- DropForeignKey
ALTER TABLE "ShareLink" DROP CONSTRAINT "ShareLink_folderId_fkey";

-- AlterTable
ALTER TABLE "ShareLink" ADD COLUMN     "childrenIds" INTEGER[];

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
