const productRepository = require("../../repositories/product.repository");
const HttpError = require("../../utils/httpError");

async function list(query) {
  return productRepository.list({
    categoryId: query.categoryId ? Number(query.categoryId) : undefined,
    supplierId: query.supplierId ? Number(query.supplierId) : undefined,
    isActive: query.isActive === undefined ? undefined : query.isActive === "true",
    search: query.search,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 20,
  });
}

async function getById(id) {
  const product = await productRepository.findById(id);
  if (!product) throw new HttpError(404, "Product not found");
  return product;
}

async function create(data) {
  const existing = await productRepository.findBySku(data.sku);
  if (existing) throw new HttpError(400, "A product with this SKU already exists");
  return productRepository.create(data);
}

async function update(id, data) {
  const product = await productRepository.findById(id);
  if (!product) throw new HttpError(404, "Product not found");
  return productRepository.update(id, data);
}

async function deactivate(id) {
  return update(id, { isActive: false });
}

module.exports = { list, getById, create, update, deactivate };
