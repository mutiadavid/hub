/**
 * msalConfig.js
 * Microsoft Authentication Library (MSAL) configuration.
 *
 * Required environment variables (set in .env.local – never commit secrets):
 *   VITE_AZURE_CLIENT_ID   – Application (client) ID from the Entra app registration
 *   VITE_AZURE_TENANT_ID   – Directory (tenant) ID from the Entra app registration
 *   VITE_AZURE_REDIRECT_URI – The SPA redirect URI registered in Entra
 *                             Defaults to window.location.origin if not set.
 */

const clientId  = import.meta.env.VITE_AZURE_CLIENT_ID  ?? "";
const tenantId  = import.meta.env.VITE_AZURE_TENANT_ID  ?? "";
const redirectUri =
  import.meta.env.VITE_AZURE_REDIRECT_URI ?? window.location.origin;

if (!clientId || !tenantId) {
  console.warn(
    "[MSAL] VITE_AZURE_CLIENT_ID or VITE_AZURE_TENANT_ID is not set. " +
    "Microsoft SSO will not work until these environment variables are configured."
  );
}

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",   // Use sessionStorage – safer than localStorage
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        const map = { 0: "error", 1: "warn", 2: "info", 3: "verbose" };
        console[map[level] ?? "log"]("[MSAL]", message);
      },
      piiLoggingEnabled: false,
    },
  },
};

/**
 * Scopes requested during login.
 * "openid profile email" returns the user's ID token claims.
 */
export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
