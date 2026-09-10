const Joi = require("joi");
const { ROLES } = require("../config/constants");

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...ROLES).required(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid(...ROLES),
  status: Joi.string().valid("ACTIVE", "ON_LEAVE", "RESIGNED"),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "ON_LEAVE", "RESIGNED").required(),
});

module.exports = { createUserSchema, updateUserSchema, updateStatusSchema };
