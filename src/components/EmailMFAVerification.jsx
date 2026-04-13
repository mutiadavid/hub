import React, { useState, useEffect } from "react";
import { message } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { FiAlertCircle, FiArrowLeft, FiKey, FiMail } from "react-icons/fi";
import AuthSplitLayout from "./auth/AuthSplitLayout";

/**
 * Email MFA Verification Component
 * Displays email-based MFA code input screen with consistent design
 */
const EmailMFAVerification = ({
  mfaSessionToken,
  userEmail,
  testCode,
  onVerify,
  onBack,
  isLoading,
  onResendCode,
}) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [currentTestCode, setCurrentTestCode] = useState(testCode || "");
  const [showTestCodePopup, setShowTestCodePopup] = useState(!!testCode);

  // 🔐 LOG MFA SESSION INFO FOR TESTING
  useEffect(() => {
    console.log("🔐 [MFA VERIFICATION COMPONENT LOADED]");
    console.log("📧 Email:", userEmail);
    console.log("🔑 Session Token:", mfaSessionToken);
    console.log(
      "⏱️  Code expires in 10 minutes. Enter the 6-digit code sent to your email.",
    );
    setCurrentTestCode(testCode || "");
    if (testCode) {
      setShowTestCodePopup(true);
      const timer = setTimeout(() => setShowTestCodePopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [testCode, mfaSessionToken, userEmail]);

  // Countdown timer for code expiry
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          setError("Code expired. Please request a new one.");
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onBack]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCountdown]);

  const handleSubmit = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setError("");
      await onVerify({
        sessionToken: mfaSessionToken,
        code: code,
      });
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const response = await onResendCode(mfaSessionToken);
      const nextTestCode = response?.devTestCode;
      if (nextTestCode) {
        setCurrentTestCode(nextTestCode);
        setShowTestCodePopup(true);
        setTimeout(() => setShowTestCodePopup(false), 8000);
      }
      message.success(response?.message || "Code resent to your email");
      setCode("");
      setError("");
      setResendCountdown(60); // 60 second cooldown
    } catch (err) {
      message.error(err.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatEmail = (email) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    const maskedUsername =
      username.substring(0, 2) + "*".repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  };

  return (
    <AuthSplitLayout
      title="Verify your email"
      subtitle={`Enter the one-time code sent to ${formatEmail(userEmail)}`}
      heroBody="Email verification keeps document reviews, deferral submissions, and role-based actions secure before users enter the workspace."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="auth-form"
      >
        {showTestCodePopup && currentTestCode ? (
          <div className="auth-card auth-card--warning">
            <p className="auth-card__eyebrow">Development Code</p>
            <p className="auth-card__title" style={{ letterSpacing: "0.28em", fontFamily: 'Consolas, monospace' }}>
              {currentTestCode}
            </p>
          </div>
        ) : null}

        <div className="auth-card auth-card--info">
          <p className="auth-card__eyebrow">Delivery</p>
          <p className="auth-card__title">Code sent to {formatEmail(userEmail)}</p>
          <p className="auth-card__body">Use the latest 6-digit code from your inbox. Each code can only be used once.</p>
        </div>

        <div className="auth-field">
          <label className="auth-field__label">Enter 6-Digit Code</label>
          <input
            type="text"
            maxLength="6"
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setCode(value);
              setError("");
            }}
            className="auth-code-input"
            disabled={isLoading}
            autoFocus
          />
        </div>

        {error ? (
          <div className="auth-card auth-card--error">
            <p className="auth-card__title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FiAlertCircle />
              <span>{error}</span>
            </p>
          </div>
        ) : null}

        <div className="auth-meta-row">
          <span className="auth-check">
            <ClockCircleOutlined />
            <span>Expires in {formatTime(timeRemaining)}</span>
          </span>
          <button type="button" onClick={handleResendCode} disabled={isResending || resendCountdown > 0}>
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
          </button>
        </div>

        <button type="submit" disabled={isLoading || code.length !== 6} className="auth-button">
          {isLoading ? "Verifying..." : "Verify Code"}
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

export default EmailMFAVerification;
