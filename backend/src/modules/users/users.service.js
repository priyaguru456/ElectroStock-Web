const userRepository = require("../../repositories/user.repository");
const { hashPassword } = require("../../utils/hash");
const { logAudit } = require("../../utils/auditLogger");
const HttpError = require("../../utils/httpError");
const { ADMIN_ROLES, MANAGED_ROLES_BY_MANAGER } = require("../../config/constants");

function sanitize(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

async function list(query, actingUser) {
  const { role, status, search, page, limit } = query;
  const managedRoles = MANAGED_ROLES_BY_MANAGER[actingUser.role];

  const result = await userRepository.list({
    role: managedRoles ? undefined : role,
    roleIn: managedRoles,
    status,
    search,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  return result;
}

async function getById(id) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return sanitize(user);
}

async function create(data, performedById) {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) {
    throw new HttpError(400, "A user with this email already exists");
  }

  const passwordHash = await hashPassword(data.password);
  const user = await userRepository.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role,
    status: "ACTIVE",
  });

  await logAudit(null, {
    userId: performedById,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    newValue: { name: user.name, email: user.email, role: user.role },
  });

  return sanitize(user);
}

async function update(id, data, performedById) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const demotingFromSuperAdmin = user.role === "SUPER_ADMIN" && data.role && data.role !== "SUPER_ADMIN";
  const leavingActive = user.role === "SUPER_ADMIN" && data.status && data.status !== "ACTIVE";

  if (demotingFromSuperAdmin || leavingActive) {
    const activeSuperAdmins = await userRepository.countByRoleAndStatus("SUPER_ADMIN", "ACTIVE");
    if (activeSuperAdmins <= 1) {
      throw new HttpError(400, "Cannot remove the last active SUPER_ADMIN");
    }
  }

  const updated = await userRepository.update(id, data);

  await logAudit(null, {
    userId: performedById,
    action: data.status ? "STATUS_CHANGE" : "UPDATE",
    entityType: "User",
    entityId: id,
    oldValue: { role: user.role, status: user.status },
    newValue: { role: updated.role, status: updated.status },
  });

  return sanitize(updated);
}

async function setStatus(id, status, actingUser) {
  const target = await userRepository.findById(id);
  if (!target) {
    throw new HttpError(404, "User not found");
  }

  if (!ADMIN_ROLES.includes(actingUser.role)) {
    const managedRoles = MANAGED_ROLES_BY_MANAGER[actingUser.role] || [];
    if (!managedRoles.includes(target.role)) {
      throw new HttpError(403, "You can only manage staff on your own team.");
    }
  }

  return update(id, { status }, actingUser.id);
}

module.exports = { list, getById, create, update, setStatus };
