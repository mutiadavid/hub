import React, { useState } from "react";
import {
  useGetSSOConnectionsQuery,
  useGetSSOProvidersQuery,
  useLinkSSOAccountMutation,
  useUnlinkSSOAccountMutation,
} from "../api/ssoApi";
import "./SSOManagement.css";

/**
 * SSO Management Component
 * Allows users to link/unlink SSO accounts
 */
const SSOManagement = () => {
  const [showUnlinkForm, setShowUnlinkForm] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    data: connections,
    isLoading: isLoadingConnections,
    refetch,
  } = useGetSSOConnectionsQuery();
  const { data: providers, isLoading: isLoadingProviders } =
    useGetSSOProvidersQuery();
  const [unlinkAccount, { isLoading: isUnlinking }] =
    useUnlinkSSOAccountMutation();

  const availableProviders = providers?.availableProviders || [];
  const linkedAccounts = connections?.linkedAccounts || [];
  const linkedProviderIds = new Set(
    linkedAccounts.map((acc) => acc.ssoProviderId),
  );
  const unlinkedProviders = availableProviders.filter(
    (p) => !linkedProviderIds.has(p.id),
  );

  const handleUnlinkAccount = async (providerId) => {
    try {
      if (!password) {
        setError("Password is required");
        return;
      }

      setError("");
      await unlinkAccount({
        ssoProviderId: providerId,
        password,
      }).unwrap();

      setSuccess("SSO account unlinked successfully");
      setPassword("");
      setShowUnlinkForm(null);
      refetch();
    } catch (err) {
      setError(err?.data?.message || "Failed to unlink SSO account");
    }
  };

  const handleLinkAccount = (providerId) => {
    // In a real application, this would initiate the OAuth flow
    alert("SSO account linking initiated. Redirecting to provider...");
    // window.location.href = `/auth/sso/link/${providerId}`;
  };

  if (isLoadingConnections || isLoadingProviders) {
    return <div className="sso-management">Loading SSO settings...</div>;
  }

  return (
    <div className="sso-management">
      <h2>Single Sign-On (SSO)</h2>

      {linkedAccounts.length > 0 && (
        <div className="sso-section">
          <h3>Linked Accounts</h3>
          <div className="linked-accounts">
            {linkedAccounts.map((account) => (
              <div key={account.id} className="account-card">
                <div className="account-info">
                  <h4>{account.providerName}</h4>
                  <p className="account-email">{account.providerEmail}</p>
                  <p className="account-date">
                    Connected on{" "}
                    {new Date(account.connectedAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  className="btn-danger btn-small"
                  onClick={() => setShowUnlinkForm(account.ssoProviderId)}
                  disabled={showUnlinkForm !== null}
                >
                  Unlink
                </button>

                {showUnlinkForm === account.ssoProviderId && (
                  <div className="unlink-form">
                    <p className="warning">
                      Are you sure you want to unlink this account? You'll need
                      to use your email and password to log in.
                    </p>

                    <input
                      type="password"
                      placeholder="Enter your password to confirm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      disabled={isUnlinking}
                    />

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                      <button
                        className="btn-primary"
                        onClick={() =>
                          handleUnlinkAccount(account.ssoProviderId)
                        }
                        disabled={isUnlinking}
                      >
                        {isUnlinking ? "Unlinking..." : "Confirm Unlink"}
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setShowUnlinkForm(null);
                          setPassword("");
                          setError("");
                        }}
                        disabled={isUnlinking}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {unlinkedProviders.length > 0 && (
        <div className="sso-section">
          <h3>Available Providers</h3>
          <p className="section-description">
            Link additional accounts to make login easier and more secure.
          </p>

          <div className="unlinked-providers">
            {unlinkedProviders.map((provider) => (
              <div key={provider.id} className="provider-card">
                <div className="provider-info">
                  {provider.iconUrl && (
                    <img
                      src={provider.iconUrl}
                      alt={provider.providerName}
                      className="provider-icon"
                    />
                  )}
                  <h4>{provider.displayName || provider.providerName}</h4>
                </div>

                <button
                  className="btn-primary btn-small"
                  onClick={() => handleLinkAccount(provider.id)}
                >
                  Link Account
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedAccounts.length === 0 && unlinkedProviders.length === 0 && (
        <div className="sso-empty">
          <p>No SSO providers available</p>
        </div>
      )}

      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default SSOManagement;
