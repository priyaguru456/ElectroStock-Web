const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "TEAM_LEADER",
  "WAREHOUSE_STAFF",
  "SALES_MANAGER",
  "SALES_STAFF",
  "TELECALLER",
];

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const WAREHOUSE_MANAGING_ROLES = ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"];
const SALES_ROLES = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "SALES_STAFF", "TELECALLER"];

const MANAGED_ROLES_BY_MANAGER = {
  SALES_MANAGER: ["SALES_STAFF", "TELECALLER"],
  WAREHOUSE_MANAGER: ["WAREHOUSE_STAFF", "TEAM_LEADER"],
  TEAM_LEADER: ["WAREHOUSE_STAFF"],
};

const USER_MANAGING_ROLES = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "WAREHOUSE_MANAGER"];

// Employee Management: who can create/deactivate employees and manage master data
// (departments/shifts). Team leaders can assign/manage their own reports but not
// create or deactivate employee accounts.
const EMPLOYEE_MANAGING_ROLES = ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"];

// Employee Management: who can view/manage employees, departments, shifts, and
// warehouse tasks beyond their own record (adds TEAM_LEADER to USER_MANAGING_ROLES
// scope, since a team leader manages a subset of staff but doesn't create users).
const EMPLOYEE_VIEWING_ROLES = ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "TEAM_LEADER"];

module.exports = {
  ROLES,
  ADMIN_ROLES,
  WAREHOUSE_MANAGING_ROLES,
  SALES_ROLES,
  MANAGED_ROLES_BY_MANAGER,
  USER_MANAGING_ROLES,
  EMPLOYEE_MANAGING_ROLES,
  EMPLOYEE_VIEWING_ROLES,
};
