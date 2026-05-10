// Azure Function - extracts receipt data with Azure Document Intelligence,
// then stores the original file in Azure Blob Storage.

const { DocumentAnalysisClient, AzureKeyCredential } = require("@azure/ai-form-recognizer");
const { BlobServiceClient } = require("@azure/storage-blob");
const multipart = require("parse-multipart-data");
const { randomUUID } = require("crypto");
const { authenticate } = require("../shared/auth");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

function send(status, body = null) {
  return {
    status,
    headers,
    body: body === null ? undefined : JSON.stringify(body),
  };
}

function requireSetting(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is not configured.`);
  }
  return process.env[name];
}

module.exports = async function (context, req) {
  if (req.method.toUpperCase() === "OPTIONS") {
    context.res = send(204);
    return;
  }

  try {
    req.auth = await authenticate(req);
    const contentType = req.headers["content-type"] || req.headers["Content-Type"] || "";
    const boundary = contentType.split("boundary=")[1];

    if (!boundary) {
      context.res = send(400, { error: "Expected multipart/form-data upload." });
      return;
    }

    const parts = multipart.parse(req.rawBody, boundary);
    const filePart = parts.find((part) => part.filename);

    if (!filePart) {
      context.res = send(400, { error: "No file uploaded." });
      return;
    }

    const blobClient = BlobServiceClient.fromConnectionString(
      requireSetting("AZURE_STORAGE_CONNECTION_STRING")
    );
    const containerClient = blobClient.getContainerClient(process.env.BLOB_CONTAINER_NAME || "receipts");
    await containerClient.createIfNotExists();

    const safeFileName = filePart.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blobName = `${randomUUID()}-${safeFileName}`;
    const blockBlob = containerClient.getBlockBlobClient(blobName);
    await blockBlob.upload(filePart.data, filePart.data.length, {
      blobHTTPHeaders: { blobContentType: filePart.type },
    });

    const docClient = new DocumentAnalysisClient(
      requireSetting("DOCUMENT_INTELLIGENCE_ENDPOINT"),
      new AzureKeyCredential(requireSetting("DOCUMENT_INTELLIGENCE_KEY"))
    );
    const poller = await docClient.beginAnalyzeDocument("prebuilt-receipt", filePart.data);
    const { documents } = await poller.pollUntilDone();

    if (!documents || documents.length === 0) {
      context.res = send(422, { error: "Could not extract receipt data." });
      return;
    }

    const receipt = documents[0].fields;
    const extracted = {
      merchant: receipt.MerchantName?.value || "Unknown Merchant",
      amount: receipt.Total?.value || 0,
      date: receipt.TransactionDate?.value
        ? new Date(receipt.TransactionDate.value).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      currency: receipt.Total?.valueCurrency || "INR",
      confidence: documents[0].confidence,
      blobUrl: blockBlob.url,
      blobName,
    };

    const lowerMerchant = extracted.merchant.toLowerCase();
    if (lowerMerchant.match(/restaurant|cafe|food|zomato|swiggy|mcdon/)) {
      extracted.category = "Food & Dining";
    } else if (lowerMerchant.match(/uber|ola|petrol|fuel|rapido/)) {
      extracted.category = "Transportation";
    } else if (lowerMerchant.match(/amazon|flipkart|myntra|mall|store/)) {
      extracted.category = "Shopping";
    } else if (lowerMerchant.match(/netflix|spotify|prime|hotstar/)) {
      extracted.category = "Subscriptions";
    } else if (lowerMerchant.match(/hospital|clinic|pharmacy|medic/)) {
      extracted.category = "Healthcare";
    } else {
      extracted.category = "Other Expense";
    }

    context.res = send(200, extracted);
  } catch (err) {
    context.log.error("Receipt extraction error:", err);
    context.res = send(err.status || 500, { error: err.message });
  }
};
