-- CreateTable
CREATE TABLE "OneOnOneDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oneOnOneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "managerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OneOnOneDocument_oneOnOneId_fkey" FOREIGN KEY ("oneOnOneId") REFERENCES "OneOnOne" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
