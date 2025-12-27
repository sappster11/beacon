/*
  Warnings:

  - You are about to drop the column `overallRating` on the `Review` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "revieweeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "competencies" TEXT,
    "selfReflections" TEXT,
    "assignedGoals" TEXT,
    "overallSelfRating" INTEGER,
    "overallManagerRating" INTEGER,
    "selfAssessment" TEXT,
    "managerAssessment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("createdAt", "cycleId", "id", "managerAssessment", "revieweeId", "reviewerId", "selfAssessment", "status", "updatedAt") SELECT "createdAt", "cycleId", "id", "managerAssessment", "revieweeId", "reviewerId", "selfAssessment", "status", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
