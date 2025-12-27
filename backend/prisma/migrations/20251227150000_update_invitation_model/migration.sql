-- Add new fields to Invitation table for user pre-configuration
ALTER TABLE "Invitation" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Invitation" ADD COLUMN "title" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "Invitation" ADD COLUMN "managerId" TEXT;

-- Add foreign key for department
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Remove the default after adding the column
ALTER TABLE "Invitation" ALTER COLUMN "name" DROP DEFAULT;
