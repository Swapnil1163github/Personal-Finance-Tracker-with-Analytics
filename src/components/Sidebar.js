import React from "react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { id: "dashboard",     icon: "⬡", label: "Dashboard" },
  { id: "transactions",  icon: "⇄", label: "Transactions" },
  { id: "analytics",    icon: "◈", label: "Analytics" },
  { id: "receipts",     icon: "▣", label: "Receipts" },
];

export default function Sidebar({ active, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: "#0f172a",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "sticky",
      top: 0,
      fontFamily: "sans-serif",
    }}>
      {/* Brand */}
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #10b981, #3b82f6)",
            borderRadius: 10, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, flexShrink: 0,
          }}>₹</div>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>FinanceFlow</div>
            <div style={{ color: "#475569", fontSize: 10 }}>Personal Tracker</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "10px 12px",
                background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                border: isActive ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                borderRadius: 8, cursor: "pointer",
                color: isActive ? "#93c5fd" : "#64748b",
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                marginBottom: 4, textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Azure status */}
      <div style={{ margin: "0 12px 12px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "10px 12px" }}>
        <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>☁ Azure Ready</div>
        <div style={{ color: "#92400e", fontSize: 10, lineHeight: 1.4 }}>
          Cosmos DB · Functions<br />Blob Storage · AD B2C
        </div>
      </div>

      {/* User footer */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
            <div style={{ color: "#475569", fontSize: 10 }}>Demo Account</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: "100%", padding: "7px 0", background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6,
            color: "#f87171", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif",
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
