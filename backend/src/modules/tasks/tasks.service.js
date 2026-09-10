const taskRepository = require("../../repositories/task.repository");
const { logAudit } = require("../../utils/auditLogger");
const HttpError = require("../../utils/httpError");
const { EMPLOYEE_VIEWING_ROLES } = require("../../config/constants");

async function list(query, actingUser) {
  const { status, type, priority, assignedTo, warehouse, page, limit } = query;

  const assignedToId = EMPLOYEE_VIEWING_ROLES.includes(actingUser.role)
    ? assignedTo
      ? Number(assignedTo)
      : undefined
    : actingUser.id;

  return taskRepository.list({
    status,
    type,
    priority,
    assignedToId,
    warehouseId: warehouse ? Number(warehouse) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
}

async function create(data, actingUser) {
  const task = await taskRepository.create({
    title: data.title,
    description: data.description || null,
    type: data.type,
    priority: data.priority || "MEDIUM",
    status: data.assignedToId ? "ASSIGNED" : "PENDING",
    assignedToId: data.assignedToId || null,
    assignedById: actingUser.id,
    warehouseId: data.warehouseId,
    dueDate: data.dueDate || null,
    referenceType: data.referenceType || null,
    referenceId: data.referenceId || null,
  });

  await logAudit(null, {
    userId: actingUser.id,
    action: "CREATE",
    entityType: "WarehouseTask",
    entityId: task.id,
    newValue: { title: task.title, type: task.type, assignedToId: task.assignedToId },
  });

  return task;
}

async function assign(id, assignedToId, actingUser) {
  const task = await taskRepository.findById(id);
  if (!task) throw new HttpError(404, "Task not found");

  const updated = await taskRepository.update(id, { assignedToId, status: "ASSIGNED" });

  await logAudit(null, {
    userId: actingUser.id,
    action: "UPDATE",
    entityType: "WarehouseTask",
    entityId: id,
    oldValue: { assignedToId: task.assignedToId },
    newValue: { assignedToId },
  });

  return updated;
}

async function updateStatus(id, status, actingUser) {
  const task = await taskRepository.findById(id);
  if (!task) throw new HttpError(404, "Task not found");

  const isManager = EMPLOYEE_VIEWING_ROLES.includes(actingUser.role);
  const isAssignee = task.assignedToId === actingUser.id;
  if (!isManager && !isAssignee) {
    throw new HttpError(403, "You do not have permission to update this task.");
  }

  const data = { status };
  if (status === "COMPLETED") data.completedAt = new Date();

  const updated = await taskRepository.update(id, data);

  await logAudit(null, {
    userId: actingUser.id,
    action: "STATUS_CHANGE",
    entityType: "WarehouseTask",
    entityId: id,
    oldValue: { status: task.status },
    newValue: { status },
  });

  return updated;
}

module.exports = { list, create, assign, updateStatus };
