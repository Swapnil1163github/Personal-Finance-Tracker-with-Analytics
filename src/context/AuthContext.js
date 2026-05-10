import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// ── LOCAL DEMO MODE ────────────────────────────────────────────────────────────
// While Azure AD B2C is not yet connected, the app runs with a demo user.
// When you add your Azure credentials to azureConfig.js and install
// @azure/msal-browser, flip USE_AZURE_AUTH = true.
const USE_AZURE_AUTH = false;

const DEMO_USER = {
  name: "Swapnil Patil",
  email: "swapnilpatil1163@gmail.com",
  id: "demo-user-001",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login with demo user so the app works immediately
    if (!USE_AZURE_AUTH) {
      const saved = localStorage.getItem("ft_demo_user");
      if (saved) setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = (customName) => {
    const u = customName
      ? { ...DEMO_USER, name: customName }
      : DEMO_USER;
    setUser(u);
    localStorage.setItem("ft_demo_user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ft_demo_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
