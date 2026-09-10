const prisma = require("../config/db");

const profileInclude = {
  department: { select: { id: true, name: true } },
  shift: { select: { id: true, name: true, startTime: true, endTime: true } },
  warehouse: { select: { id: true, name: true } },
  manager: { select: { id: true, name: true, email: true } },
};

function selectUser(includeProfile = true) {
  return {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    createdAt: true,
    employeeProfile: includeProfile ? { include: profileInclude } : false,
  };
}

async function list({
  role,
  roleIn,
  departmentId,
  warehouseId,
  warehouseIdIn,
  shiftId,
  status,
  search,
  page = 1,
  limit = 20,
}) {
  const where = {};
  if (roleIn) where.role = { in: roleIn };
  else if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { employeeProfile: { employeeCode: { contains: search } } },
    ];
  }

  const profileFilter = {};
  if (departmentId) profileFilter.departmentId = departmentId;
  if (warehouseId) profileFilter.warehouseId = warehouseId;
  else if (warehouseIdIn) profileFilter.warehouseId = { in: warehouseIdIn };
  if (shiftId) profileFilter.shiftId = shiftId;
  if (Object.keys(profileFilter).length > 0) {
    where.employeeProfile = { ...where.employeeProfile, ...profileFilter };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: selectUser(),
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit };
}

function findById(id) {
  return prisma.user.findUnique({ where: { id }, select: selectUser() });
}

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function findProfileByEmployeeCode(employeeCode) {
  return prisma.employeeProfile.findUnique({ where: { employeeCode } });
}

function countReports(managerId) {
  return prisma.employeeProfile.count({ where: { managerId } });
}

async function create({ userData, profileData }) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    const profile = await tx.employeeProfile.create({
      data: { ...profileData, userId: user.id },
    });
    return { ...user, employeeProfile: profile };
  });
}

function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

function updateProfile(userId, data) {
  return prisma.employeeProfile.update({ where: { userId }, data });
}

module.exports = {
  list,
  findById,
  findByEmail,
  findProfileByEmployeeCode,
  countReports,
  create,
  updateUser,
  updateProfile,
};
