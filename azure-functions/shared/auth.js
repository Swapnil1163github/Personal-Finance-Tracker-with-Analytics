const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

let cachedClient = null;

function getClient() {
  if (!cachedClient) {
    const tenantId = process.env.AUTH_TENANT_ID;
    if (!tenantId) throw new Error("AUTH_TENANT_ID is not configured.");

    cachedClient = jwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: true,
      rateLimit: true,
    });
  }
  return cachedClient;
}

function getSigningKey(header, callback) {
  getClient().getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, key.getPublicKey());
  });
}

function verifyToken(token, options) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getSigningKey, options, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}

async function authenticate(req) {
  if (process.env.REQUIRE_AUTH !== "true") {
    return { userId: req.query.userId || req.body?.userId || "demo-user-001" };
  }

  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    const err = new Error("Missing bearer token.");
    err.status = 401;
    throw err;
  }

  const tenantId = process.env.AUTH_TENANT_ID;
  const audience = process.env.AUTH_AUDIENCE;

  const decoded = await verifyToken(token, {
    algorithms: ["RS256"],
    audience,
    issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
  });

  return {
    userId: decoded.oid || decoded.sub,
    name: decoded.name,
    email: decoded.preferred_username || decoded.email,
    claims: decoded,
  };
}

module.exports = {
  authenticate,
};
