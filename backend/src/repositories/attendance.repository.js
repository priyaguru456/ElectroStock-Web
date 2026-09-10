const prisma = require("../config/db");

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function findByEmployeeAndDate(employeeId, date) {
  return prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: startOfDay(date) } },
  });
}

function create(data) {
  return prisma.attendance.create({ data: { ...data, date: startOfDay(data.date) } });
}

function update(id, data) {
  return prisma.attendance.update({ where: { id }, data });
}

async function history({ employeeId, from, to, page = 1, limit = 20 }) {
  const where = { employeeId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = startOfDay(from);
    if (to) where.date.lte = startOfDay(to);
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({ where, skip, take: limit, orderBy: { date: "desc" } }),
    prisma.attendance.count({ where }),
  ]);

  return { items, total, page, limit };
}

function getEmployeeShift(employeeId) {
  return prisma.employeeProfile.findUnique({
    where: { userId: employeeId },
    include: { shift: true },
  });
}

module.exports = { findByEmployeeAndDate, create, update, history, getEmployeeShift, startOfDay };
