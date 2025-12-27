-- CreateTable
CREATE TABLE "GoalTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetValue" REAL,
    "unit" TEXT,
    "suggestedDuration" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'TEAM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
