const Joi = require("joi");

const createProductSchema = Joi.object({
  sku: Joi.string().min(1).max(64).required(),
  name: Joi.string().min(2).max(150).required(),
  categoryId: Joi.number().integer().allow(null),
  unit: Joi.string().min(1).max(30).required(),
  unitPrice: Joi.number().min(0).required(),
  reorderLevel: Joi.number().integer().min(0).default(0),
  defaultSupplierId: Joi.number().integer().allow(null),
  description: Joi.string().allow("", null),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(150),
  categoryId: Joi.number().integer().allow(null),
  unit: Joi.string().min(1).max(30),
  unitPrice: Joi.number().min(0),
  reorderLevel: Joi.number().integer().min(0),
  defaultSupplierId: Joi.number().integer().allow(null),
  description: Joi.string().allow("", null),
  isActive: Joi.boolean(),
}).min(1);

module.exports = { createProductSchema, updateProductSchema };
