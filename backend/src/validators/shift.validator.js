const Joi = require("joi");

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createShiftSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  startTime: Joi.string().pattern(TIME_PATTERN).required().messages({
    "string.pattern.base": "startTime must be in HH:MM 24-hour format",
  }),
  endTime: Joi.string().pattern(TIME_PATTERN).required().messages({
    "string.pattern.base": "endTime must be in HH:MM 24-hour format",
  }),
});

const updateShiftSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  startTime: Joi.string().pattern(TIME_PATTERN).messages({
    "string.pattern.base": "startTime must be in HH:MM 24-hour format",
  }),
  endTime: Joi.string().pattern(TIME_PATTERN).messages({
    "string.pattern.base": "endTime must be in HH:MM 24-hour format",
  }),
  isActive: Joi.boolean(),
}).min(1);

module.exports = { createShiftSchema, updateShiftSchema };
