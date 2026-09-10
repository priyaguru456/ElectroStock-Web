const shiftRepository = require("../../repositories/shift.repository");
const { logAudit } = require("../../utils/auditLogger");
const HttpError = require("../../utils/httpError");

async function list() {
  return shiftRepository.list();
}

async function getById(id) {
  const shift = await shiftRepository.findById(id);
  if (!shift) throw new HttpError(404, "Shift not found");
  return shift;
}

async function create(data, performedById) {
  const existing = await shiftRepository.findByName(data.name);
  if (existing) throw new HttpError(400, "A shift with this name already exists");

  const shift = await shiftRepository.create(data);

  await logAudit(null, {
    userId: performedById,
    action: "CREATE",
    entityType: "Shift",
    entityId: shift.id,
    newValue: { name: shift.name, startTime: shift.startTime, endTime: shift.endTime },
  });

  return shift;
}

async function update(id, data, performedById) {
  const shift = await shiftRepository.findById(id);
  if (!shift) throw new HttpError(404, "Shift not found");

  const updated = await shiftRepository.update(id, data);

  await logAudit(null, {
    userId: performedById,
    action: "UPDATE",
    entityType: "Shift",
    entityId: id,
    oldValue: { name: shift.name, startTime: shift.startTime, endTime: shift.endTime },
    newValue: { name: updated.name, startTime: updated.startTime, endTime: updated.endTime },
  });

  return updated;
}

async function remove(id) {
  const shift = await shiftRepository.findById(id);
  if (!shift) throw new HttpError(404, "Shift not found");

  const employeeCount = await shiftRepository.countEmployees(id);
  if (employeeCount > 0) {
    throw new HttpError(400, "Cannot delete a shift that has employees assigned to it");
  }

  await shiftRepository.remove(id);
}

module.exports = { list, getById, create, update, remove };
