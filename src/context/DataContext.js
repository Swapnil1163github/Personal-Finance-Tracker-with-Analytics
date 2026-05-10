import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

// ── STORAGE LAYER ──────────────────────────────────────────────────────────────
// Currently uses localStorage. To switch to Azure Cosmos DB via Azure Functions,
// replace the read/write functions below with fetch() calls to your API endpoints.
//
//  Example Azure Functions endpoints your backend should expose:
//    GET    /api/transactions          → list all for user
//    POST   /api/transactions          → create
//    PUT    /api/transactions/{id}     → update
//    DELETE /api/transactions/{id}     → delete
//    GET    /api/analytics/monthly     → monthly summary
// ───────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ft_transactions";

const CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Business", "Gift", "Other Income"],
  expense: [
    "Food & Dining",
    "Transportation",
    "Housing & Rent",
    "Utilities",
    "Healthcare",
    "Education",
    "Entertainment",
    "Shopping",
    "Travel",
    "Subscriptions",
    "Other Expense",
  ],
};

const CATEGORY_COLORS = {
  "Salary": "#10b981",
  "Freelance": "#34d399",
  "Investment": "#6ee7b7",
  "Business": "#a7f3d0",
  "Gift": "#d1fae5",
  "Other Income": "#ecfdf5",
  "Food & Dining": "#f59e0b",
  "Transportation": "#3b82f6",
  "Housing & Rent": "#8b5cf6",
  "Utilities": "#ec4899",
  "Healthcare": "#ef4444",
  "Education": "#06b6d4",
  "Entertainment": "#f97316",
  "Shopping": "#84cc16",
  "Travel": "#a855f7",
  "Subscriptions": "#14b8a6",
  "Other Expense": "#6b7280",
};

function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTransactions(txns) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
}

// Seed some realistic demo data so the dashboard looks populated on first open
function seedDemoData() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const makeDate = (m, d) =>
    new Date(year, m, d).toISOString().split("T")[0];

  return [
    { id: uuidv4(), type: "income",  amount: 45000, category: "Salary",          description: "Monthly salary",          date: makeDate(month, 1),  receipt: null },
    { id: uuidv4(), type: "income",  amount: 8000,  category: "Freelance",       description: "Website project",         date: makeDate(month, 5),  receipt: null },
    { id: uuidv4(), type: "expense", amount: 12000, category: "Housing & Rent",  description: "Monthly rent",            date: makeDate(month, 2),  receipt: null },
    { id: uuidv4(), type: "expense", amount: 3200,  category: "Food & Dining",   description: "Groceries + dining",      date: makeDate(month, 8),  receipt: null },
    { id: uuidv4(), type: "expense", amount: 800,   category: "Transportation",  description: "Fuel & auto",             date: makeDate(month, 10), receipt: null },
    { id: uuidv4(), type: "expense", amount: 1500,  category: "Utilities",       description: "Electricity & internet",  date: makeDate(month, 4),  receipt: null },
    { id: uuidv4(), type: "expense", amount: 2500,  category: "Shopping",        description: "Clothes & accessories",   date: makeDate(month, 15), receipt: null },
    { id: uuidv4(), type: "expense", amount: 600,   category: "Subscriptions",   description: "Netflix, Spotify, etc.",  date: makeDate(month, 3),  receipt: null },
    { id: uuidv4(), type: "expense", amount: 1200,  category: "Entertainment",   description: "Movies & outings",        date: makeDate(month, 18), receipt: null },
    // Previous month
    { id: uuidv4(), type: "income",  amount: 45000, category: "Salary",          description: "Monthly salary",          date: makeDate(month - 1, 1),  receipt: null },
    { id: uuidv4(), type: "expense", amount: 12000, category: "Housing & Rent",  description: "Monthly rent",            date: makeDate(month - 1, 2),  receipt: null },
    { id: uuidv4(), type: "expense", amount: 2900,  category: "Food & Dining",   description: "Groceries",               date: makeDate(month - 1, 7),  receipt: null },
    { id: uuidv4(), type: "expense", amount: 4500,  category: "Travel",          description: "Weekend trip",            date: makeDate(month - 1, 14), receipt: null },
    { id: uuidv4(), type: "income",  amount: 5000,  category: "Investment",      description: "Dividend income",         date: makeDate(month - 1, 20), receipt: null },
    { id: uuidv4(), type: "expense", amount: 900,   category: "Healthcare",      description: "Medical checkup",         date: makeDate(month - 1, 22), receipt: null },
  ];
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!user) return;
    const stored = loadTransactions();
    if (stored.length === 0) {
      const demo = seedDemoData();
      saveTransactions(demo);
      setTransactions(demo);
    } else {
      setTransactions(stored);
    }
    setInitialized(true);
  }, [user]);

  const persist = useCallback((updated) => {
    setTransactions(updated);
    saveTransactions(updated);
  }, []);

  const addTransaction = useCallback((txn) => {
    const newTxn = { ...txn, id: uuidv4() };
    persist([newTxn, ...transactions]);
    return newTxn;
  }, [transactions, persist]);

  const updateTransaction = useCallback((id, data) => {
    persist(transactions.map(t => t.id === id ? { ...t, ...data } : t));
  }, [transactions, persist]);

  const deleteTransaction = useCallback((id) => {
    persist(transactions.filter(t => t.id !== id));
  }, [transactions, persist]);

  // ── Analytics helpers ──────────────────────────────────────────────────────
  const getMonthlyData = useCallback((monthsBack = 6) => {
    const result = [];
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const monthTxns = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const income  = monthTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expense = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      result.push({ label, income, expense, savings: income - expense });
    }
    return result;
  }, [transactions]);

  const getCategoryBreakdown = useCallback((type = "expense", month = null) => {
    const m = month || new Date().getMonth();
    const y = new Date().getFullYear();
    const filtered = transactions.filter(t => {
      const td = new Date(t.date);
      return t.type === type &&
        (month === null || (td.getMonth() === m && td.getFullYear() === y));
    });
    const map = {};
    filtered.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({
      name, value, color: CATEGORY_COLORS[name] || "#6b7280",
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const getCurrentMonthSummary = useCallback(() => {
    const now = new Date();
    const monthTxns = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === now.getMonth() && td.getFullYear() === now.getFullYear();
    });
    const income  = monthTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, savings: income - expense, txnCount: monthTxns.length };
  }, [transactions]);

  return (
    <DataContext.Provider value={{
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getMonthlyData,
      getCategoryBreakdown,
      getCurrentMonthSummary,
      CATEGORIES,
      CATEGORY_COLORS,
      initialized,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
