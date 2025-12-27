import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting employee seeding...');

  // First, create departments if they don't exist
  const departments = [
    { name: 'Engineering' },
    { name: 'Product' },
    { name: 'Design' },
    { name: 'Marketing' },
    { name: 'Sales' },
    { name: 'HR' },
    { name: 'Finance' },
    { name: 'Operations' },
  ];

  const createdDepartments: Record<string, any> = {};

  for (const dept of departments) {
    const existing = await prisma.department.findFirst({
      where: { name: dept.name },
    });

    if (existing) {
      createdDepartments[dept.name] = existing;
      console.log(`Department ${dept.name} already exists`);
    } else {
      const created = await prisma.department.create({ data: dept });
      createdDepartments[dept.name] = created;
      console.log(`Created department: ${dept.name}`);
    }
  }

  // Hash a default password for all placeholder users
  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // Create CEO (root of org chart)
  const ceo = await prisma.user.upsert({
    where: { email: 'sarah.chen@beacon.com' },
    update: {},
    create: {
      email: 'sarah.chen@beacon.com',
      password: defaultPassword,
      name: 'Sarah Chen',
      title: 'Chief Executive Officer',
      role: 'SUPER_ADMIN',
      departmentId: createdDepartments['Operations'].id,
      hireDate: new Date('2020-01-15'),
    },
  });
  console.log('Created CEO: Sarah Chen');

  // Create C-level executives reporting to CEO
  const cto = await prisma.user.upsert({
    where: { email: 'james.rodriguez@beacon.com' },
    update: {},
    create: {
      email: 'james.rodriguez@beacon.com',
      password: defaultPassword,
      name: 'James Rodriguez',
      title: 'Chief Technology Officer',
      role: 'MANAGER',
      managerId: ceo.id,
      departmentId: createdDepartments['Engineering'].id,
      hireDate: new Date('2020-03-01'),
    },
  });

  const cpo = await prisma.user.upsert({
    where: { email: 'maria.garcia@beacon.com' },
    update: {},
    create: {
      email: 'maria.garcia@beacon.com',
      password: defaultPassword,
      name: 'Maria Garcia',
      title: 'Chief Product Officer',
      role: 'MANAGER',
      managerId: ceo.id,
      departmentId: createdDepartments['Product'].id,
      hireDate: new Date('2020-04-01'),
    },
  });

  const vpSales = await prisma.user.upsert({
    where: { email: 'david.kim@beacon.com' },
    update: {},
    create: {
      email: 'david.kim@beacon.com',
      password: defaultPassword,
      name: 'David Kim',
      title: 'VP of Sales',
      role: 'MANAGER',
      managerId: ceo.id,
      departmentId: createdDepartments['Sales'].id,
      hireDate: new Date('2020-06-01'),
    },
  });

  const vpHR = await prisma.user.upsert({
    where: { email: 'lisa.patel@beacon.com' },
    update: {},
    create: {
      email: 'lisa.patel@beacon.com',
      password: defaultPassword,
      name: 'Lisa Patel',
      title: 'VP of People',
      role: 'HR_ADMIN',
      managerId: ceo.id,
      departmentId: createdDepartments['HR'].id,
      hireDate: new Date('2020-05-01'),
    },
  });

  console.log('Created C-level executives');

  // Engineering team under CTO
  const engManager1 = await prisma.user.upsert({
    where: { email: 'alex.johnson@beacon.com' },
    update: {},
    create: {
      email: 'alex.johnson@beacon.com',
      password: defaultPassword,
      name: 'Alex Johnson',
      title: 'Engineering Manager',
      role: 'MANAGER',
      managerId: cto.id,
      departmentId: createdDepartments['Engineering'].id,
      hireDate: new Date('2021-01-10'),
    },
  });

  const engManager2 = await prisma.user.upsert({
    where: { email: 'priya.sharma@beacon.com' },
    update: {},
    create: {
      email: 'priya.sharma@beacon.com',
      password: defaultPassword,
      name: 'Priya Sharma',
      title: 'Engineering Manager',
      role: 'MANAGER',
      managerId: cto.id,
      departmentId: createdDepartments['Engineering'].id,
      hireDate: new Date('2021-02-01'),
    },
  });

  // Engineers
  await prisma.user.upsert({
    where: { email: 'tom.wilson@beacon.com' },
    update: {},
    create: {
      email: 'tom.wilson@beacon.com',
      password: defaultPassword,
      name: 'Tom Wilson',
      title: 'Senior Software Engineer',
      role: 'EMPLOYEE',
      managerId: engManager1.id,
      departmentId: createdDepartments['Engineering'].id,
      hireDate: new Date('2021-06-15'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'emily.brown@beacon.com' },
    update: {},
    create: {
      email: 'emily.brown@beacon.com',
      password: defaultPassword,
      name: 'Emily Brown',
      title: 'Software Engineer',
      role: 'EMPLOYEE',
      managerId: engManager1.id,
      departmentId: createdDepartments['Engineering'].id,
      hireDate: new Date('2022-01-10'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'raj.kumar@beacon.com' },
    update: {},
    create: {
      email: 'raj.kumar@beacon.com',
      password: defaultPassword,
      name: 'Raj Kumar',
      title: 'Senior Software Engineer',
      role: 'EMPLOYEE',
      managerId: engManager2.id,
      departmentId: createdDepartments['Engineering'].id,
      hireDate: new Date('2021-08-01'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'sophie.martin@beacon.com' },
    update: {},
    create: {
      email: 'sophie.martin@beacon.com',
      password: defaultPassword,
      name: 'Sophie Martin',
      title: 'Software Engineer',
      role: 'EMPLOYEE',
      managerId: engManager2.id,
      departmentId: createdDepartments['Engineering'].id,
      hireDate: new Date('2022-03-01'),
    },
  });

  console.log('Created Engineering team');

  // Product team under CPO
  const pmLead = await prisma.user.upsert({
    where: { email: 'michael.lee@beacon.com' },
    update: {},
    create: {
      email: 'michael.lee@beacon.com',
      password: defaultPassword,
      name: 'Michael Lee',
      title: 'Lead Product Manager',
      role: 'MANAGER',
      managerId: cpo.id,
      departmentId: createdDepartments['Product'].id,
      hireDate: new Date('2021-03-01'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'jessica.davis@beacon.com' },
    update: {},
    create: {
      email: 'jessica.davis@beacon.com',
      password: defaultPassword,
      name: 'Jessica Davis',
      title: 'Product Manager',
      role: 'EMPLOYEE',
      managerId: pmLead.id,
      departmentId: createdDepartments['Product'].id,
      hireDate: new Date('2021-09-01'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'ryan.miller@beacon.com' },
    update: {},
    create: {
      email: 'ryan.miller@beacon.com',
      password: defaultPassword,
      name: 'Ryan Miller',
      title: 'Product Manager',
      role: 'EMPLOYEE',
      managerId: pmLead.id,
      departmentId: createdDepartments['Product'].id,
      hireDate: new Date('2022-02-01'),
    },
  });

  console.log('Created Product team');

  // Design team under CPO
  const designLead = await prisma.user.upsert({
    where: { email: 'olivia.taylor@beacon.com' },
    update: {},
    create: {
      email: 'olivia.taylor@beacon.com',
      password: defaultPassword,
      name: 'Olivia Taylor',
      title: 'Design Lead',
      role: 'MANAGER',
      managerId: cpo.id,
      departmentId: createdDepartments['Design'].id,
      hireDate: new Date('2021-04-01'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'noah.anderson@beacon.com' },
    update: {},
    create: {
      email: 'noah.anderson@beacon.com',
      password: defaultPassword,
      name: 'Noah Anderson',
      title: 'UX Designer',
      role: 'EMPLOYEE',
      managerId: designLead.id,
      departmentId: createdDepartments['Design'].id,
      hireDate: new Date('2021-10-01'),
    },
  });

  console.log('Created Design team');

  // Sales team under VP Sales
  const salesManager = await prisma.user.upsert({
    where: { email: 'amanda.white@beacon.com' },
    update: {},
    create: {
      email: 'amanda.white@beacon.com',
      password: defaultPassword,
      name: 'Amanda White',
      title: 'Sales Manager',
      role: 'MANAGER',
      managerId: vpSales.id,
      departmentId: createdDepartments['Sales'].id,
      hireDate: new Date('2021-05-01'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'carlos.lopez@beacon.com' },
    update: {},
    create: {
      email: 'carlos.lopez@beacon.com',
      password: defaultPassword,
      name: 'Carlos Lopez',
      title: 'Account Executive',
      role: 'EMPLOYEE',
      managerId: salesManager.id,
      departmentId: createdDepartments['Sales'].id,
      hireDate: new Date('2021-11-01'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'natalie.wright@beacon.com' },
    update: {},
    create: {
      email: 'natalie.wright@beacon.com',
      password: defaultPassword,
      name: 'Natalie Wright',
      title: 'Account Executive',
      role: 'EMPLOYEE',
      managerId: salesManager.id,
      departmentId: createdDepartments['Sales'].id,
      hireDate: new Date('2022-04-01'),
    },
  });

  console.log('Created Sales team');

  // HR team under VP HR
  await prisma.user.upsert({
    where: { email: 'kevin.thomas@beacon.com' },
    update: {},
    create: {
      email: 'kevin.thomas@beacon.com',
      password: defaultPassword,
      name: 'Kevin Thomas',
      title: 'HR Coordinator',
      role: 'EMPLOYEE',
      managerId: vpHR.id,
      departmentId: createdDepartments['HR'].id,
      hireDate: new Date('2021-07-01'),
    },
  });

  console.log('Created HR team');

  console.log('\n✅ Successfully seeded 20 employees!');
  console.log('Default password for all users: Password123!');
}

main()
  .catch((e) => {
    console.error('Error seeding employees:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
