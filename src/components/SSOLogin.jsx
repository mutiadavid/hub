import React from "react";
import {
  useGetSSOProvidersQuery,
  useInitializeSSOLoginMutation,
} from "../api/ssoApi";
import "./SSOLogin.css";

/**
 * SSO Login Component
 * Displays available SSO providers and handles SSO login
 */
const SSOLogin = ({ onSuccess }) => {
  const { data: ssoStatus, isLoading } = useGetSSOProvidersQuery();
  const [initializeLogin] = useInitializeSSOLoginMutation();

  const handleLoginWithProvider = async (providerId) => {
    try {
      const result = await initializeLogin({
        ssoProviderId: providerId,
        redirectUri: `${window.location.origin}/auth/sso/callback`,
      }).unwrap();

      // Redirect to provider's authorization URL
      window.location.href = result.authorizationUrl;
    } catch (err) {
      console.error("SSO initialization failed:", err);
      alert(err?.data?.message || "Failed to initialize SSO login");
    }
  };

  if (isLoading) {
    return <div className="sso-login">Loading SSO options...</div>;
  }

  const providers = ssoStatus?.availableProviders || [];

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="sso-login">
      <div className="sso-providers">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="sso-provider-btn"
            onClick={() => handleLoginWithProvider(provider.id)}
            title={provider.displayName || provider.providerName}
          >
            {provider.iconUrl ? (
              <img src={provider.iconUrl} alt={provider.providerName} className="sso-provider-btn__icon" />
            ) : (
              <span className="sso-provider-btn__fallback">
                {provider.displayName?.charAt(0) ||
                  provider.providerName.charAt(0)}
              </span>
            )}
            <span className="provider-name">
              {provider.displayName || provider.providerName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SSOLogin;
