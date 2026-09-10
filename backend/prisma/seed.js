require("dotenv").config({ quiet: true });
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const bcrypt = require("bcryptjs");

const url = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const DEFAULT_DEPARTMENTS = [
  "Warehouse Operations",
  "Inventory",
  "Packing",
  "Dispatch",
  "Delivery",
  "Administration",
];

const DEFAULT_SHIFTS = [
  { name: "Morning", startTime: "06:00", endTime: "14:00" },
  { name: "Evening", startTime: "14:00", endTime: "22:00" },
  { name: "Night", startTime: "22:00", endTime: "06:00" },
];

async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@electrostock.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`Seeded SUPER_ADMIN user: ${email} / ${password}`);
  console.log("Log in and change this password immediately.");
}

async function seedDepartments() {
  for (const name of DEFAULT_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${DEFAULT_DEPARTMENTS.length} departments.`);
}

async function seedShifts() {
  for (const shift of DEFAULT_SHIFTS) {
    await prisma.shift.upsert({
      where: { name: shift.name },
      update: {},
      create: shift,
    });
  }
  console.log(`Seeded ${DEFAULT_SHIFTS.length} shifts.`);
}

async function main() {
  await seedAdminUser();
  await seedDepartments();
  await seedShifts();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
