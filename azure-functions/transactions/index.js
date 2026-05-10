// Azure Function - HTTP trigger for transaction CRUD.
// Routes:
//   GET    /api/transactions?userId=demo-user-001
//   POST   /api/transactions
//   PUT    /api/transactions/{id}
//   DELETE /api/transactions/{id}?userId=demo-user-001

const { CosmosClient } = require("@azure/cosmos");
const { randomUUID } = require("crypto");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

function getContainer() {
  if (!process.env.COSMOS_CONNECTION_STRING) {
    throw new Error("COSMOS_CONNECTION_STRING is not configured.");
  }

  const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  const database = client.database(process.env.COSMOS_DATABASE || "financedb");
  return database.container(process.env.COSMOS_CONTAINER || "transactions");
}

function send(status, body = null) {
  return {
    status,
    headers,
    body: body === null ? undefined : JSON.stringify(body),
  };
}

function getUserId(req) {
  return req.query.userId || req.body?.userId || "demo-user-001";
}

module.exports = async function (context, req) {
  const method = req.method.toUpperCase();
  const id = req.params?.id;

  if (method === "OPTIONS") {
    context.res = send(204);
    return;
  }

  try {
    const container = getContainer();

    if (method === "GET") {
      const userId = getUserId(req);
      const { resources } = await container.items
        .query({
          query: "SELECT * FROM c WHERE c.userId = @uid ORDER BY c.date DESC",
          parameters: [{ name: "@uid", value: userId }],
        })
        .fetchAll();
      context.res = send(200, resources);
      return;
    }

    if (method === "POST") {
      const body = req.body || {};
      if (!body.amount || !body.type || !body.category || !body.date) {
        context.res = send(400, { error: "amount, type, category, and date are required." });
        return;
      }

      const item = {
        ...body,
        id: randomUUID(),
        userId: getUserId(req),
        amount: Number(body.amount),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { resource } = await container.items.create(item);
      context.res = send(201, resource);
      return;
    }

    if (method === "PUT" && id) {
      const userId = getUserId(req);
      const body = req.body || {};
      const { resource: existing } = await container.item(id, userId).read();

      if (!existing) {
        context.res = send(404, { error: "Transaction not found." });
        return;
      }

      const updated = {
        ...existing,
        ...body,
        id,
        userId,
        amount: body.amount === undefined ? existing.amount : Number(body.amount),
        updatedAt: new Date().toISOString(),
      };
      const { resource } = await container.item(id, userId).replace(updated);
      context.res = send(200, resource);
      return;
    }

    if (method === "DELETE" && id) {
      const userId = getUserId(req);
      await container.item(id, userId).delete();
      context.res = send(204);
      return;
    }

    context.res = send(405, { error: "Method not allowed." });
  } catch (err) {
    context.log.error("Transaction API error:", err);
    context.res = send(500, { error: err.message });
  }
};
