const { app, request, prisma, createUser, loginAs } = require("./helpers");

// The login endpoint is rate-limited (max 10 attempts / 15 min) per app instance, and Jest
// gives this file its own module registry (its own app + limiter). Keep logins to one per
// distinct actor and reuse tokens across tests to stay well under that cap.
let adminToken;
let genericStaffToken;

beforeAll(async () => {
  const admin = await createUser("ADMIN");
  adminToken = await loginAs(admin.user.email, admin.password);

  const staff = await createUser("WAREHOUSE_STAFF");
  genericStaffToken = await loginAs(staff.user.email, staff.password);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Departments", () => {
  test("ADMIN can create a department", async () => {
    const res = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Packing ${Date.now()}` });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toContain("Packing");
  });

  test("WAREHOUSE_STAFF cannot create a department (403)", async () => {
    const res = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${genericStaffToken}`)
      .send({ name: `Dispatch ${Date.now()}` });

    expect(res.status).toBe(403);
  });

  test("creating a duplicate department name fails", async () => {
    const name = `Delivery ${Date.now()}`;

    await request(app).post("/api/departments").set("Authorization", `Bearer ${adminToken}`).send({ name });
    const res = await request(app).post("/api/departments").set("Authorization", `Bearer ${adminToken}`).send({ name });

    expect(res.status).toBe(400);
  });
});

describe("Shifts", () => {
  test("ADMIN can create a shift with valid HH:MM times", async () => {
    const res = await request(app)
      .post("/api/shifts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Morning ${Date.now()}`, startTime: "06:00", endTime: "14:00" });

    expect(res.status).toBe(201);
  });

  test("creating a shift with an invalid time format fails validation", async () => {
    const res = await request(app)
      .post("/api/shifts")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Bad Shift ${Date.now()}`, startTime: "6am", endTime: "2pm" });

    expect(res.status).toBe(400);
  });
});

describe("Employees", () => {
  test("ADMIN creating an employee also creates an EmployeeProfile with a generated employeeCode", async () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;

    const res = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Employee",
        email: `employee.${suffix}@test.local`,
        password: "TestPass123!",
        role: "WAREHOUSE_STAFF",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.employeeProfile).toBeTruthy();
    expect(res.body.data.employeeProfile.employeeCode).toMatch(/^EMP\d{5}$/);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  test("WAREHOUSE_STAFF cannot create an employee (403)", async () => {
    const res = await request(app)
      .post("/api/employees")
      .set("Authorization", `Bearer ${genericStaffToken}`)
      .send({
        name: "Nope",
        email: `nope.${Date.now()}@test.local`,
        password: "TestPass123!",
        role: "WAREHOUSE_STAFF",
      });

    expect(res.status).toBe(403);
  });

  test("an employee can view their own record", async () => {
    const { user, password } = await createUser("WAREHOUSE_STAFF");
    const token = await loginAs(user.email, password);
    await prisma.employeeProfile.create({ data: { userId: user.id, employeeCode: `EMPV${user.id}` } });

    const res = await request(app).get(`/api/employees/${user.id}`).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  test("an employee cannot view another unrelated employee's record", async () => {
    // genericStaffToken belongs to a WAREHOUSE_STAFF with no reports and no matching role scope.
    const { user: target } = await createUser("SALES_STAFF");
    await prisma.employeeProfile.create({ data: { userId: target.id, employeeCode: `EMPT${target.id}` } });

    const res = await request(app)
      .get(`/api/employees/${target.id}`)
      .set("Authorization", `Bearer ${genericStaffToken}`);

    expect(res.status).toBe(403);
  });

  test("a WAREHOUSE_MANAGER can only view/manage WAREHOUSE_STAFF assigned to their own warehouse", async () => {
    const { user: manager, password: managerPassword } = await createUser("WAREHOUSE_MANAGER");
    const managerToken = await loginAs(manager.email, managerPassword);

    const warehouseA = (
      await request(app)
        .post("/api/warehouses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Scope Test Warehouse A ${Date.now()}` })
    ).body.data;
    const warehouseB = (
      await request(app)
        .post("/api/warehouses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Scope Test Warehouse B ${Date.now()}` })
    ).body.data;

    await request(app)
      .post(`/api/warehouses/${warehouseA.id}/staff`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: manager.id });

    const { user: staffInScope } = await createUser("WAREHOUSE_STAFF");
    await prisma.employeeProfile.create({
      data: { userId: staffInScope.id, employeeCode: `EMPA${staffInScope.id}`, warehouseId: warehouseA.id },
    });

    const { user: staffOutOfScope } = await createUser("WAREHOUSE_STAFF");
    await prisma.employeeProfile.create({
      data: { userId: staffOutOfScope.id, employeeCode: `EMPB${staffOutOfScope.id}`, warehouseId: warehouseB.id },
    });

    const inScopeRes = await request(app)
      .get(`/api/employees/${staffInScope.id}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(inScopeRes.status).toBe(200);

    const outOfScopeRes = await request(app)
      .get(`/api/employees/${staffOutOfScope.id}`)
      .set("Authorization", `Bearer ${managerToken}`);
    expect(outOfScopeRes.status).toBe(403);

    const listRes = await request(app).get("/api/employees").set("Authorization", `Bearer ${managerToken}`);
    const listedIds = listRes.body.data.items.map((i) => i.id);
    expect(listedIds).toContain(staffInScope.id);
    expect(listedIds).not.toContain(staffOutOfScope.id);
  });
});

describe("Attendance", () => {
  test("check-in then duplicate check-in is rejected (409)", async () => {
    const { user, password } = await createUser("WAREHOUSE_STAFF");
    const token = await loginAs(user.email, password);

    const first = await request(app).post("/api/attendance/check-in").set("Authorization", `Bearer ${token}`);
    expect(first.status).toBe(200);
    expect(first.body.data.checkInAt).toBeTruthy();

    const second = await request(app).post("/api/attendance/check-in").set("Authorization", `Bearer ${token}`);
    expect(second.status).toBe(409);
  });

  test("check-out before check-in is rejected (400)", async () => {
    const { user, password } = await createUser("WAREHOUSE_STAFF");
    const token = await loginAs(user.email, password);

    const res = await request(app).post("/api/attendance/check-out").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  test("check-in then check-out computes workingMinutes", async () => {
    const { user, password } = await createUser("WAREHOUSE_STAFF");
    const token = await loginAs(user.email, password);

    await request(app).post("/api/attendance/check-in").set("Authorization", `Bearer ${token}`);
    const res = await request(app).post("/api/attendance/check-out").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.checkOutAt).toBeTruthy();
    expect(res.body.data.workingMinutes).toBeGreaterThanOrEqual(0);
  });
});

describe("Warehouse tasks", () => {
  test("manager can create and assign a task; assignee can complete it", async () => {
    const { user: staff, password: staffPassword } = await createUser("WAREHOUSE_STAFF");
    const staffToken = await loginAs(staff.email, staffPassword);

    const warehouse = (
      await request(app)
        .post("/api/warehouses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Task Test Warehouse ${Date.now()}` })
    ).body.data;

    const created = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Pick order", type: "PICKING", warehouseId: warehouse.id });

    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("PENDING");

    const assigned = await request(app)
      .patch(`/api/tasks/${created.body.data.id}/assign`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ assignedToId: staff.id });

    expect(assigned.status).toBe(200);
    expect(assigned.body.data.status).toBe("ASSIGNED");

    const completed = await request(app)
      .patch(`/api/tasks/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "COMPLETED" });

    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe("COMPLETED");
    expect(completed.body.data.completedAt).toBeTruthy();
  });

  test("an unrelated staff member cannot update someone else's task status (403)", async () => {
    const { user: staffB } = await createUser("WAREHOUSE_STAFF");

    const warehouse = (
      await request(app)
        .post("/api/warehouses")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: `Task Test Warehouse B ${Date.now()}` })
    ).body.data;

    const created = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Pack order", type: "PACKING", warehouseId: warehouse.id, assignedToId: staffB.id });

    const res = await request(app)
      .patch(`/api/tasks/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${genericStaffToken}`)
      .send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(403);
  });
});
