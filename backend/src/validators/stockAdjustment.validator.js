const Joi = require("joi");

const createAdjustmentSchema = Joi.object({
  productId: Joi.number().integer().required(),
  warehouseId: Joi.number().integer().required(),
  quantityChange: Joi.number().integer().invalid(0).required(),
  reason: Joi.string().valid("DAMAGE", "LOSS", "RECOUNT", "OTHER").required(),
  notes: Joi.string().allow("", null),
});

module.exports = { createAdjustmentSchema };
