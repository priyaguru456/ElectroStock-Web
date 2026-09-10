const Joi = require("joi");

const createDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow("", null),
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().allow("", null),
  isActive: Joi.boolean(),
}).min(1);

module.exports = { createDepartmentSchema, updateDepartmentSchema };
