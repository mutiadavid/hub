import React, { useState, useEffect } from "react";
import { FiAlertCircle, FiArrowLeft, FiLock } from "react-icons/fi";
import AuthSplitLayout from "./auth/AuthSplitLayout";

/**
 * MFA Verification Component
 * Displays MFA verification form during login with consistent design
 */
const MFAVerification = ({ mfaSessionToken, onVerify, onBack, isLoading }) => {
  const [code, setCode] = useState("");
  const [method, setMethod] = useState("totp");
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onBack]);

  const handleSubmit = () => {
    if (!code || code.length < 4) {
      setError("Please enter a valid code");
      return;
    }

    onVerify({
      mfaToken: code,
      method: method,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AuthSplitLayout
      title="Verify your identity"
      subtitle={`Complete a second step to continue. Session expires in ${formatTime(timeRemaining)}.`}
      heroBody="Multi-factor verification protects sensitive checklist reviews, lender exceptions, and approval decisions before users enter the platform."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="auth-form"
      >
        <div className="auth-field">
          <label className="auth-field__label">Verification Method</label>
          <div className="auth-tile-grid">
            <button
              type="button"
              className={`auth-tile ${method === "totp" ? "auth-tile--active" : ""}`}
              onClick={() => {
                setMethod("totp");
                setError("");
              }}
            >
              Authenticator App
            </button>
            <button
              type="button"
              className={`auth-tile ${method === "backup" ? "auth-tile--active" : ""}`}
              onClick={() => {
                setMethod("backup");
                setError("");
              }}
            >
              Backup Code
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field__label">
            {method === "totp" ? "Enter 6-digit authenticator code" : "Enter backup code"}
          </label>
          <div className="auth-input-wrap">
            <FiLock className="auth-input__icon" />
            <input
              type="text"
              maxLength={method === "totp" ? "6" : "8"}
              placeholder={method === "totp" ? "000000" : "XXXXXXXX"}
              value={code}
              onChange={(e) => {
                if (method === "totp") {
                  setCode(e.target.value.replace(/\D/g, ""));
                } else {
                  setCode(e.target.value.toUpperCase());
                }
                setError("");
              }}
              className="auth-input"
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>

        {error ? (
          <div className="auth-card auth-card--error">
            <p className="auth-card__title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FiAlertCircle />
              <span>{error}</span>
            </p>
          </div>
        ) : null}

        <div className="auth-card auth-card--info">
          <p className="auth-card__eyebrow">Security Note</p>
          <p className="auth-card__body">Your verification code is short-lived and protects high-trust actions in the document checklist workflow.</p>
        </div>

        <button
          type="submit"
          disabled={isLoading || (method === "totp" && code.length !== 6) || code.length < 4}
          className="auth-button"
        >
          {isLoading ? "Verifying..." : "Verify Identity"}
        </button>

        <button type="button" onClick={onBack} disabled={isLoading} className="auth-button auth-button--secondary">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <FiArrowLeft />
            <span>Back to Login</span>
          </span>
        </button>
      </form>
    </AuthSplitLayout>
  );
};

export default MFAVerification;
