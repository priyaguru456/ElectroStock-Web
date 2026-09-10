const warehouseRepository = require("../../repositories/warehouse.repository");
const userRepository = require("../../repositories/user.repository");
const HttpError = require("../../utils/httpError");

async function list(query) {
  return warehouseRepository.list({
    search: query.search,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
  });
}

async function getById(id) {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) throw new HttpError(404, "Warehouse not found");
  return warehouse;
}

async function create(data) {
  const existing = await warehouseRepository.findByName(data.name);
  if (existing) throw new HttpError(400, "A warehouse with this name already exists");
  return warehouseRepository.create(data);
}

async function update(id, data) {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) throw new HttpError(404, "Warehouse not found");
  return warehouseRepository.update(id, data);
}

async function deactivate(id) {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) throw new HttpError(404, "Warehouse not found");

  const stockedItems = await warehouseRepository.countInventory(id);
  if (stockedItems > 0) {
    throw new HttpError(400, "Cannot deactivate a warehouse that still holds stock");
  }

  return warehouseRepository.update(id, { isActive: false });
}

async function assignStaff(warehouseId, userId) {
  const warehouse = await warehouseRepository.findById(warehouseId);
  if (!warehouse) throw new HttpError(404, "Warehouse not found");

  const user = await userRepository.findById(userId);
  if (!user) throw new HttpError(404, "User not found");

  const existing = await warehouseRepository.findStaffAssignment(userId, warehouseId);
  if (existing) throw new HttpError(400, "This user is already assigned to this warehouse");

  return warehouseRepository.addStaff(userId, warehouseId);
}

async function unassignStaff(warehouseId, userId) {
  await warehouseRepository.removeStaff(userId, warehouseId);
}

module.exports = { list, getById, create, update, deactivate, assignStaff, unassignStaff };
