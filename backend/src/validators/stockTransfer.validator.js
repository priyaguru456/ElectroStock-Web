const Joi = require("joi");

const createTransferSchema = Joi.object({
  sourceWarehouseId: Joi.number().integer().required(),
  destinationWarehouseId: Joi.number()
    .integer()
    .required()
    .invalid(Joi.ref("sourceWarehouseId"))
    .messages({ "any.invalid": "Source and destination warehouse must be different" }),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = { createTransferSchema };
