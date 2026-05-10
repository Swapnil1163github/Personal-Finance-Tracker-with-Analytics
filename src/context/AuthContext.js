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

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        await msalInstance.initialize();
      } catch (e) {
        // Ignore already initialized errors
      }

      try {
        const redirectResult = await msalInstance.handleRedirectPromise();
        const activeAccount = redirectResult?.account || msalInstance.getAllAccounts()[0] || null;
        if (activeAccount) msalInstance.setActiveAccount(activeAccount);
        if (mounted) setAccount(activeAccount);
      } catch (error) {
        console.error("MSAL redirect error:", error);
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
    try {
      const result = await msalInstance.loginPopup(loginRequest);
      msalInstance.setActiveAccount(result.account);
      setAccount(result.account);
    } catch (error) {
      if (error && error.errorCode === "user_cancelled") {
        return;
      }
      await msalInstance.loginRedirect(loginRequest);
    }
  }, []);

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
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
