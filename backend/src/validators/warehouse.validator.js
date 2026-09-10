const Joi = require("joi");

const createWarehouseSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  address: Joi.string().allow("", null),
});

const updateWarehouseSchema = Joi.object({
  name: Joi.string().min(2).max(150),
  address: Joi.string().allow("", null),
  isActive: Joi.boolean(),
}).min(1);

const assignStaffSchema = Joi.object({
  userId: Joi.number().integer().required(),
});

module.exports = { createWarehouseSchema, updateWarehouseSchema, assignStaffSchema };
