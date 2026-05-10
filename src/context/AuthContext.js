import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import azureConfig from "../azureConfig";

const AuthContext = createContext(null);

const msalConfig = {
  auth: {
    clientId: azureConfig.auth.clientId,
    authority: azureConfig.auth.authority,
    redirectUri: azureConfig.auth.redirectUri,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

const msalInstance = new PublicClientApplication(msalConfig);

function mapAccountToUser(account) {
  return {
    id: account.localAccountId || account.homeAccountId,
    name: account.name || account.username || "FinanceFlow User",
    email: account.username || "",
  };
}

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        await msalInstance.initialize();
      } catch (e) {
        if (mounted) setAuthError("Init error: " + e.message);
      }

      try {
        const redirectResult = await msalInstance.handleRedirectPromise();
        if (window.location.hash.includes("code=")) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        const activeAccount = redirectResult?.account || msalInstance.getAllAccounts()[0] || null;
        if (activeAccount) msalInstance.setActiveAccount(activeAccount);
        if (mounted) setAccount(activeAccount);
      } catch (error) {
        console.error("MSAL redirect error:", error);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (mounted) setAuthError("Redirect error: " + (error.message || error.toString()));
        
        const activeAccount = msalInstance.getAllAccounts()[0] || null;
        if (activeAccount) msalInstance.setActiveAccount(activeAccount);
        if (mounted) setAccount(activeAccount);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async () => {
    if (authError) setAuthError(null);
    try {
      const result = await msalInstance.loginPopup(loginRequest);
      msalInstance.setActiveAccount(result.account);
      setAccount(result.account);
    } catch (error) {
      if (error && error.errorCode === "user_cancelled") {
        return;
      }
      try {
        await msalInstance.loginRedirect(loginRequest);
      } catch (redirectError) {
        console.error("loginRedirect failed:", redirectError);
        setAuthError("Login failed: " + (redirectError.message || redirectError.toString()) + ". Resetting...");
        setTimeout(() => {
          window.sessionStorage.clear();
          window.localStorage.clear();
          window.location.href = window.location.pathname;
        }, 2000);
      }
    }
  }, [authError]);

  const logout = useCallback(async () => {
    const activeAccount = msalInstance.getActiveAccount() || account;
    setAccount(null);
    await msalInstance.logoutPopup({ account: activeAccount });
  }, [account]);

  const getAccessToken = useCallback(async () => {
    const activeAccount = msalInstance.getActiveAccount() || account;
    if (!activeAccount) throw new Error("User is not signed in.");

    try {
      const result = await msalInstance.acquireTokenSilent({
        scopes: azureConfig.auth.scopes,
        account: activeAccount,
      });
      return result.accessToken;
    } catch (error) {
      const fallbackErrors = [
        "popup_window_error",
        "popup_blocked",
        "block_nested_popups",
        "interaction_in_progress",
        "login_in_progress",
      ];

      if (fallbackErrors.includes(error.errorCode)) {
        await msalInstance.acquireTokenRedirect({
          scopes: azureConfig.auth.scopes,
          account: activeAccount,
        });
        return;
      }

      const result = await msalInstance.acquireTokenPopup({
        scopes: azureConfig.auth.scopes,
        account: activeAccount,
      });
      return result.accessToken;
    }
  }, [account]);

  const user = useMemo(() => account ? mapAccountToUser(account) : null, [account]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      getAccessToken,
      loading,
      isAuthenticated: !!user,
      authError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
