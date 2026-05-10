import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { generateMonthlyReport } from "../utils/pdfReport";

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: "rgba(30,41,59,0.7)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14, padding: "22px 24px",
      backdropFilter: "blur(10px)",
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 12, fontFamily: "sans-serif", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
          <div style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 700, fontFamily: "Georgia, serif", letterSpacing: -1 }}>
            ₹{Number(value).toLocaleString()}
          </div>
          {sub && <div style={{ color: "#475569", fontSize: 12, marginTop: 4, fontFamily: "sans-serif" }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontFamily: "sans-serif", fontSize: 12 }}>
      <div style={{ color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { transactions, getMonthlyData, getCategoryBreakdown, getCurrentMonthSummary, initialized } = useData();
  const { user } = useAuth();

  const monthlyData   = useMemo(() => getMonthlyData(6), [getMonthlyData]);
  const expensePie    = useMemo(() => getCategoryBreakdown("expense"), [getCategoryBreakdown]);
  const summary       = useMemo(() => getCurrentMonthSummary(), [getCurrentMonthSummary]);
  const recentTxns    = useMemo(() => [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5), [transactions]);

  if (!initialized) return <div style={{ color: "#64748b", padding: 40, fontFamily: "sans-serif" }}>Loading...</div>;

  const savingsRate = summary.income > 0 ? ((summary.savings / summary.income) * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "28px 32px", fontFamily: "sans-serif", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "#f1f5f9", fontSize: 24, fontWeight: 700, fontFamily: "Georgia, serif", margin: 0 }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 13 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => generateMonthlyReport(transactions, user)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #10b981, #059669)",
            border: "none", borderRadius: 10, padding: "10px 18px",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
          }}
        >
          ↓ Download PDF Report
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <KpiCard label="This Month Income"  value={summary.income}  color="#10b981" icon="↑" sub={`${summary.txnCount} transactions`} />
        <KpiCard label="This Month Expense" value={summary.expense} color="#ef4444" icon="↓" sub="Total outflow" />
        <KpiCard label="Net Savings"        value={summary.savings} color={summary.savings >= 0 ? "#3b82f6" : "#ef4444"} icon="◎" sub={`${savingsRate}% savings rate`} />
        <KpiCard label="Total Transactions" value={transactions.length} color="#a855f7" icon="≡" sub="All time" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Area chart */}
        <div style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ color: "#f1f5f9", margin: "0 0 18px", fontSize: 15, fontWeight: 600 }}>Income vs Expense — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income"  name="Income"  stroke="#10b981" fill="url(#incGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 24px" }}>
          <h3 style={{ color: "#f1f5f9", margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>Expense Breakdown</h3>
          <p style={{ color: "#475569", fontSize: 11, margin: "0 0 10px" }}>Current month</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={expensePie.slice(0, 7)}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
                paddingAngle={3}
              >
                {expensePie.slice(0, 7).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 24px" }}>
        <h3 style={{ color: "#f1f5f9", margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Recent Transactions</h3>
        {recentTxns.length === 0 && <p style={{ color: "#475569", fontSize: 13 }}>No transactions yet.</p>}
        {recentTxns.map(t => (
          <div key={t.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: t.type === "income" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>{t.type === "income" ? "↑" : "↓"}</div>
              <div>
                <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>{t.description || t.category}</div>
                <div style={{ color: "#475569", fontSize: 12 }}>{t.category} · {t.date}</div>
              </div>
            </div>
            <div style={{ color: t.type === "income" ? "#10b981" : "#f87171", fontWeight: 700, fontSize: 15, fontFamily: "Georgia, serif" }}>
              {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
