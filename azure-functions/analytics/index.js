// Azure Function - returns analytics generated from Cosmos DB transactions.
// Route: GET /api/analytics?userId=demo-user-001&months=6

const { CosmosClient } = require("@azure/cosmos");
const { authenticate } = require("../shared/auth");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
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

module.exports = async function (context, req) {
  if (req.method.toUpperCase() === "OPTIONS") {
    context.res = send(204);
    return;
  }

  const userId = req.query.userId || "demo-user-001";
  const months = Math.max(1, Math.min(parseInt(req.query.months || "6", 10), 24));

  try {
    req.auth = await authenticate(req);
    const authenticatedUserId = req.auth.userId || userId;
    const container = getContainer();
    const { resources: txns } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @uid",
        parameters: [{ name: "@uid", value: authenticatedUserId }],
      })
      .fetchAll();

    const now = new Date();
    const monthly = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const monthTxns = txns.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const income = monthTxns
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const expense = monthTxns
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      monthly.push({ label, income, expense, savings: income - expense });
    }

    const catMap = {};
    txns
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount || 0);
      });

    const categoryBreakdown = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    context.res = send(200, {
      monthly,
      categoryBreakdown,
      totalTransactions: txns.length,
    });
  } catch (err) {
    context.log.error("Analytics API error:", err);
    context.res = send(err.status || 500, { error: err.message });
  }
};
