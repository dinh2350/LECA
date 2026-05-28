-- DropIndex
DROP INDEX "file_id_key";

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "status" ADD COLUMN     "name" TEXT;
