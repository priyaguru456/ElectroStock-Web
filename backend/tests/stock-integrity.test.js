const { app, request, prisma, createUser, loginAs, createFixtures } = require("./helpers");

let adminToken;
let fixtures;

beforeAll(async () => {
  const { user, password } = await createUser("SUPER_ADMIN");
  adminToken = await loginAs(user.email, password);
  fixtures = await createFixtures(adminToken);
});

afterAll(async () => {
  await prisma.$disconnect();
});

function authed(req) {
  return req.set("Authorization", `Bearer ${adminToken}`);
}

async function getStock(productId, warehouseId) {
  const res = await authed(request(app).get(`/api/inventory?productId=${productId}&warehouseId=${warehouseId}`));
  return res.body.data[0]?.quantity ?? 0;
}

describe("Duplicate SKU", () => {
  test("creating a product with an existing SKU is rejected", async () => {
    const res = await authed(request(app).post("/api/products")).send({
      sku: fixtures.product.sku,
      name: "Duplicate SKU attempt",
      unit: "pcs",
      unitPrice: 1,
    });

    expect(res.status).toBe(400);
  });
});

describe("Purchase → receive increases stock", () => {
  test("receiving a purchase order increases inventory by exactly the received quantity", async () => {
    const before = await getStock(fixtures.product.id, fixtures.warehouseA.id);

    const po = (
      await authed(request(app).post("/api/purchases")).send({
        supplierId: fixtures.supplier.id,
        warehouseId: fixtures.warehouseA.id,
        items: [{ productId: fixtures.product.id, quantity: 50, unitCost: 1 }],
      })
    ).body.data;

    await authed(request(app).post(`/api/purchases/${po.id}/order`));

    const receiveRes = await authed(request(app).post(`/api/purchases/${po.id}/receive`)).send({
      items: [{ itemId: po.items[0].id, quantityReceived: 50 }],
    });

    expect(receiveRes.status).toBe(200);
    expect(receiveRes.body.data.status).toBe("RECEIVED");

    const after = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(after).toBe(before + 50);
  });

  test("over-receiving beyond the ordered quantity is rejected and stock is unchanged", async () => {
    const before = await getStock(fixtures.product.id, fixtures.warehouseA.id);

    const po = (
      await authed(request(app).post("/api/purchases")).send({
        supplierId: fixtures.supplier.id,
        warehouseId: fixtures.warehouseA.id,
        items: [{ productId: fixtures.product.id, quantity: 10, unitCost: 1 }],
      })
    ).body.data;
    await authed(request(app).post(`/api/purchases/${po.id}/order`));

    const res = await authed(request(app).post(`/api/purchases/${po.id}/receive`)).send({
      items: [{ itemId: po.items[0].id, quantityReceived: 999 }],
    });

    expect(res.status).toBe(400);
    const after = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(after).toBe(before);
  });
});

describe("Stock adjustments cannot go negative", () => {
  test("an adjustment that would take stock below zero is rejected", async () => {
    const before = await getStock(fixtures.product.id, fixtures.warehouseA.id);

    const res = await authed(request(app).post("/api/inventory/adjustments")).send({
      productId: fixtures.product.id,
      warehouseId: fixtures.warehouseA.id,
      quantityChange: -(before + 1000),
      reason: "LOSS",
    });

    expect(res.status).toBe(400);
    const after = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(after).toBe(before);
  });

  test("a valid adjustment changes stock by exactly the requested amount", async () => {
    const before = await getStock(fixtures.product.id, fixtures.warehouseA.id);

    await authed(request(app).post("/api/inventory/adjustments")).send({
      productId: fixtures.product.id,
      warehouseId: fixtures.warehouseA.id,
      quantityChange: -5,
      reason: "RECOUNT",
    });

    const after = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(after).toBe(before - 5);
  });

  test("an adjustment without a reason is rejected", async () => {
    const res = await authed(request(app).post("/api/inventory/adjustments")).send({
      productId: fixtures.product.id,
      warehouseId: fixtures.warehouseA.id,
      quantityChange: 5,
    });

    expect(res.status).toBe(400);
  });
});

describe("Sales confirmation decreases stock, insufficient stock is rejected", () => {
  test("confirming a sales order decreases stock by exactly the ordered quantity", async () => {
    const before = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(before).toBeGreaterThanOrEqual(5);

    const so = (
      await authed(request(app).post("/api/sales")).send({
        customerId: fixtures.customer.id,
        warehouseId: fixtures.warehouseA.id,
        items: [{ productId: fixtures.product.id, quantity: 5, unitPrice: 2 }],
      })
    ).body.data;

    const confirmRes = await authed(request(app).post(`/api/sales/${so.id}/confirm`));
    expect(confirmRes.status).toBe(200);

    const after = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(after).toBe(before - 5);
  });

  test("confirming a sales order for more than available stock is rejected, stock unchanged", async () => {
    const before = await getStock(fixtures.product.id, fixtures.warehouseA.id);

    const so = (
      await authed(request(app).post("/api/sales")).send({
        customerId: fixtures.customer.id,
        warehouseId: fixtures.warehouseA.id,
        items: [{ productId: fixtures.product.id, quantity: before + 1000, unitPrice: 2 }],
      })
    ).body.data;

    const confirmRes = await authed(request(app).post(`/api/sales/${so.id}/confirm`));
    expect(confirmRes.status).toBe(400);

    const after = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(after).toBe(before);
  });

  test("cancelling a CONFIRMED sales order restores the stock it took", async () => {
    const before = await getStock(fixtures.product.id, fixtures.warehouseA.id);

    const so = (
      await authed(request(app).post("/api/sales")).send({
        customerId: fixtures.customer.id,
        warehouseId: fixtures.warehouseA.id,
        items: [{ productId: fixtures.product.id, quantity: 3, unitPrice: 2 }],
      })
    ).body.data;

    await authed(request(app).post(`/api/sales/${so.id}/confirm`));
    const afterConfirm = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(afterConfirm).toBe(before - 3);

    await authed(request(app).post(`/api/sales/${so.id}/cancel`));
    const afterCancel = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    expect(afterCancel).toBe(before);
  });
});

describe("Stock transfers", () => {
  test("a transfer moves stock out of the source and into the destination atomically", async () => {
    const beforeA = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    const beforeB = await getStock(fixtures.product.id, fixtures.warehouseB.id);
    expect(beforeA).toBeGreaterThanOrEqual(4);

    const transfer = (
      await authed(request(app).post("/api/transfers")).send({
        sourceWarehouseId: fixtures.warehouseA.id,
        destinationWarehouseId: fixtures.warehouseB.id,
        items: [{ productId: fixtures.product.id, quantity: 4 }],
      })
    ).body.data;

    const completeRes = await authed(request(app).post(`/api/transfers/${transfer.id}/complete`));
    expect(completeRes.status).toBe(200);

    expect(await getStock(fixtures.product.id, fixtures.warehouseA.id)).toBe(beforeA - 4);
    expect(await getStock(fixtures.product.id, fixtures.warehouseB.id)).toBe(beforeB + 4);
  });

  test("a transfer exceeding available source stock is rejected, neither side changes", async () => {
    const beforeA = await getStock(fixtures.product.id, fixtures.warehouseA.id);
    const beforeB = await getStock(fixtures.product.id, fixtures.warehouseB.id);

    const transfer = (
      await authed(request(app).post("/api/transfers")).send({
        sourceWarehouseId: fixtures.warehouseA.id,
        destinationWarehouseId: fixtures.warehouseB.id,
        items: [{ productId: fixtures.product.id, quantity: beforeA + 1000 }],
      })
    ).body.data;

    const completeRes = await authed(request(app).post(`/api/transfers/${transfer.id}/complete`));
    expect(completeRes.status).toBe(400);

    expect(await getStock(fixtures.product.id, fixtures.warehouseA.id)).toBe(beforeA);
    expect(await getStock(fixtures.product.id, fixtures.warehouseB.id)).toBe(beforeB);
  });

  test("source and destination warehouse must differ", async () => {
    const res = await authed(request(app).post("/api/transfers")).send({
      sourceWarehouseId: fixtures.warehouseA.id,
      destinationWarehouseId: fixtures.warehouseA.id,
      items: [{ productId: fixtures.product.id, quantity: 1 }],
    });

    expect(res.status).toBe(400);
  });
});
