const Joi = require("joi");

const TASK_TYPES = ["PICKING", "PACKING", "DISPATCH", "STOCK_COUNT", "TRANSFER", "RECEIVING", "OTHER"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const TASK_STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(150).required(),
  description: Joi.string().allow("", null),
  type: Joi.string().valid(...TASK_TYPES).required(),
  priority: Joi.string().valid(...TASK_PRIORITIES),
  warehouseId: Joi.number().integer().required(),
  assignedToId: Joi.number().integer().allow(null),
  dueDate: Joi.date().iso().allow(null),
  referenceType: Joi.string().max(50).allow(null),
  referenceId: Joi.number().integer().allow(null),
});

const assignTaskSchema = Joi.object({
  assignedToId: Joi.number().integer().required(),
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid(...TASK_STATUSES).required(),
});

module.exports = { createTaskSchema, assignTaskSchema, updateTaskStatusSchema };
