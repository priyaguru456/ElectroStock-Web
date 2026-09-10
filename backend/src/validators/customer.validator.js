const Joi = require("joi");

const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  email: Joi.string().email({ tlds: { allow: false } }).allow("", null),
  phone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(150),
  email: Joi.string().email({ tlds: { allow: false } }).allow("", null),
  phone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
  isActive: Joi.boolean(),
}).min(1);

module.exports = { createCustomerSchema, updateCustomerSchema };
