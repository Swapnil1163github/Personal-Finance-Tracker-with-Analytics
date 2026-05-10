import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";

function Modal({ onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: 28, width: "100%", maxWidth: 460,
        boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
      }}>
        {children}
      </div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ color: "#94a3b8", fontSize: 12, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(15,23,42,0.7)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, padding: "10px 12px",
  color: "#f1f5f9", fontSize: 14, fontFamily: "sans-serif",
  outline: "none",
};

function TransactionForm({ initial, onSave, onClose }) {
  const { CATEGORIES } = useData();
  const [form, setForm] = useState(initial || {
    type: "expense", amount: "", category: "Food & Dining",
    description: "", date: new Date().toISOString().split("T")[0],
  });

  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    // Auto-reset category when type changes
    if (k === "type") updated.category = CATEGORIES[v][0];
    return updated;
  });

  const valid = form.amount && Number(form.amount) > 0 && form.category && form.date;

  return (
    <>
      <h2 style={{ color: "#f1f5f9", margin: "0 0 24px", fontSize: 18, fontFamily: "Georgia, serif" }}>
        {initial ? "Edit Transaction" : "Add Transaction"}
      </h2>

      {/* Type toggle */}
      <FieldGroup label="Type">
        <div style={{ display: "flex", gap: 8 }}>
          {["income", "expense"].map(t => (
            <button key={t} onClick={() => set("type", t)} style={{
              flex: 1, padding: "9px 0",
              background: form.type === t
                ? (t === "income" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)")
                : "rgba(15,23,42,0.5)",
              border: `1px solid ${form.type === t ? (t === "income" ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, color: form.type === t ? (t === "income" ? "#10b981" : "#f87171") : "#64748b",
              fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "sans-serif",
              textTransform: "capitalize",
            }}>{t}</button>
          ))}
        </div>
      </FieldGroup>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FieldGroup label="Amount (₹)">
          <input type="number" min="0" value={form.amount} onChange={e => set("amount", e.target.value)}
            placeholder="0" style={inputStyle} />
        </FieldGroup>
        <FieldGroup label="Date">
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} />
        </FieldGroup>
      </div>

      <FieldGroup label="Category">
        <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FieldGroup>

      <FieldGroup label="Description (optional)">
        <input type="text" value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="What was this for?" style={inputStyle} />
      </FieldGroup>

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: "11px 0", background: "transparent",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
          color: "#64748b", cursor: "pointer", fontFamily: "sans-serif", fontSize: 14,
        }}>Cancel</button>
        <button
          disabled={!valid}
          onClick={() => valid && onSave({ ...form, amount: Number(form.amount) })}
          style={{
            flex: 2, padding: "11px 0",
            background: valid ? "linear-gradient(135deg, #10b981, #3b82f6)" : "rgba(255,255,255,0.05)",
            border: "none", borderRadius: 8,
            color: valid ? "#fff" : "#374151",
            cursor: valid ? "pointer" : "not-allowed",
            fontFamily: "sans-serif", fontSize: 14, fontWeight: 600,
          }}
        >Save Transaction</button>
      </div>
    </>
  );
}

export default function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, CATEGORIES } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [filter, setFilter]       = useState({ type: "all", category: "all", search: "" });
  const [sortBy, setSortBy]       = useState("date-desc");
  const [delConfirm, setDelConfirm] = useState(null);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filter.type !== "all") list = list.filter(t => t.type === filter.type);
    if (filter.category !== "all") list = list.filter(t => t.category === filter.category);
    if (filter.search) list = list.filter(t =>
      t.description?.toLowerCase().includes(filter.search.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.search.toLowerCase())
    );
    list.sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date) - new Date(a.date);
      if (sortBy === "date-asc")  return new Date(a.date) - new Date(b.date);
      if (sortBy === "amt-desc")  return b.amount - a.amount;
      if (sortBy === "amt-asc")   return a.amount - b.amount;
      return 0;
    });
    return list;
  }, [transactions, filter, sortBy]);

  const allCategories = useMemo(() => [
    ...CATEGORIES.income, ...CATEGORIES.expense
  ], [CATEGORIES]);

  const handleSave = (data) => {
    if (editing) { updateTransaction(editing.id, data); setEditing(null); }
    else { addTransaction(data); }
    setShowModal(false);
  };

  const totalIncome  = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ padding: "28px 32px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", margin: 0 }}>Transactions</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>{filtered.length} records</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} style={{
          background: "linear-gradient(135deg, #10b981, #3b82f6)",
          border: "none", borderRadius: 10, padding: "10px 18px",
          color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>+ Add Transaction</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input type="text" placeholder="🔍  Search..." value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          style={{ ...filterStyle, flex: "1 1 180px" }} />
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))} style={filterStyle}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))} style={filterStyle}>
          <option value="all">All Categories</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={filterStyle}>
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amt-desc">Highest Amount</option>
          <option value="amt-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        {[
          { label: "Filtered Income",  val: totalIncome,  color: "#10b981" },
          { label: "Filtered Expense", val: totalExpense, color: "#ef4444" },
          { label: "Net",              val: totalIncome - totalExpense, color: (totalIncome - totalExpense) >= 0 ? "#3b82f6" : "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#64748b", fontSize: 12 }}>{s.label}:</span>
            <span style={{ color: s.color, fontWeight: 700, fontFamily: "Georgia, serif" }}>₹{Math.abs(s.val).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 1.2fr 110px 90px", gap: 0 }}>
          {/* Header */}
          {["Date", "Category", "Type", "Description", "Amount", "Actions"].map(h => (
            <div key={h} style={{ padding: "12px 16px", background: "rgba(15,23,42,0.5)", color: "#475569", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {h}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "#475569", fontSize: 14 }}>
              No transactions match your filters.
            </div>
          )}

          {filtered.map(t => (
            <React.Fragment key={t.id}>
              <div style={cellStyle}><span style={{ color: "#94a3b8", fontSize: 13 }}>{t.date}</span></div>
              <div style={cellStyle}><span style={{ color: "#e2e8f0", fontSize: 13 }}>{t.category}</span></div>
              <div style={cellStyle}>
                <span style={{
                  background: t.type === "income" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)",
                  color: t.type === "income" ? "#10b981" : "#f87171",
                  borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, textTransform: "capitalize",
                }}>{t.type}</span>
              </div>
              <div style={cellStyle}><span style={{ color: "#94a3b8", fontSize: 13 }}>{t.description || "—"}</span></div>
              <div style={{ ...cellStyle, fontFamily: "Georgia, serif", fontWeight: 700, color: t.type === "income" ? "#10b981" : "#f87171" }}>
                {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
              </div>
              <div style={{ ...cellStyle, gap: 6, display: "flex" }}>
                <button onClick={() => { setEditing(t); setShowModal(true); }} style={actionBtn("#3b82f6")}>✎</button>
                <button onClick={() => setDelConfirm(t.id)} style={actionBtn("#ef4444")}>✕</button>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditing(null); }}>
          <TransactionForm
            initial={editing}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditing(null); }}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <Modal onClose={() => setDelConfirm(null)}>
          <h3 style={{ color: "#f1f5f9", fontFamily: "Georgia, serif", margin: "0 0 12px" }}>Delete transaction?</h3>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px" }}>This cannot be undone.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setDelConfirm(null)} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", cursor: "pointer", fontFamily: "sans-serif" }}>Cancel</button>
            <button onClick={() => { deleteTransaction(delConfirm); setDelConfirm(null); }} style={{ flex: 1, padding: "10px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600, fontFamily: "sans-serif" }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const filterStyle = {
  background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 13,
  fontFamily: "sans-serif", outline: "none", cursor: "pointer",
};

const cellStyle = {
  padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
  display: "flex", alignItems: "center",
};

const actionBtn = (color) => ({
  width: 28, height: 28, borderRadius: 6, border: `1px solid ${color}33`,
  background: `${color}15`, color: color, fontSize: 13,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "sans-serif",
});
