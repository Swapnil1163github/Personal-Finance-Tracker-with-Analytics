import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useData } from "../context/DataContext";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontFamily: "sans-serif", fontSize: 12 }}>
      <div style={{ color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color || p.fill, marginBottom: 2 }}>
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 24px" }}>
      <h3 style={{ color: "#f1f5f9", margin: "0 0 4px", fontSize: 15, fontWeight: 600, fontFamily: "sans-serif" }}>{title}</h3>
      {subtitle && <p style={{ color: "#475569", fontSize: 12, margin: "0 0 14px", fontFamily: "sans-serif" }}>{subtitle}</p>}
      {children}
    </div>
  );
}

export default function Analytics() {
  const { transactions, getMonthlyData, getCategoryBreakdown, CATEGORY_COLORS } = useData();
  const [incomeMonth, setIncomeMonth] = useState(null); // null = all time

  const monthlyData  = useMemo(() => getMonthlyData(6), [getMonthlyData]);
  const expenseBreak = useMemo(() => getCategoryBreakdown("expense"), [getCategoryBreakdown]);
  const incomeBreak  = useMemo(() => getCategoryBreakdown("income"),  [getCategoryBreakdown]);

  // Savings trend
  const savingsTrend = useMemo(() => monthlyData.map(m => ({
    ...m,
    rate: m.income > 0 ? parseFloat(((m.savings / m.income) * 100).toFixed(1)) : 0,
  })), [monthlyData]);

  // Top spending categories (all time)
  const topCategories = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || "#6b7280" }));
  }, [transactions, CATEGORY_COLORS]);

  // Average monthly spend by category
  const avgMonthly = useMemo(() => {
    const months = new Set(transactions.map(t => t.date.slice(0, 7))).size || 1;
    return topCategories.map(c => ({ ...c, avg: Math.round(c.value / months) }));
  }, [topCategories, transactions]);

  // Daily spending for current month
  const dailySpend = useMemo(() => {
    const now = new Date();
    const daily = {};
    transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === "expense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .forEach(t => { daily[t.date] = (daily[t.date] || 0) + t.amount; });
    return Object.entries(daily).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({
      date: date.slice(5), amount,
    }));
  }, [transactions]);

  return (
    <div style={{ padding: "28px 32px", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 6px" }}>Analytics</h1>
      <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 24px" }}>Deep insights into your financial patterns</p>

      {/* Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <ChartCard title="Monthly Income vs Expense" subtitle="Last 6 months comparison">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Savings Rate Trend" subtitle="% of income saved each month">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={savingsTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, "Savings Rate"]} contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="rate" name="Savings Rate" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
        <ChartCard title="Top Spending Categories" subtitle="All time, ranked by total spend">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topCategories} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Total" radius={[0,4,4,0]}>
                {topCategories.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Income Sources" subtitle="Current month breakdown">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={incomeBreak} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                {incomeBreak.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, ""]} contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3 — Daily spending */}
      <ChartCard title="Daily Spending — This Month" subtitle="Day-by-day expense pattern">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dailySpend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, "Spent"]} contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="amount" name="Spent" fill="#f59e0b" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Insights strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 20 }}>
        {[
          {
            icon: "📊",
            label: "Avg Monthly Spend",
            value: `₹${Math.round(transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0) / Math.max(new Set(transactions.map(t => t.date.slice(0, 7))).size, 1)).toLocaleString()}`,
            color: "#f59e0b",
          },
          {
            icon: "💚",
            label: "Best Savings Month",
            value: savingsTrend.length ? savingsTrend.reduce((b, m) => m.savings > b.savings ? m : b).label : "—",
            color: "#10b981",
          },
          {
            icon: "🎯",
            label: "Top Expense Category",
            value: topCategories[0]?.name || "—",
            color: "#3b82f6",
          },
        ].map(i => (
          <div key={i.label} style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{i.icon}</span>
            <div>
              <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{i.label}</div>
              <div style={{ color: i.color, fontSize: 18, fontWeight: 700, fontFamily: "Georgia, serif" }}>{i.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
