const Joi = require("joi");
const { ROLES } = require("../config/constants");

const createEmployeeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...ROLES).required(),
  phone: Joi.string().max(30).allow("", null),
  designation: Joi.string().max(100).allow("", null),
  departmentId: Joi.number().integer().allow(null),
  shiftId: Joi.number().integer().allow(null),
  warehouseId: Joi.number().integer().allow(null),
  managerId: Joi.number().integer().allow(null),
  joiningDate: Joi.date().iso().allow(null),
  salary: Joi.number().positive().allow(null),
});

const updateEmployeeSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid(...ROLES),
  status: Joi.string().valid("ACTIVE", "ON_LEAVE", "RESIGNED"),
  phone: Joi.string().max(30).allow("", null),
  designation: Joi.string().max(100).allow("", null),
  joiningDate: Joi.date().iso().allow(null),
  salary: Joi.number().positive().allow(null),
  photoUrl: Joi.string().uri().allow("", null),
}).min(1);

const assignEmployeeSchema = Joi.object({
  departmentId: Joi.number().integer().allow(null),
  shiftId: Joi.number().integer().allow(null),
  warehouseId: Joi.number().integer().allow(null),
  managerId: Joi.number().integer().allow(null),
}).min(1);

module.exports = { createEmployeeSchema, updateEmployeeSchema, assignEmployeeSchema };
