import React, { useState } from "react";
import { useSetupMFAMutation, useVerifyMFASetupMutation } from "../api/mfaApi";
import "./MFASetup.css";

/**
 * MFA Setup Component
 * Handles TOTP generation, QR code display, and verification
 */
const MFASetup = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState("initial"); // initial, setup, verify
  const [totpCode, setTotpCode] = useState("");
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const [setupMFA, { isLoading: isSetupLoading }] = useSetupMFAMutation();
  const [verifySetup, { isLoading: isVerifyLoading }] =
    useVerifyMFASetupMutation();

  const handleStartSetup = async () => {
    try {
      setError("");
      const result = await setupMFA().unwrap();
      setSecret(result.secret);
      setQrCodeUrl(result.qrCodeUrl);
      setSessionToken(result.sessionToken);
      setStep("setup");
    } catch (err) {
      setError(err?.data?.message || "Failed to generate MFA secret");
    }
  };

  const handleVerify = async () => {
    try {
      if (totpCode.length !== 6) {
        setError("Please enter a 6-digit code");
        return;
      }

      setError("");
      const result = await verifySetup({
        totpCode,
        sessionToken,
      }).unwrap();

      setBackupCodes(result.backupCodes);
      setStep("verify");
    } catch (err) {
      setError(
        err?.data?.message || "Failed to verify MFA code. Please try again.",
      );
    }
  };

  const handleCopyBackupCodes = () => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    alert("Backup codes copied to clipboard. Save them in a secure location.");
  };

  const handleDownloadBackupCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "dcl-mfa-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleComplete = () => {
    onSuccess && onSuccess();
  };

  return (
    <div className="mfa-setup-container">
      <div className="mfa-setup-modal">
        <h2>Set Up Multi-Factor Authentication</h2>

        {step === "initial" && (
          <div className="mfa-step">
            <p className="mfa-description">
              Enhance your account security with Two-Factor Authentication
              (2FA). You'll need an authenticator app like Google Authenticator,
              Authy, or Microsoft Authenticator.
            </p>

            <div className="mfa-features">
              <div className="feature">
                <span className="icon">✓</span>
                <span>Protect your account from unauthorized access</span>
              </div>
              <div className="feature">
                <span className="icon">✓</span>
                <span>Receive secure codes on your authenticator app</span>
              </div>
              <div className="feature">
                <span className="icon">✓</span>
                <span>Generate backup codes for account recovery</span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleStartSetup}
              disabled={isSetupLoading}
            >
              {isSetupLoading ? "Loading..." : "Start Setup"}
            </button>
            <button className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        )}

        {step === "setup" && (
          <div className="mfa-step">
            <h3>Step 1: Scan QR Code</h3>
            <p>Open your authenticator app and scan this QR code:</p>

            {qrCodeUrl && (
              <div className="qr-code-container">
                <img src={qrCodeUrl} alt="TOTP QR Code" className="qr-code" />
              </div>
            )}

            <p className="mfa-hint">Or enter this code manually:</p>
            <div className="secret-key">
              <code>{secret}</code>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  alert("Secret copied to clipboard");
                }}
              >
                Copy
              </button>
            </div>

            <div className="divider">or</div>

            <h3>Step 2: Verify Code</h3>
            <p>Enter the 6-digit code from your authenticator app:</p>

            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              className="mfa-input"
              disabled={isVerifyLoading}
            />

            {error && <div className="error-message">{error}</div>}

            <button
              className="btn-primary"
              onClick={handleVerify}
              disabled={isVerifyLoading || totpCode.length !== 6}
            >
              {isVerifyLoading ? "Verifying..." : "Verify and Enable MFA"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setStep("initial")}
            >
              Back
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className="mfa-step verify-success">
            <div className="success-icon">✓</div>
            <h3>MFA Enabled Successfully!</h3>

            <p className="warning">
              <strong>Important:</strong> Save your backup codes in a secure
              location. You'll need them if you lose access to your
              authenticator app.
            </p>

            <div className="backup-codes-container">
              <h4>Your Backup Codes</h4>
              <div className="backup-codes-list">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="backup-actions">
              <button className="btn-secondary" onClick={handleCopyBackupCodes}>
                📋 Copy All Codes
              </button>
              <button
                className="btn-secondary"
                onClick={handleDownloadBackupCodes}
              >
                ⬇ Download Codes
              </button>
            </div>

            <div className="confirmation">
              <label>
                <input
                  type="checkbox"
                  checked={showBackupCodes}
                  onChange={(e) => setShowBackupCodes(e.target.checked)}
                />
                I have saved my backup codes in a secure location
              </label>
            </div>

            <button
              className="btn-primary"
              onClick={handleComplete}
              disabled={!showBackupCodes}
            >
              Complete Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFASetup;
