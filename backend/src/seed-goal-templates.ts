import { prisma } from './lib/db';

async function seedGoalTemplates() {
  console.log('Seeding goal templates...');

  const templates = [
    {
      title: 'Increase Quarterly Sales',
      description: 'Drive revenue growth by increasing sales performance and meeting quarterly targets.',
      category: 'Sales',
      targetValue: 100000,
      unit: 'dollars',
      suggestedDuration: 90,
      visibility: 'TEAM',
    },
    {
      title: 'Improve Customer Satisfaction Score',
      description: 'Enhance customer experience and satisfaction by addressing feedback and improving service quality.',
      category: 'Customer Success',
      targetValue: 4.5,
      unit: 'rating',
      suggestedDuration: 90,
      visibility: 'TEAM',
    },
    {
      title: 'Reduce Bug Count',
      description: 'Improve code quality and reduce production bugs through better testing and code reviews.',
      category: 'Engineering',
      targetValue: 20,
      unit: 'bugs',
      suggestedDuration: 90,
      visibility: 'TEAM',
    },
    {
      title: 'Ship Major Feature Release',
      description: 'Successfully deliver and launch a major product feature to production.',
      category: 'Engineering',
      targetValue: 1,
      unit: 'release',
      suggestedDuration: 180,
      visibility: 'COMPANY',
    },
    {
      title: 'Develop Team Leadership Skills',
      description: 'Build leadership capabilities through mentoring, coaching, and team development initiatives.',
      category: 'Leadership',
      suggestedDuration: 180,
      visibility: 'TEAM',
    },
    {
      title: 'Complete Technical Certification',
      description: 'Achieve professional certification to enhance technical skills and expertise.',
      category: 'Engineering',
      targetValue: 1,
      unit: 'certification',
      suggestedDuration: 120,
      visibility: 'TEAM',
    },
    {
      title: 'Increase Marketing Qualified Leads',
      description: 'Generate more qualified leads through marketing campaigns and initiatives.',
      category: 'Marketing',
      targetValue: 500,
      unit: 'leads',
      suggestedDuration: 90,
      visibility: 'TEAM',
    },
    {
      title: 'Improve Process Efficiency',
      description: 'Streamline operations and reduce process bottlenecks to improve overall efficiency.',
      category: 'Operations',
      targetValue: 20,
      unit: 'percent',
      suggestedDuration: 120,
      visibility: 'TEAM',
    },
    {
      title: 'Onboard New Team Members',
      description: 'Successfully recruit, hire, and onboard new team members to support growth.',
      category: 'Leadership',
      targetValue: 3,
      unit: 'hires',
      suggestedDuration: 90,
      visibility: 'TEAM',
    },
    {
      title: 'Launch New Product Line',
      description: 'Research, develop, and launch a new product line to expand market presence.',
      category: 'Marketing',
      targetValue: 1,
      unit: 'product',
      suggestedDuration: 180,
      visibility: 'COMPANY',
    },
  ];

  // Check if templates already exist
  const existingCount = await prisma.goalTemplate.count();

  if (existingCount > 0) {
    console.log(`Templates already exist (${existingCount} found). Skipping seed.`);
    return;
  }

  // Create all templates
  await prisma.goalTemplate.createMany({
    data: templates,
  });

  console.log(`✓ Seeded ${templates.length} goal templates`);
}

seedGoalTemplates()
  .catch((e) => {
    console.error('Error seeding goal templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
