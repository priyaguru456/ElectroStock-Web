const Joi = require("joi");

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  parentId: Joi.number().integer().allow(null),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100),
  parentId: Joi.number().integer().allow(null),
}).min(1);

module.exports = { createCategorySchema, updateCategorySchema };
