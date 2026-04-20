import React, { useState } from "react";
import {
  useLoginMutation,
  useVerifyEmailMFAMutation,
  useResendMFACodeMutation,
} from "../api/authApi";
import { useDispatch } from "react-redux";
import { setCredentials, setMFASessionToken } from "../api/authSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import EmailMFAVerification from "../components/EmailMFAVerification";
import MFAVerification from "../components/MFAVerification";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import { showAuthSuccessToast } from "../utils/authToast";
import { consumeAuthStatusMessage } from "../api/baseQueryWithSession";

const getErrorMessage = (err) => {
  if (!err) {
    return "Login failed";
  }

  const validationErrors = err.data?.errors;
  if (validationErrors && typeof validationErrors === "object") {
    const firstValidationMessage = Object.values(validationErrors)
      .flat()
      .find((message) => typeof message === "string" && message.trim());

    if (firstValidationMessage) {
      return firstValidationMessage;
    }
  }

  if (typeof err.data === "string" && err.data.trim()) {
    return err.data;
  }

  if (err.data?.message) {
    return err.data.message;
  }

  if (err.error) {
    return err.error;
  }

  return "Login failed";
};

const toLoggableError = (err) => ({
  status: err?.status ?? null,
  data: err?.data ?? null,
  error: err?.error ?? null,
  originalStatus: err?.originalStatus ?? null,
});

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mfaStep, setMFAStep] = useState(false);
  const [mfaMethod, setMFAMethod] = useState(null);
  const [mfaSessionToken, setMFASessionTokenLocal] = useState("");
  const [devTestCode, setDevTestCode] = useState("");
  const [persistedStatusMessage] = useState(() => consumeAuthStatusMessage());
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyEmailMFA, { isLoading: isVerifyingEmailMFA }] =
    useVerifyEmailMFAMutation();
  const [resendMFACode, { isLoading: isResending }] =
    useResendMFACodeMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const statusMessage = location.state?.status || persistedStatusMessage || "";

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await login(form).unwrap();
      const sessionToken = res?.mfaSessionToken || res?.mFASessionToken;
      const mfaMethod = res?.mfaMethod || res?.mFAMethod;
      const isMFARequired = res?.isMFARequired;
      const testCode = res?.devTestCode;

      if (isMFARequired && sessionToken) {
        setMFASessionTokenLocal(sessionToken);
        setMFAMethod(mfaMethod || "EMAIL");
        setDevTestCode(testCode || "");
        dispatch(setMFASessionToken(sessionToken));
        setMFAStep(true);
        return;
      }

      dispatch(setCredentials(res));
      redirectUserByRole(res?.user?.role, "Login successful.");
    } catch (err) {
      const normalizedError = toLoggableError(err);
      console.error("❌ [LOGIN ERROR]", normalizedError);
      console.error("Error Details:", getErrorMessage(err));
      setLoginError(getErrorMessage(err));
    }
  };

  const handleEmailMFAVerify = async (data) => {
    try {
      const res = await verifyEmailMFA({
        sessionToken: data.sessionToken,
        code: data.code,
      }).unwrap();

      dispatch(setCredentials(res));
      dispatch(setMFASessionToken(null));
      redirectUserByRole(res?.user?.role, "Login successful.");
    } catch (err) {
      throw new Error(err?.data?.message || "MFA verification failed");
    }
  };

  const handleResendCode = async (sessionToken) => {
    try {
      return await resendMFACode(sessionToken).unwrap();
    } catch (err) {
      throw new Error(err?.data?.message || "Failed to resend code");
    }
  };

  const handleMFAVerify = async (mfaToken) => {
    try {
      const res = await login({
        ...form,
        mfaToken,
        sessionToken: mfaSessionToken,
      }).unwrap();

      dispatch(setCredentials(res));
      dispatch(setMFASessionToken(null));
      redirectUserByRole(res?.user?.role, "Login successful.");
    } catch (err) {
      alert(err?.data?.message || "MFA verification failed");
    }
  };

  const redirectUserByRole = (role, successMessage) => {
    const roleStr = role?.toLowerCase();
    if (successMessage) {
      showAuthSuccessToast(successMessage);
    }

    switch (roleStr) {
      case "admin":
        navigate("/admin");
        break;
      case "cochecker":
        navigate("/cochecker");
        break;
      case "rm":
        navigate("/rm");
        break;
      case "cocreator":
        navigate("/cocreator");
        break;
      case "approver":
        navigate("/approver");
        break;
      default:
        navigate("/register");
        break;
    }
  };

  if (mfaStep && mfaMethod === "EMAIL") {
    return (
      <EmailMFAVerification
        mfaSessionToken={mfaSessionToken}
        userEmail={form.email}
        testCode={devTestCode}
        onVerify={handleEmailMFAVerify}
        onBack={() => {
          setMFAStep(false);
          setMFASessionTokenLocal("");
          setMFAMethod(null);
          setDevTestCode("");
        }}
        isLoading={isVerifyingEmailMFA || isResending}
        onResendCode={handleResendCode}
      />
    );
  }

  if (mfaStep && mfaMethod === "TOTP") {
    return (
      <MFAVerification
        mfaSessionToken={mfaSessionToken}
        onVerify={handleMFAVerify}
        onBack={() => {
          setMFAStep(false);
          setMFASessionTokenLocal("");
          setMFAMethod(null);
        }}
        isLoading={isLoginLoading}
      />
    );
  }

  return (
    <AuthSplitLayout
      title="Sign in with Active Directory"
      subtitle="Use your bank directory email and Active Directory password to access the DCL workspace."
      status={statusMessage || null}
    >
      <form onSubmit={handleLoginSubmit} className="auth-form">
        <div className="auth-card auth-card--info">
          <p className="auth-card__eyebrow">Identity Provider</p>
          <p className="auth-card__title">Active Directory</p>
          <p className="auth-card__body">
            Enter the same corporate credentials you use for your Active Directory account. A one-time email verification step will follow.
          </p>
        </div>

        <div className="auth-field">
          <label className="auth-field__label">Active Directory Email</label>
          <div className="auth-input-wrap">
            <FiMail className="auth-input__icon" />
            <input
              type="email"
              value={form.email}
              placeholder="name@ncba.co.ke"
              className="auth-input"
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setLoginError("");
              }}
              required
            />
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-field__label">Active Directory Password</label>
          <div className="auth-input-wrap">
            <FiLock className="auth-input__icon" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              placeholder="Enter your Active Directory password"
              className="auth-input auth-input--with-action"
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setLoginError("");
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-input__action"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {loginError ? (
          <div className="auth-card auth-card--error">
            <p className="auth-card__title">{loginError}</p>
          </div>
        ) : null}

        <button type="submit" disabled={isLoginLoading} className="auth-button">
          {isLoginLoading ? "Signing in with Active Directory..." : "Continue with Active Directory"}
        </button>
      </form>
    </AuthSplitLayout>
  );
};

export default LoginPage;
