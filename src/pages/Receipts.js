import React, { useState, useRef } from "react";
import { useData } from "../context/DataContext";

// ── Azure Document Intelligence Integration ──────────────────────────────────
// When your Azure resources are live, replace simulateExtraction() below with:
//
//   async function extractWithAzure(file) {
//     const formData = new FormData();
//     formData.append("file", file);
//     const res = await fetch(`${azureConfig.apiBaseUrl}/extract-receipt`, {
//       method: "POST",
//       headers: { Authorization: `Bearer ${yourAzureToken}` },
//       body: formData,
//     });
//     return res.json(); // { amount, date, merchant, category }
//   }
//
// Your Azure Function (Node.js) should:
//   1. Accept the multipart file
//   2. Upload to Blob Storage
//   3. Call Azure Document Intelligence prebuilt-receipt model
//   4. Return extracted fields as JSON
// ─────────────────────────────────────────────────────────────────────────────

async function simulateExtraction(file) {
  // Simulates what Azure Document Intelligence returns for a receipt image
  await new Promise(r => setTimeout(r, 1800)); // fake processing delay
  return {
    merchant: ["Reliance Fresh", "DMart", "Cafe Coffee Day", "Swiggy", "Zomato", "Amazon"][Math.floor(Math.random() * 6)],
    amount: Math.round(Math.random() * 2000 + 100),
    date: new Date().toISOString().split("T")[0],
    category: ["Food & Dining", "Shopping", "Transportation", "Entertainment"][Math.floor(Math.random() * 4)],
    confidence: (0.85 + Math.random() * 0.12).toFixed(2),
  };
}

function ReceiptCard({ receipt, onAddTransaction }) {
  return (
    <div style={{
      background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Preview */}
      <div style={{
        height: 140, background: "rgba(15,23,42,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {receipt.previewUrl ? (
          <img src={receipt.previewUrl} alt="receipt" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
        ) : (
          <div style={{ fontSize: 48, opacity: 0.3 }}>🧾</div>
        )}
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: receipt.status === "extracted" ? "rgba(16,185,129,0.9)" : receipt.status === "processing" ? "rgba(245,158,11,0.9)" : "rgba(100,116,139,0.9)",
          borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#fff", fontFamily: "sans-serif",
        }}>
          {receipt.status === "extracted" ? "✓ Extracted" : receipt.status === "processing" ? "⟳ Processing..." : "Pending"}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, marginBottom: 6, fontFamily: "sans-serif" }}>{receipt.name}</div>

        {receipt.status === "extracted" && receipt.extracted && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              {[
                { label: "Merchant", value: receipt.extracted.merchant },
                { label: "Amount",   value: `₹${receipt.extracted.amount}` },
                { label: "Date",     value: receipt.extracted.date },
                { label: "Category", value: receipt.extracted.category },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ color: "#475569", fontSize: 10, fontFamily: "sans-serif", textTransform: "uppercase" }}>{f.label}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12, fontFamily: "sans-serif", fontWeight: 500 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ color: "#10b981", fontSize: 10, fontFamily: "sans-serif" }}>
              AI Confidence: {(receipt.extracted.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}

        {receipt.status === "processing" && (
          <div style={{ color: "#fbbf24", fontSize: 12, fontFamily: "sans-serif", marginBottom: 10 }}>
            Azure Document Intelligence is extracting data...
          </div>
        )}

        {receipt.status === "extracted" && !receipt.added && (
          <button
            onClick={() => onAddTransaction(receipt)}
            style={{
              width: "100%", padding: "8px", background: "linear-gradient(135deg, #10b981, #3b82f6)",
              border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "sans-serif",
            }}
          >
            + Add to Transactions
          </button>
        )}
        {receipt.added && (
          <div style={{ color: "#10b981", fontSize: 12, textAlign: "center", fontFamily: "sans-serif" }}>✓ Added to transactions</div>
        )}
      </div>
    </div>
  );
}

export default function Receipts() {
  const { addTransaction } = useData();
  const [receipts, setReceipts] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const processFile = async (file) => {
    if (!file.type.match(/image\/*/) && file.type !== "application/pdf") return;
    const id = Date.now() + Math.random();
    const previewUrl = file.type.match(/image\/.*/) ? URL.createObjectURL(file) : null;

    // Add in "processing" state
    setReceipts(prev => [{ id, name: file.name, status: "processing", previewUrl, extracted: null, added: false }, ...prev]);

    // Simulate/call Azure Document Intelligence
    const extracted = await simulateExtraction(file);

    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: "extracted", extracted } : r));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  };

  const handleAddTransaction = (receipt) => {
    addTransaction({
      type: "expense",
      amount: receipt.extracted.amount,
      category: receipt.extracted.category,
      description: `Receipt: ${receipt.extracted.merchant}`,
      date: receipt.extracted.date,
      receipt: receipt.name,
    });
    setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, added: true } : r));
  };

  return (
    <div style={{ padding: "28px 32px", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 6px" }}>Receipt Manager</h1>
      <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 24px" }}>Upload receipts — AI extracts amount, merchant & date automatically</p>

      {/* Azure integration banner */}
      <div style={{
        background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 12, padding: "14px 18px", marginBottom: 24,
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <span style={{ fontSize: 22 }}>☁</span>
        <div>
          <div style={{ color: "#93c5fd", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Azure Document Intelligence + Blob Storage</div>
          <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.6 }}>
            Currently running in <strong style={{ color: "#fbbf24" }}>demo mode</strong> — extraction is simulated.
            When Azure is connected: files upload to <strong style={{ color: "#93c5fd" }}>Azure Blob Storage</strong> and
            the <strong style={{ color: "#93c5fd" }}>prebuilt-receipt model</strong> extracts real data via Azure Functions.
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? "#3b82f6" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 14, padding: "44px 32px", textAlign: "center", cursor: "pointer",
          background: dragging ? "rgba(59,130,246,0.06)" : "rgba(30,41,59,0.4)",
          transition: "all 0.2s", marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
        <div style={{ color: "#94a3b8", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop receipts here or click to upload</div>
        <div style={{ color: "#475569", fontSize: 12 }}>Supports JPG, PNG, PDF</div>
        <input ref={fileRef} type="file" accept="image/*,.pdf" multiple onChange={e => Array.from(e.target.files).forEach(processFile)} style={{ display: "none" }} />
      </div>

      {/* Receipt grid */}
      {receipts.length > 0 && (
        <>
          <h3 style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 16px" }}>
            Uploaded Receipts ({receipts.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {receipts.map(r => (
              <ReceiptCard key={r.id} receipt={r} onAddTransaction={handleAddTransaction} />
            ))}
          </div>
        </>
      )}

      {receipts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#334155" }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📂</div>
          <div style={{ fontSize: 14 }}>No receipts uploaded yet</div>
        </div>
      )}
    </div>
  );
}
