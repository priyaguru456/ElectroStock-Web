const Joi = require("joi");

const createSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  contactName: Joi.string().allow("", null),
  email: Joi.string().email({ tlds: { allow: false } }).allow("", null),
  phone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(150),
  contactName: Joi.string().allow("", null),
  email: Joi.string().email({ tlds: { allow: false } }).allow("", null),
  phone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
  isActive: Joi.boolean(),
}).min(1);

module.exports = { createSupplierSchema, updateSupplierSchema };
