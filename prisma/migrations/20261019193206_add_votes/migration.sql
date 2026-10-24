-- CreateTable
CREATE TABLE "Vote" (
    "suggestionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("suggestionId","userId")
);

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "Suggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
