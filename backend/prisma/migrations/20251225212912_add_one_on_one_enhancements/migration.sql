-- CreateTable
CREATE TABLE "UserOAuthToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "expiresAt" DATETIME,
    "scope" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserOAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OneOnOne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "agenda" TEXT,
    "managerNotes" TEXT,
    "sharedNotes" TEXT,
    "actionItems" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "transcript" TEXT,
    "transcriptFileUrl" TEXT,
    "documentUrl" TEXT,
    "googleEventId" TEXT,
    "outlookEventId" TEXT,
    "googleCalendarSynced" BOOLEAN NOT NULL DEFAULT false,
    "googleEventUrl" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OneOnOne_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OneOnOne_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OneOnOne" ("actionItems", "agenda", "createdAt", "employeeId", "googleEventId", "id", "managerId", "managerNotes", "outlookEventId", "scheduledAt", "sharedNotes", "status", "updatedAt") SELECT "actionItems", "agenda", "createdAt", "employeeId", "googleEventId", "id", "managerId", "managerNotes", "outlookEventId", "scheduledAt", "sharedNotes", "status", "updatedAt" FROM "OneOnOne";
DROP TABLE "OneOnOne";
ALTER TABLE "new_OneOnOne" RENAME TO "OneOnOne";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserOAuthToken_userId_provider_key" ON "UserOAuthToken"("userId", "provider");
