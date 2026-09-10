const prisma = require("../config/db");

function list() {
  return prisma.department.findMany({ orderBy: { name: "asc" } });
}

function findById(id) {
  return prisma.department.findUnique({ where: { id } });
}

function findByName(name) {
  return prisma.department.findUnique({ where: { name } });
}

function create(data) {
  return prisma.department.create({ data });
}

function update(id, data) {
  return prisma.department.update({ where: { id }, data });
}

function countEmployees(departmentId) {
  return prisma.employeeProfile.count({ where: { departmentId } });
}

function remove(id) {
  return prisma.department.delete({ where: { id } });
}

module.exports = { list, findById, findByName, create, update, countEmployees, remove };
