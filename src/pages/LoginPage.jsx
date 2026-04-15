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
import SSOLogin from "../components/SSOLogin";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";
import { showAuthSuccessToast } from "../utils/authToast";
import { consumeAuthStatusMessage } from "../api/baseQueryWithSession";

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
      console.log("Login credentials:", form);
      const res = await login(form).unwrap();
      const sessionToken = res?.mfaSessionToken || res?.mFASessionToken;
      const mfaMethod = res?.mfaMethod || res?.mFAMethod;
      const isMFARequired = res?.isMFARequired;
      const testCode = res?.devTestCode;

      console.log("✅ RESOLVED SESSION TOKEN:", sessionToken);
      console.log("✅ RESOLVED MFA METHOD:", mfaMethod);
      console.log("✅ IS MFA REQUIRED:", isMFARequired);
      console.log("🧪 TEST CODE (DEV ONLY):", testCode);

      if (isMFARequired && sessionToken) {
        console.log("✅ [LOGIN SUCCESS - MFA REQUIRED]");
        console.log("📧 User Email:", form.email);
        console.log("🔑 MFA Session Token:", sessionToken);
        console.log("📤 MFA Method:", mfaMethod);
        console.log("🧪 Test Code:", testCode);
        console.log("⏳ Switching to MFA verification step...");

        setMFASessionTokenLocal(sessionToken);
        setMFAMethod(mfaMethod || "EMAIL");
        setDevTestCode(testCode || "");
        dispatch(setMFASessionToken(sessionToken));
        setMFAStep(true);
        return;
      }

      console.log("⚠️ [NO MFA REQUIRED] Logging in without MFA");
      console.log("User Role:", res?.user?.role);
      dispatch(setCredentials(res));
      redirectUserByRole(res?.user?.role, "Login successful.");
    } catch (err) {
      console.error("❌ [LOGIN ERROR]", err);
      console.error("Error Details:", err?.data);
      setLoginError(err?.data?.message || "Login failed");
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

  const handleSSOSuccess = (ssoResponse) => {
    dispatch(setCredentials(ssoResponse));
    redirectUserByRole(ssoResponse?.user?.role, "Login successful.");
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
      title="Sign in"
      status={statusMessage || null}
      social={<SSOLogin onSuccess={handleSSOSuccess} />}
      dividerText="or continue with email"
    >
      <form onSubmit={handleLoginSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-field__label">Email Address</label>
          <div className="auth-input-wrap">
            <FiMail className="auth-input__icon" />
            <input
              type="email"
              value={form.email}
              placeholder="name@bank.com"
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
          <label className="auth-field__label">Password</label>
          <div className="auth-input-wrap">
            <FiLock className="auth-input__icon" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              placeholder="Enter your password"
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

        <div className="auth-meta-row">
          <label className="auth-check">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>
          <button type="button">Forgot Password?</button>
        </div>

        <button type="submit" disabled={isLoginLoading} className="auth-button">
          {isLoginLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthSplitLayout>
  );
};

export default LoginPage;
