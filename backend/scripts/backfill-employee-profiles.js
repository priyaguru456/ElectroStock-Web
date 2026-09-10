/**
 * One-time backfill: create a minimal EmployeeProfile for every existing User
 * that doesn't have one yet. Not part of the Prisma migration (data script, not
 * schema change) — safe to re-run, skips users that already have a profile.
 *
 * Usage: node scripts/backfill-employee-profiles.js
 */
require("dotenv").config({ quiet: true });
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

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

function generateEmployeeCode(userId) {
  return `EMP${String(userId).padStart(5, "0")}`;
}

async function main() {
  const usersWithoutProfile = await prisma.user.findMany({
    where: { employeeProfile: null },
    select: { id: true, name: true },
  });

  if (usersWithoutProfile.length === 0) {
    console.log("No users need backfilling — every user already has an EmployeeProfile.");
    return;
  }

  for (const user of usersWithoutProfile) {
    await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        employeeCode: generateEmployeeCode(user.id),
      },
    });
    console.log(`Created EmployeeProfile for user #${user.id} (${user.name})`);
  }

  console.log(`Backfilled ${usersWithoutProfile.length} employee profile(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
