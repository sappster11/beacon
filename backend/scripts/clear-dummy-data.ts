import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  WARNING: This will delete ALL data from the database!');
  console.log('This should only be run when setting up a fresh production environment.\n');

  // Delete all data in reverse order of dependencies
  console.log('Deleting all data...');

  await prisma.auditLog.deleteMany();
  console.log('✓ Cleared audit logs');

  await prisma.oneOnOneDocument.deleteMany();
  console.log('✓ Cleared one-on-one documents');

  await prisma.oneOnOne.deleteMany();
  console.log('✓ Cleared one-on-ones');

  await prisma.developmentPlan.deleteMany();
  console.log('✓ Cleared development plans');

  await prisma.goalComment.deleteMany();
  console.log('✓ Cleared goal comments');

  await prisma.goal.deleteMany();
  console.log('✓ Cleared goals');

  await prisma.goalTemplate.deleteMany();
  console.log('✓ Cleared goal templates');

  await prisma.competencyComment.deleteMany();
  console.log('✓ Cleared competency comments');

  await prisma.peerFeedback.deleteMany();
  console.log('✓ Cleared peer feedback');

  await prisma.review.deleteMany();
  console.log('✓ Cleared reviews');

  await prisma.reviewCycle.deleteMany();
  console.log('✓ Cleared review cycles');

  await prisma.user.deleteMany();
  console.log('✓ Cleared users');

  await prisma.department.deleteMany();
  console.log('✓ Cleared departments');

  console.log('\n🎉 All dummy data has been cleared!');
  console.log('The database is now empty and ready for production use.');
  console.log('\nNext steps:');
  console.log('1. Create your first admin user via the API or direct database insert');
  console.log('2. Set up your organization structure');
  console.log('3. Import real employee data\n');
}

main()
  .catch((e) => {
    console.error('Error clearing data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
