-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE', 'DECLINED');

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "status" "SuggestionStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
