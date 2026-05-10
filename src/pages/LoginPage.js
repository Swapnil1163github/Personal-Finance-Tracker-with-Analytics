import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [name, setName] = useState("");

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

      {/* Glow blobs */}
      <div style={{ position: "absolute", top: "15%",  left: "10%",  width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        position: "relative",
        background: "rgba(30,41,59,0.8)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "52px 44px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}>
        {/* Logo mark */}
        <div style={{
          width: 64, height: 64,
          background: "linear-gradient(135deg, #10b981, #3b82f6)",
          borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 28,
          boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
        }}>₹</div>

        <h1 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 700, margin: "0 0 6px", letterSpacing: -0.5 }}>
          FinanceFlow
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 36px", fontFamily: "sans-serif" }}>
          Cloud-Based Personal Finance Tracker
        </p>

        {/* Demo mode badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 28,
          color: "#fbbf24", fontSize: 12, fontFamily: "monospace",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
          Demo Mode — Azure integration ready
        </div>

        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <label style={{ color: "#94a3b8", fontSize: 12, fontFamily: "sans-serif", display: "block", marginBottom: 6 }}>
            Your name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login(name)}
            placeholder="e.g. Swapnil Patil"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "12px 14px",
              color: "#f1f5f9", fontSize: 15, fontFamily: "sans-serif",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={() => login(name)}
          style={{
            width: "100%", padding: "13px 0",
            background: "linear-gradient(135deg, #10b981, #3b82f6)",
            border: "none", borderRadius: 10, cursor: "pointer",
            color: "#fff", fontSize: 15, fontWeight: 700,
            fontFamily: "sans-serif", letterSpacing: 0.3,
            boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 8px 28px rgba(16,185,129,0.45)"; }}
          onMouseLeave={e => { e.target.style.transform = ""; e.target.style.boxShadow = "0 4px 20px rgba(16,185,129,0.35)"; }}
        >
          Enter Dashboard →
        </button>

        <p style={{ color: "#475569", fontSize: 11, marginTop: 20, fontFamily: "sans-serif" }}>
          In production: connects to Azure AD B2C for secure authentication
        </p>
      </div>
    </div>
  );
}
