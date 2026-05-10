import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./AuthContext";
import azureConfig from "../azureConfig";

const DataContext = createContext(null);

const USE_AZURE_API = true;
const STORAGE_KEY = "ft_transactions_cache";

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
  Salary: "#10b981",
  Freelance: "#34d399",
  Investment: "#6ee7b7",
  Business: "#a7f3d0",
  Gift: "#d1fae5",
  "Other Income": "#ecfdf5",
  "Food & Dining": "#f59e0b",
  Transportation: "#3b82f6",
  "Housing & Rent": "#8b5cf6",
  Utilities: "#ec4899",
  Healthcare: "#ef4444",
  Education: "#06b6d4",
  Entertainment: "#f97316",
  Shopping: "#84cc16",
  Travel: "#a855f7",
  Subscriptions: "#14b8a6",
  "Other Expense": "#6b7280",
};

function cacheKey(userId) {
  return `${STORAGE_KEY}_${userId}`;
}

function loadCachedTransactions(userId) {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(userId)) || "[]");
  } catch {
    return [];
  }
}

function saveCachedTransactions(userId, txns) {
  localStorage.setItem(cacheKey(userId), JSON.stringify(txns));
}

async function apiRequest(path, { method = "GET", userId, body, token } = {}) {
  const url = new URL(`${azureConfig.apiBaseUrl}${path}`);
  if (userId) url.searchParams.set("userId", userId);

  const res = await fetch(url.toString(), {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `${method} ${path} failed with ${res.status}`;
    try {
      const errorBody = await res.json();
      message = errorBody.error || message;
    } catch {
      // Ignore invalid error JSON.
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

function seedDemoData(userId) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const makeDate = (m, d) => new Date(year, m, d).toISOString().split("T")[0];

  return [
    { id: uuidv4(), userId, type: "income", amount: 45000, category: "Salary", description: "Monthly salary", date: makeDate(month, 1), receipt: null },
    { id: uuidv4(), userId, type: "income", amount: 8000, category: "Freelance", description: "Website project", date: makeDate(month, 5), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 12000, category: "Housing & Rent", description: "Monthly rent", date: makeDate(month, 2), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 3200, category: "Food & Dining", description: "Groceries + dining", date: makeDate(month, 8), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 800, category: "Transportation", description: "Fuel & auto", date: makeDate(month, 10), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 1500, category: "Utilities", description: "Electricity & internet", date: makeDate(month, 4), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 2500, category: "Shopping", description: "Clothes & accessories", date: makeDate(month, 15), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 600, category: "Subscriptions", description: "Netflix, Spotify, etc.", date: makeDate(month, 3), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 1200, category: "Entertainment", description: "Movies & outings", date: makeDate(month, 18), receipt: null },
    { id: uuidv4(), userId, type: "income", amount: 45000, category: "Salary", description: "Monthly salary", date: makeDate(month - 1, 1), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 12000, category: "Housing & Rent", description: "Monthly rent", date: makeDate(month - 1, 2), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 2900, category: "Food & Dining", description: "Groceries", date: makeDate(month - 1, 7), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 4500, category: "Travel", description: "Weekend trip", date: makeDate(month - 1, 14), receipt: null },
    { id: uuidv4(), userId, type: "income", amount: 5000, category: "Investment", description: "Dividend income", date: makeDate(month - 1, 20), receipt: null },
    { id: uuidv4(), userId, type: "expense", amount: 900, category: "Healthcare", description: "Medical checkup", date: makeDate(month - 1, 22), receipt: null },
  ];
}

export function DataProvider({ children }) {
  const { user, getAccessToken } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const userId = user.id || "demo-user-001";

    async function loadTransactions() {
      setInitialized(false);
      setSyncStatus("syncing");

      try {
        if (!USE_AZURE_API) throw new Error("Azure API disabled.");

        const token = await getAccessToken();
        let cloudTxns = await apiRequest("/transactions", { userId, token });

        if (cloudTxns.length === 0) {
          const demo = seedDemoData(userId);
          cloudTxns = await Promise.all(
            demo.map((txn) => apiRequest("/transactions", { method: "POST", userId, body: txn, token }))
          );
        }

        if (!cancelled) {
          setTransactions(cloudTxns);
          saveCachedTransactions(userId, cloudTxns);
          setSyncStatus("cloud");
        }
      } catch (err) {
        console.warn("Using cached finance data because Azure API is unavailable:", err);
        const cached = loadCachedTransactions(userId);
        const fallback = cached.length ? cached : seedDemoData(userId);
        if (!cancelled) {
          setTransactions(fallback);
          saveCachedTransactions(userId, fallback);
          setSyncStatus("offline");
        }
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    loadTransactions();
    return () => {
      cancelled = true;
    };
  }, [user, getAccessToken]);

  const addTransaction = useCallback(async (txn) => {
    const userId = user?.id || "demo-user-001";
    const optimistic = { ...txn, id: uuidv4(), userId };

    setTransactions((current) => {
      const updated = [optimistic, ...current];
      saveCachedTransactions(userId, updated);
      return updated;
    });

    try {
      const token = await getAccessToken();
      const created = await apiRequest("/transactions", { method: "POST", userId, body: optimistic, token });
      setTransactions((current) => {
        const updated = current.map((t) => (t.id === optimistic.id ? created : t));
        saveCachedTransactions(userId, updated);
        return updated;
      });
      setSyncStatus("cloud");
      return created;
    } catch (err) {
      console.warn("Transaction saved locally; cloud sync failed:", err);
      setSyncStatus("offline");
      return optimistic;
    }
  }, [user, getAccessToken]);

  const updateTransaction = useCallback(async (id, data) => {
    const userId = user?.id || "demo-user-001";

    setTransactions((current) => {
      const updated = current.map((t) => (t.id === id ? { ...t, ...data } : t));
      saveCachedTransactions(userId, updated);
      return updated;
    });

    try {
      const token = await getAccessToken();
      const updatedTxn = await apiRequest(`/transactions/${id}`, { method: "PUT", userId, body: data, token });
      setTransactions((current) => {
        const updated = current.map((t) => (t.id === id ? updatedTxn : t));
        saveCachedTransactions(userId, updated);
        return updated;
      });
      setSyncStatus("cloud");
    } catch (err) {
      console.warn("Transaction update saved locally; cloud sync failed:", err);
      setSyncStatus("offline");
    }
  }, [user, getAccessToken]);

  const deleteTransaction = useCallback(async (id) => {
    const userId = user?.id || "demo-user-001";
    const previous = transactions;

    setTransactions((current) => {
      const updated = current.filter((t) => t.id !== id);
      saveCachedTransactions(userId, updated);
      return updated;
    });

    try {
      const token = await getAccessToken();
      await apiRequest(`/transactions/${id}`, { method: "DELETE", userId, token });
      setSyncStatus("cloud");
    } catch (err) {
      console.warn("Cloud delete failed; restoring local transaction:", err);
      setTransactions(previous);
      saveCachedTransactions(userId, previous);
      setSyncStatus("offline");
    }
  }, [transactions, user, getAccessToken]);

  const getMonthlyData = useCallback((monthsBack = 6) => {
    const result = [];
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const monthTxns = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
      const expense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
      result.push({ label, income, expense, savings: income - expense });
    }
    return result;
  }, [transactions]);

  const getCategoryBreakdown = useCallback((type = "expense", month = null) => {
    const m = month ?? new Date().getMonth();
    const y = new Date().getFullYear();
    const filtered = transactions.filter((t) => {
      const td = new Date(t.date);
      return t.type === type && (month === null || (td.getMonth() === m && td.getFullYear() === y));
    });
    const map = {};
    filtered.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || "#6b7280" }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const getCurrentMonthSummary = useCallback(() => {
    const now = new Date();
    const monthTxns = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === now.getMonth() && td.getFullYear() === now.getFullYear();
    });
    const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
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
      syncStatus,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
