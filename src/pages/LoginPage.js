import React from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

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
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
      }} />

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
        <div style={{
          width: 64,
          height: 64,
          background: "linear-gradient(135deg, #10b981, #3b82f6)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 28,
          color: "#fff",
          boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
        }}>Rs</div>

        <h1 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 700, margin: "0 0 6px", letterSpacing: -0.5 }}>
          FinanceFlow
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 28px", fontFamily: "sans-serif" }}>
          Cloud-Based Personal Finance Tracker
        </p>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(16,185,129,0.15)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: 20,
          padding: "5px 14px",
          marginBottom: 28,
          color: "#6ee7b7",
          fontSize: 12,
          fontFamily: "monospace",
        }}>
          Azure Entra secured
        </div>

        <button
          onClick={login}
          style={{
            width: "100%",
            padding: "13px 0",
            background: "linear-gradient(135deg, #10b981, #3b82f6)",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "sans-serif",
            letterSpacing: 0.3,
            boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
          }}
        >
          Sign in with Microsoft
        </button>

        <p style={{ color: "#64748b", fontSize: 11, marginTop: 20, fontFamily: "sans-serif", lineHeight: 1.5 }}>
          Your transactions are stored per signed-in Azure identity.
        </p>
      </div>
    </div>
  );
}
