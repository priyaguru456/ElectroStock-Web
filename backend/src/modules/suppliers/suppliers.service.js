const supplierRepository = require("../../repositories/supplier.repository");
const HttpError = require("../../utils/httpError");

async function list(query) {
  return supplierRepository.list({
    search: query.search,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
  });
}

async function getById(id) {
  const supplier = await supplierRepository.findById(id);
  if (!supplier) throw new HttpError(404, "Supplier not found");
  return supplier;
}

async function create(data) {
  if (data.email) {
    const existing = await supplierRepository.findByEmail(data.email);
    if (existing) throw new HttpError(400, "A supplier with this email already exists");
  }
  return supplierRepository.create(data);
}

async function update(id, data) {
  const supplier = await supplierRepository.findById(id);
  if (!supplier) throw new HttpError(404, "Supplier not found");
  return supplierRepository.update(id, data);
}

async function deactivate(id) {
  return update(id, { isActive: false });
}

module.exports = { list, getById, create, update, deactivate };
