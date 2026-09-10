const employeeRepository = require("../../repositories/employee.repository");
const warehouseRepository = require("../../repositories/warehouse.repository");
const { hashPassword } = require("../../utils/hash");
const { logAudit } = require("../../utils/auditLogger");
const HttpError = require("../../utils/httpError");
const { ADMIN_ROLES, EMPLOYEE_MANAGING_ROLES, MANAGED_ROLES_BY_MANAGER } = require("../../config/constants");

function sanitize(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// SUPER_ADMIN/ADMIN see and manage everyone. WAREHOUSE_MANAGER and TEAM_LEADER are
// further scoped to only the warehouse(s) they're assigned to via WarehouseStaff —
// same lookup dashboard.service.js already uses to scope warehouse stats.
async function resolveWarehouseScope(actingUser) {
  if (ADMIN_ROLES.includes(actingUser.role)) return undefined;
  return warehouseRepository.listWarehouseIdsForUser(actingUser.id);
}

function isWithinWarehouseScope(target, warehouseIds) {
  if (!warehouseIds) return true;
  const targetWarehouseId = target.employeeProfile?.warehouse?.id ?? null;
  return targetWarehouseId != null && warehouseIds.includes(targetWarehouseId);
}

async function assertCanView(target, actingUser) {
  if (target.id === actingUser.id) return;
  if (ADMIN_ROLES.includes(actingUser.role)) return;

  const managedRoles = MANAGED_ROLES_BY_MANAGER[actingUser.role] || [];
  if (!managedRoles.includes(target.role)) {
    throw new HttpError(403, "You do not have permission to view this employee.");
  }

  if (EMPLOYEE_MANAGING_ROLES.includes(actingUser.role)) {
    const warehouseIds = await resolveWarehouseScope(actingUser);
    if (!isWithinWarehouseScope(target, warehouseIds)) {
      throw new HttpError(403, "You can only view employees in your own warehouse.");
    }
  }
}

async function assertCanManage(target, actingUser) {
  if (ADMIN_ROLES.includes(actingUser.role)) return;

  const managedRoles = MANAGED_ROLES_BY_MANAGER[actingUser.role] || [];
  if (!managedRoles.includes(target.role)) {
    throw new HttpError(403, "You can only manage employees on your own team.");
  }

  if (EMPLOYEE_MANAGING_ROLES.includes(actingUser.role)) {
    const warehouseIds = await resolveWarehouseScope(actingUser);
    if (!isWithinWarehouseScope(target, warehouseIds)) {
      throw new HttpError(403, "You can only manage employees in your own warehouse.");
    }
  }
}

async function list(query, actingUser) {
  const { role, department, warehouse, shift, status, search, page, limit } = query;
  const managedRoles = MANAGED_ROLES_BY_MANAGER[actingUser.role];
  const warehouseScope = await resolveWarehouseScope(actingUser);

  const result = await employeeRepository.list({
    role: managedRoles ? undefined : role,
    roleIn: managedRoles,
    departmentId: department ? Number(department) : undefined,
    warehouseId: warehouse ? Number(warehouse) : undefined,
    warehouseIdIn: warehouse ? undefined : warehouseScope,
    shiftId: shift ? Number(shift) : undefined,
    status,
    search,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  return { ...result, items: result.items.map(sanitize) };
}

async function getById(id, actingUser) {
  const employee = await employeeRepository.findById(id);
  if (!employee) throw new HttpError(404, "Employee not found");

  await assertCanView(employee, actingUser);

  return sanitize(employee);
}

async function create(data, actingUser) {
  const existing = await employeeRepository.findByEmail(data.email);
  if (existing) throw new HttpError(400, "A user with this email already exists");

  if (!ADMIN_ROLES.includes(actingUser.role) && data.warehouseId) {
    const warehouseIds = await resolveWarehouseScope(actingUser);
    if (!warehouseIds.includes(data.warehouseId)) {
      throw new HttpError(403, "You can only create employees in your own warehouse.");
    }
  }

  const passwordHash = await hashPassword(data.password);

  const created = await employeeRepository.create({
    userData: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      status: "ACTIVE",
    },
    profileData: {
      employeeCode: "PENDING",
      phone: data.phone || null,
      designation: data.designation || null,
      departmentId: data.departmentId || null,
      shiftId: data.shiftId || null,
      warehouseId: data.warehouseId || null,
      managerId: data.managerId || null,
      joiningDate: data.joiningDate || null,
      salary: data.salary ?? null,
    },
  });

  const employeeCode = `EMP${String(created.id).padStart(5, "0")}`;
  await employeeRepository.updateProfile(created.id, { employeeCode });

  const employee = await employeeRepository.findById(created.id);

  await logAudit(null, {
    userId: actingUser.id,
    action: "CREATE",
    entityType: "Employee",
    entityId: employee.id,
    newValue: { name: employee.name, email: employee.email, role: employee.role },
  });

  return sanitize(employee);
}

async function update(id, data, actingUser) {
  const employee = await employeeRepository.findById(id);
  if (!employee) throw new HttpError(404, "Employee not found");

  await assertCanManage(employee, actingUser);

  const { status, name, role, ...profileFields } = data;
  const userData = {};
  if (status !== undefined) userData.status = status;
  if (name !== undefined) userData.name = name;
  if (role !== undefined) userData.role = role;

  if (Object.keys(userData).length > 0) {
    await employeeRepository.updateUser(id, userData);
  }
  if (Object.keys(profileFields).length > 0) {
    await employeeRepository.updateProfile(id, profileFields);
  }

  const updated = await employeeRepository.findById(id);

  await logAudit(null, {
    userId: actingUser.id,
    action: status !== undefined ? "STATUS_CHANGE" : "UPDATE",
    entityType: "Employee",
    entityId: id,
    oldValue: { role: employee.role, status: employee.status },
    newValue: { role: updated.role, status: updated.status },
  });

  return sanitize(updated);
}

async function assign(id, data, actingUser) {
  const employee = await employeeRepository.findById(id);
  if (!employee) throw new HttpError(404, "Employee not found");

  await assertCanManage(employee, actingUser);

  if (!ADMIN_ROLES.includes(actingUser.role) && data.warehouseId) {
    const warehouseIds = await resolveWarehouseScope(actingUser);
    if (!warehouseIds.includes(data.warehouseId)) {
      throw new HttpError(403, "You can only assign employees to your own warehouse.");
    }
  }

  await employeeRepository.updateProfile(id, data);
  const updated = await employeeRepository.findById(id);

  await logAudit(null, {
    userId: actingUser.id,
    action: "UPDATE",
    entityType: "Employee",
    entityId: id,
    oldValue: { departmentId: employee.employeeProfile?.department?.id ?? null },
    newValue: data,
  });

  return sanitize(updated);
}

module.exports = { list, getById, create, update, assign };
