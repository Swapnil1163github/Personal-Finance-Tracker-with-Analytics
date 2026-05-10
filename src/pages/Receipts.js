import React, { useState, useRef } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import azureConfig from "../azureConfig";

async function extractWithAzure(file, token) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${azureConfig.apiBaseUrl}/extract-receipt`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    let message = `Receipt extraction failed with ${res.status}`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // Ignore invalid error JSON.
    }
    throw new Error(message);
  }

  return res.json();
}

function ReceiptCard({ receipt, onAddTransaction }) {
  const statusLabel = {
    processing: "Processing",
    extracted: "Extracted",
    error: "Failed",
  }[receipt.status] || "Pending";

  const statusColor = {
    processing: "rgba(245,158,11,0.9)",
    extracted: "rgba(16,185,129,0.9)",
    error: "rgba(239,68,68,0.9)",
  }[receipt.status] || "rgba(100,116,139,0.9)";

  return (
    <div style={{
      background: "rgba(30,41,59,0.7)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{
        height: 140,
        background: "rgba(15,23,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {receipt.previewUrl ? (
          <img src={receipt.previewUrl} alt="receipt" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
        ) : (
          <div style={{ fontSize: 40, opacity: 0.35, color: "#94a3b8" }}>PDF</div>
        )}
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: statusColor,
          borderRadius: 20,
          padding: "3px 10px",
          fontSize: 10,
          fontWeight: 600,
          color: "#fff",
          fontFamily: "sans-serif",
        }}>
          {statusLabel}
        </div>
      </div>

      <div style={{ padding: "14px 16px" }}>
        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, marginBottom: 6, fontFamily: "sans-serif" }}>{receipt.name}</div>

        {receipt.status === "processing" && (
          <div style={{ color: "#fbbf24", fontSize: 12, fontFamily: "sans-serif", marginBottom: 10 }}>
            Azure Document Intelligence is extracting data...
          </div>
        )}

        {receipt.status === "error" && (
          <div style={{ color: "#f87171", fontSize: 12, fontFamily: "sans-serif", marginBottom: 10, lineHeight: 1.5 }}>
            {receipt.error || "Could not extract this receipt."}
          </div>
        )}

        {receipt.status === "extracted" && receipt.extracted && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              {[
                { label: "Merchant", value: receipt.extracted.merchant },
                { label: "Amount", value: `Rs. ${receipt.extracted.amount}` },
                { label: "Date", value: receipt.extracted.date },
                { label: "Category", value: receipt.extracted.category },
              ].map((field) => (
                <div key={field.label}>
                  <div style={{ color: "#475569", fontSize: 10, fontFamily: "sans-serif", textTransform: "uppercase" }}>{field.label}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12, fontFamily: "sans-serif", fontWeight: 500 }}>{field.value}</div>
                </div>
              ))}
            </div>
            <div style={{ color: "#10b981", fontSize: 10, fontFamily: "sans-serif" }}>
              AI Confidence: {Math.round(Number(receipt.extracted.confidence || 0) * 100)}%
            </div>
          </div>
        )}

        {receipt.status === "extracted" && !receipt.added && (
          <button
            onClick={() => onAddTransaction(receipt)}
            style={{
              width: "100%",
              padding: "8px",
              background: "linear-gradient(135deg, #10b981, #3b82f6)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "sans-serif",
            }}
          >
            + Add to Transactions
          </button>
        )}

        {receipt.added && (
          <div style={{ color: "#10b981", fontSize: 12, textAlign: "center", fontFamily: "sans-serif" }}>Added to transactions</div>
        )}
      </div>
    </div>
  );
}

export default function Receipts() {
  const { addTransaction } = useData();
  const { getAccessToken } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const processFile = async (file) => {
    if (!file.type.match(/image\/*/) && file.type !== "application/pdf") return;

    const id = Date.now() + Math.random();
    const previewUrl = file.type.match(/image\/.*/) ? URL.createObjectURL(file) : null;

    setReceipts((prev) => [
      { id, name: file.name, status: "processing", previewUrl, extracted: null, added: false, error: null },
      ...prev,
    ]);

    try {
      const token = await getAccessToken();
      const extracted = await extractWithAzure(file, token);
      setReceipts((prev) => prev.map((receipt) => (
        receipt.id === id ? { ...receipt, status: "extracted", extracted } : receipt
      )));
    } catch (err) {
      console.error("Receipt extraction failed:", err);
      setReceipts((prev) => prev.map((receipt) => (
        receipt.id === id ? { ...receipt, status: "error", error: err.message } : receipt
      )));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  };

  const handleAddTransaction = async (receipt) => {
    await addTransaction({
      type: "expense",
      amount: Number(receipt.extracted.amount || 0),
      category: receipt.extracted.category,
      description: `Receipt: ${receipt.extracted.merchant}`,
      date: receipt.extracted.date,
      receipt: receipt.name,
      receiptBlobUrl: receipt.extracted.blobUrl,
      receiptBlobName: receipt.extracted.blobName,
    });
    setReceipts((prev) => prev.map((item) => (
      item.id === receipt.id ? { ...item, added: true } : item
    )));
  };

  return (
    <div style={{ padding: "28px 32px", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 6px" }}>Receipt Manager</h1>
      <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 24px" }}>Upload receipts and extract amount, merchant, and date automatically</p>

      <div style={{
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 24,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}>
        <span style={{ fontSize: 22, color: "#93c5fd" }}>AI</span>
        <div>
          <div style={{ color: "#93c5fd", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Azure Document Intelligence + Blob Storage</div>
          <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>
            Running live on Azure. Files upload to Blob Storage, then the prebuilt receipt model extracts real transaction fields through Azure Functions.
          </div>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? "#3b82f6" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 14,
          padding: "44px 32px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "rgba(59,130,246,0.06)" : "rgba(30,41,59,0.4)",
          transition: "all 0.2s",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 34, marginBottom: 12, color: "#94a3b8" }}>Upload</div>
        <div style={{ color: "#94a3b8", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop receipts here or click to upload</div>
        <div style={{ color: "#475569", fontSize: 12 }}>Supports JPG, PNG, and PDF</div>
        <input ref={fileRef} type="file" accept="image/*,.pdf" multiple onChange={(e) => Array.from(e.target.files).forEach(processFile)} style={{ display: "none" }} />
      </div>

      {receipts.length > 0 && (
        <>
          <h3 style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 16px" }}>
            Uploaded Receipts ({receipts.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} onAddTransaction={handleAddTransaction} />
            ))}
          </div>
        </>
      )}

      {receipts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#334155" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.6 }}>No files</div>
          <div style={{ fontSize: 14 }}>No receipts uploaded yet</div>
        </div>
      )}
    </div>
  );
}
