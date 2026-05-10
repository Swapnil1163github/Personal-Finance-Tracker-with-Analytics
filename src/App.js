import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Receipts from "./pages/Receipts";

const PAGES = {
  dashboard:    Dashboard,
  transactions: Transactions,
  analytics:    Analytics,
  receipts:     Receipts,
};

function AppShell() {
  const { isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#475569", fontFamily: "sans-serif", fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (!isAuthenticated) return <LoginPage />;

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <DataProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a" }}>
        <Sidebar active={page} onNavigate={setPage} />
        <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
          <PageComponent />
        </main>
      </div>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
