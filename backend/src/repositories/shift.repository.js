const prisma = require("../config/db");

function list() {
  return prisma.shift.findMany({ orderBy: { name: "asc" } });
}

function findById(id) {
  return prisma.shift.findUnique({ where: { id } });
}

function findByName(name) {
  return prisma.shift.findUnique({ where: { name } });
}

function create(data) {
  return prisma.shift.create({ data });
}

function update(id, data) {
  return prisma.shift.update({ where: { id }, data });
}

function countEmployees(shiftId) {
  return prisma.employeeProfile.count({ where: { shiftId } });
}

function remove(id) {
  return prisma.shift.delete({ where: { id } });
}

module.exports = { list, findById, findByName, create, update, countEmployees, remove };
