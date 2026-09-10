const Joi = require("joi");

const itemSchema = Joi.object({
  productId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
});

const createSalesOrderSchema = Joi.object({
  customerId: Joi.number().integer().required(),
  warehouseId: Joi.number().integer().required(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const updateSalesOrderSchema = Joi.object({
  items: Joi.array().items(itemSchema).min(1).required(),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid("PROCESSING", "SHIPPED", "DELIVERED").required(),
});

module.exports = { createSalesOrderSchema, updateSalesOrderSchema, statusUpdateSchema };
