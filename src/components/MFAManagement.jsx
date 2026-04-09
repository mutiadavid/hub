import React, { useState } from "react";
import {
  useGetMFAStatusQuery,
  useDisableMFAMutation,
  useGenerateBackupCodesMutation,
} from "../api/mfaApi";
import "./MFAManagement.css";

/**
 * MFA Management Component
 * Displays MFA status and allows disabling MFA
 */
const MFAManagement = () => {
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: mfaStatus, isLoading, refetch } = useGetMFAStatusQuery();
  const [disableMFA, { isLoading: isDisabling }] = useDisableMFAMutation();
  const [generateCodes, { isLoading: isGenerating }] =
    useGenerateBackupCodesMutation();

  const handleDisableMFA = async () => {
    try {
      if (!password) {
        setError("Password is required");
        return;
      }

      setError("");
      await disableMFA({ password }).unwrap();
      setSuccess("MFA has been disabled");
      setPassword("");
      setShowDisableForm(false);
      refetch();
    } catch (err) {
      setError(err?.data?.message || "Failed to disable MFA");
    }
  };

  const handleGenerateNewCodes = async () => {
    try {
      setError("");
      const result = await generateCodes({}).unwrap();

      // Show codes to user
      const text = result.backupCodes.join("\n");
      navigator.clipboard.writeText(text);
      alert("New backup codes generated and copied to clipboard:\n\n" + text);
      refetch();
    } catch (err) {
      setError(err?.data?.message || "Failed to generate backup codes");
    }
  };

  if (isLoading) {
    return <div className="mfa-management">Loading MFA settings...</div>;
  }

  return (
    <div className="mfa-management">
      <h2>Two-Factor Authentication (2FA)</h2>

      <div className="mfa-status-card">
        <div className="status-header">
          <h3>MFA Status</h3>
          <span
            className={`status-badge ${mfaStatus?.isMFAEnabled ? "enabled" : "disabled"}`}
          >
            {mfaStatus?.isMFAEnabled ? "✓ Enabled" : "Disabled"}
          </span>
        </div>

        {mfaStatus?.isMFAEnabled ? (
          <div className="mfa-details">
            <div className="detail-row">
              <span>TOTP (Time-based Code)</span>
              <span
                className={`status ${mfaStatus.isTotpEnabled ? "active" : ""}`}
              >
                {mfaStatus.isTotpEnabled ? "✓ Active" : "Not configured"}
              </span>
            </div>

            <div className="detail-row">
              <span>Backup Codes</span>
              <span
                className={`status ${mfaStatus.isBackupCodesEnabled ? "active" : ""}`}
              >
                {mfaStatus.isBackupCodesEnabled
                  ? "✓ Available"
                  : "Not configured"}
              </span>
            </div>

            <div className="detail-row">
              <span>Enabled Since</span>
              <span>{new Date(mfaStatus.enabledAt).toLocaleDateString()}</span>
            </div>

            <div className="trusted-devices">
              <h4>Trusted Devices</h4>
              {mfaStatus.trustedDevices &&
              mfaStatus.trustedDevices.length > 0 ? (
                <div className="devices-list">
                  {mfaStatus.trustedDevices.map((device) => (
                    <div key={device.id} className="device-item">
                      <div className="device-info">
                        <span className="device-name">{device.deviceName}</span>
                        <span className="device-type">
                          ({device.deviceType})
                        </span>
                        <span className="device-date">
                          Last used:{" "}
                          {new Date(device.lastUsedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`status ${device.isActive ? "active" : ""}`}
                      >
                        {device.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No trusted devices yet</p>
              )}
            </div>

            <div className="actions">
              <button
                className="btn-primary"
                onClick={handleGenerateNewCodes}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate New Backup Codes"}
              </button>
              <button
                className="btn-danger"
                onClick={() => setShowDisableForm(true)}
                disabled={showDisableForm}
              >
                Disable MFA
              </button>
            </div>

            {showDisableForm && (
              <div className="disable-form">
                <h4>Disable Two-Factor Authentication</h4>
                <p className="warning">
                  Are you sure? Disabling MFA will reduce your account security.
                </p>

                <input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  disabled={isDisabling}
                />

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleDisableMFA}
                    disabled={isDisabling}
                  >
                    {isDisabling ? "Disabling..." : "Confirm Disable"}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowDisableForm(false);
                      setPassword("");
                      setError("");
                    }}
                    disabled={isDisabling}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mfa-disabled">
            <p>You haven't set up two-factor authentication yet.</p>
            <p className="info">
              Adding an extra layer of security to your account is quick and
              easy.
            </p>
          </div>
        )}
      </div>

      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default MFAManagement;
