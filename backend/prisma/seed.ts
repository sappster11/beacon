import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password for all test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  console.log('✓ Created password hash');

  // Create departments
  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
    },
  });

  const productTeam = await prisma.department.create({
    data: {
      name: 'Product',
    },
  });

  const hr = await prisma.department.create({
    data: {
      name: 'Human Resources',
    },
  });

  console.log('✓ Created departments');

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@beacon.com',
      password: hashedPassword,
      name: 'Admin User',
      title: 'System Administrator',
      role: 'SUPER_ADMIN',
      departmentId: hr.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@beacon.com',
      password: hashedPassword,
      name: 'Jane Manager',
      title: 'Engineering Manager',
      role: 'MANAGER',
      departmentId: engineering.id,
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: 'john@beacon.com',
      password: hashedPassword,
      name: 'John Smith',
      title: 'Senior Software Engineer',
      role: 'EMPLOYEE',
      managerId: manager.id,
      departmentId: engineering.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'sarah@beacon.com',
      password: hashedPassword,
      name: 'Sarah Johnson',
      title: 'Software Engineer',
      role: 'EMPLOYEE',
      managerId: manager.id,
      departmentId: engineering.id,
    },
  });

  const productManager = await prisma.user.create({
    data: {
      email: 'product@beacon.com',
      password: hashedPassword,
      name: 'Mike Product',
      title: 'Product Manager',
      role: 'MANAGER',
      departmentId: productTeam.id,
    },
  });

  console.log('✓ Created users');

  // Create a review cycle
  const q1Cycle = await prisma.reviewCycle.create({
    data: {
      name: 'Q1 2024 Performance Reviews',
      type: 'QUARTERLY',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      status: 'active',
    },
  });

  console.log('✓ Created review cycle');

  // Create a review with competencies
  await prisma.review.create({
    data: {
      revieweeId: employee1.id,
      reviewerId: manager.id,
      cycleId: q1Cycle.id,
      status: 'IN_PROGRESS',
      competencies: JSON.stringify([
        {
          name: 'Technical Skills',
          description: 'Demonstrates proficiency in relevant technologies and tools',
          selfRating: 3,
          managerRating: 4,
        },
        {
          name: 'Communication',
          description: 'Effectively communicates with team members and stakeholders',
          selfRating: 3,
          managerRating: 3,
        },
        {
          name: 'Problem Solving',
          description: 'Analyzes complex problems and develops effective solutions',
          selfRating: 4,
          managerRating: 3,
        },
        {
          name: 'Collaboration',
          description: 'Works effectively with cross-functional teams',
          selfRating: 3,
          managerRating: 3,
        },
        {
          name: 'Initiative',
          description: 'Proactively identifies and addresses challenges',
          selfRating: 2,
          managerRating: 3,
        },
        {
          name: 'Code Quality',
          description: 'Writes clean, maintainable, and well-tested code',
          selfRating: 3,
          managerRating: 4,
        },
        {
          name: 'Time Management',
          description: 'Effectively prioritizes and manages workload',
          selfRating: 3,
          managerRating: 3,
        },
        {
          name: 'Learning & Growth',
          description: 'Continuously develops skills and adapts to new technologies',
          selfRating: 4,
          managerRating: 4,
        },
        {
          name: 'Mentorship',
          description: 'Supports and guides junior team members',
          selfRating: 2,
          managerRating: 2,
        },
        {
          name: 'Customer Focus',
          description: 'Considers user needs and business impact in decision making',
          selfRating: 3,
          managerRating: 3,
        },
      ]),
      selfReflections: JSON.stringify([
        {
          question: 'What are your key accomplishments this quarter?',
          answer: 'Successfully delivered the new authentication system, resolved 8 P1 bugs, and mentored Sarah on React best practices. Also completed AWS certification.',
        },
        {
          question: 'What challenges did you face and how did you overcome them?',
          answer: 'Struggled with time management when juggling multiple high-priority bugs. Improved by using time-blocking and better communication with stakeholders about realistic timelines.',
        },
        {
          question: 'What skills or areas do you want to develop next quarter?',
          answer: 'Would like to improve system design skills and take on more technical leadership responsibilities. Also want to be more proactive in identifying potential issues before they become problems.',
        },
      ]),
      assignedGoals: JSON.stringify([
        'Lead migration to new database system',
        'Reduce P1 bug resolution time by 30%',
        'Present technical talk at team meeting',
      ]),
      overallSelfRating: 3,
      overallManagerRating: 3,
    },
  });

  console.log('✓ Created review with competencies');

  // Create some goals
  const companyGoal = await prisma.goal.create({
    data: {
      ownerId: admin.id,
      title: 'Increase Customer Satisfaction',
      description: 'Improve NPS score to 60 by end of Q2',
      targetValue: 60,
      currentValue: 45,
      unit: 'NPS score',
      dueDate: new Date('2024-06-30'),
      status: 'ACTIVE',
      visibility: 'COMPANY',
    },
  });

  const teamGoal = await prisma.goal.create({
    data: {
      ownerId: manager.id,
      parentGoalId: companyGoal.id,
      title: 'Reduce Bug Backlog',
      description: 'Reduce P1/P2 bugs by 50%',
      targetValue: 25,
      currentValue: 50,
      unit: 'bugs',
      dueDate: new Date('2024-04-30'),
      status: 'ACTIVE',
      visibility: 'TEAM',
    },
  });

  await prisma.goal.create({
    data: {
      ownerId: employee1.id,
      parentGoalId: teamGoal.id,
      title: 'Fix Critical Bugs',
      description: 'Resolve 10 P1 bugs this quarter',
      targetValue: 10,
      currentValue: 3,
      unit: 'bugs fixed',
      dueDate: new Date('2024-03-31'),
      status: 'ACTIVE',
      visibility: 'PRIVATE',
    },
  });

  console.log('✓ Created goals with OKR alignment');

  // Create a 1:1 meeting
  await prisma.oneOnOne.create({
    data: {
      managerId: manager.id,
      employeeId: employee1.id,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      agenda: 'Q1 performance check-in, career development discussion',
      status: 'scheduled',
    },
  });

  console.log('✓ Created 1:1 meeting');

  // Create development plan
  await prisma.developmentPlan.create({
    data: {
      userId: employee1.id,
      careerGoals: 'Advance to Senior Software Engineer within 2 years. Develop expertise in system architecture and lead technical initiatives. Mentor junior developers and contribute to open source projects.',
      skillsToAdd: JSON.stringify([
        'System Design',
        'Microservices Architecture',
        'AWS & Cloud Infrastructure',
        'Technical Leadership',
        'Code Review Best Practices',
      ]),
      milestones: JSON.stringify([
        {
          title: 'Complete AWS Solutions Architect certification',
          description: 'Study and pass the AWS Solutions Architect Associate exam',
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
          completed: false,
        },
        {
          title: 'Lead a major feature development',
          description: 'Take ownership of a complex feature from design to deployment',
          targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months
          completed: false,
        },
        {
          title: 'Mentor 2 junior developers',
          description: 'Provide regular mentorship and code review guidance',
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months
          completed: true,
        },
        {
          title: 'Present at team tech talk',
          description: 'Share knowledge about system architecture best practices',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month
          completed: true,
        },
      ]),
      progress: 35,
    },
  });

  console.log('✓ Created development plan');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest users created:');
  console.log('  Admin:    admin@beacon.com');
  console.log('  Manager:  manager@beacon.com');
  console.log('  Employee: john@beacon.com');
  console.log('  Employee: sarah@beacon.com');
  console.log('  PM:       product@beacon.com');
  console.log('\nPassword for all users: password123');
  console.log('\nYou can now log in at http://localhost:5173');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
