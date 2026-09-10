const { app, request, prisma, createUser, loginAs } = require("./helpers");

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Authentication", () => {
  test("login succeeds with correct credentials and returns a token", async () => {
    const { user, password } = await createUser("ADMIN");

    const res = await request(app).post("/api/auth/login").send({ email: user.email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe(user.email);
  });

  test("login fails with wrong password", async () => {
    const { user } = await createUser("ADMIN");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("login fails for a deactivated user", async () => {
    const { user, password } = await createUser("ADMIN");
    await prisma.user.update({ where: { id: user.id }, data: { status: "RESIGNED" } });

    const res = await request(app).post("/api/auth/login").send({ email: user.email, password });

    expect(res.status).toBe(401);
  });

  test("a protected route rejects a request with no token", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  test("a protected route rejects an invalid token", async () => {
    const res = await request(app).get("/api/users").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  test("/auth/me returns the current user for a valid token", async () => {
    const { user, password } = await createUser("ADMIN");
    const token = await loginAs(user.email, password);

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });
});

describe("Authorization", () => {
  test("WAREHOUSE_STAFF cannot create a purchase order (403)", async () => {
    const { user, password } = await createUser("WAREHOUSE_STAFF");
    const token = await loginAs(user.email, password);

    const res = await request(app)
      .post("/api/purchases")
      .set("Authorization", `Bearer ${token}`)
      .send({ supplierId: 1, warehouseId: 1, items: [{ productId: 1, quantity: 1, unitCost: 1 }] });

    expect(res.status).toBe(403);
  });

  test("SALES_STAFF cannot access the Users list (403)", async () => {
    const { user, password } = await createUser("SALES_STAFF");
    const token = await loginAs(user.email, password);

    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("ADMIN can access the Users list", async () => {
    const { user, password } = await createUser("ADMIN");
    const token = await loginAs(user.email, password);

    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
