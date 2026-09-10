const Joi = require("joi");

const itemSchema = Joi.object({
  productId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitCost: Joi.number().min(0).required(),
});

const createPurchaseOrderSchema = Joi.object({
  supplierId: Joi.number().integer().required(),
  warehouseId: Joi.number().integer().required(),
  expectedDate: Joi.date().iso().allow(null),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const updatePurchaseOrderSchema = Joi.object({
  expectedDate: Joi.date().iso().allow(null),
  items: Joi.array().items(itemSchema).min(1),
}).min(1);

const receiveSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.number().integer().required(),
        quantityReceived: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = { createPurchaseOrderSchema, updatePurchaseOrderSchema, receiveSchema };
