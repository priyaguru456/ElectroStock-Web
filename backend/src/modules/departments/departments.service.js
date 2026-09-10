const departmentRepository = require("../../repositories/department.repository");
const { logAudit } = require("../../utils/auditLogger");
const HttpError = require("../../utils/httpError");

async function list() {
  return departmentRepository.list();
}

async function getById(id) {
  const department = await departmentRepository.findById(id);
  if (!department) throw new HttpError(404, "Department not found");
  return department;
}

async function create(data, performedById) {
  const existing = await departmentRepository.findByName(data.name);
  if (existing) throw new HttpError(400, "A department with this name already exists");

  const department = await departmentRepository.create(data);

  await logAudit(null, {
    userId: performedById,
    action: "CREATE",
    entityType: "Department",
    entityId: department.id,
    newValue: { name: department.name },
  });

  return department;
}

async function update(id, data, performedById) {
  const department = await departmentRepository.findById(id);
  if (!department) throw new HttpError(404, "Department not found");

  const updated = await departmentRepository.update(id, data);

  await logAudit(null, {
    userId: performedById,
    action: "UPDATE",
    entityType: "Department",
    entityId: id,
    oldValue: { name: department.name, isActive: department.isActive },
    newValue: { name: updated.name, isActive: updated.isActive },
  });

  return updated;
}

async function remove(id) {
  const department = await departmentRepository.findById(id);
  if (!department) throw new HttpError(404, "Department not found");

  const employeeCount = await departmentRepository.countEmployees(id);
  if (employeeCount > 0) {
    throw new HttpError(400, "Cannot delete a department that has employees assigned to it");
  }

  await departmentRepository.remove(id);
}

module.exports = { list, getById, create, update, remove };
