const customerRepository = require("../../repositories/customer.repository");
const HttpError = require("../../utils/httpError");

async function list(query) {
  return customerRepository.list({
    search: query.search,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
  });
}

async function getById(id) {
  const customer = await customerRepository.findById(id);
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer;
}

async function create(data) {
  if (data.email) {
    const existing = await customerRepository.findByEmail(data.email);
    if (existing) throw new HttpError(400, "A customer with this email already exists");
  }
  return customerRepository.create(data);
}

async function update(id, data) {
  const customer = await customerRepository.findById(id);
  if (!customer) throw new HttpError(404, "Customer not found");
  return customerRepository.update(id, data);
}

async function deactivate(id) {
  return update(id, { isActive: false });
}

module.exports = { list, getById, create, update, deactivate };
