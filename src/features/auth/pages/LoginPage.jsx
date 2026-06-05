import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoginWithMicrosoftMutation, useVerifyMfaLoginMutation, useLoginMutation, useVerifyEmailMfaMutation } from "../../../api/authApi";
import { consumeAuthStatusMessage } from "../../../api/baseQueryWithSession";
import { setCredentials } from "../../../api/authSlice";
import { redirectUserByRole } from "../utils/authRedirect";
import { performMicrosoftLoginRedirect, handleMicrosoftRedirect } from "../utils/microsoftLogin";
import { toast } from "react-toastify";
import ncbalogo from "../../../assets/ncba-logo.png";
import { LoadingOutlined, EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import "./LoginPage.css";

const LoginPage = () => {
  const [loginError, setLoginError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [persistedStatusMessage] = useState(() => consumeAuthStatusMessage());
  const [loginWithMicrosoft] = useLoginWithMicrosoftMutation();
  const [login] = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("select"); // 'select' | 'admin'
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMethod, setMfaMethod] = useState("TOTP"); // 'TOTP' | 'EMAIL'
  const [mfaTempToken, setMfaTempToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  const [verifyMfaLogin] = useVerifyMfaLoginMutation();
  const [verifyEmailMfa] = useVerifyEmailMfaMutation();
  const statusMessage = location.state?.status || persistedStatusMessage || "";

  useEffect(() => {
    if (statusMessage) {
      toast.info(statusMessage);
    }
  }, [statusMessage]);

  useEffect(() => {
    // Attempt to handle redirect on page load
    handleMicrosoftRedirect({
      loginWithMicrosoft,
      dispatch,
      setCredentials,
      navigate,
      redirectUserByRole,
      onError: (msg) => {
        setLoginError(msg);
        toast.error(msg);
      },
      setIsSigningIn,
      onMfaRequired: (res) => {
        setMfaRequired(true);
        // Sometimes backends use sessionToken instead of tempToken
        setMfaTempToken(res.tempToken || res.sessionToken || res.token);
        toast.info("Please enter your Authenticator code.");
      },
    });
  }, [loginWithMicrosoft, dispatch, navigate]);

  const handleAdLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setLoginError("Please enter both email and password.");
      return;
    }
    setLoginError("");
    setIsSigningIn(true);
    try {
      const response = await login(form).unwrap();

      const isMfa = response?.isMFARequired || response?.IsMFARequired;
      if (isMfa) {
        setMfaRequired(true);
        setMfaMethod(response?.mfaMethod || response?.MFAMethod || "EMAIL");
        setMfaTempToken(response?.mfaSessionToken || response?.MFASessionToken);

        const devCode = response?.devTestCode || response?.DevTestCode;
        if (devCode) {
          toast.info(`Development MFA Code (Email): ${devCode}`);
          setMfaCode(devCode);
        } else {
          toast.info("MFA code has been sent to your email.");
        }
        return;
      }
      
      const finalUser = response?.user ?? response?.User;
      const finalToken = response?.token ?? response?.Token;

      if (!finalUser || !finalToken) {
        throw new Error("Incomplete response from server. Please try again.");
      }

      dispatch(setCredentials({ user: finalUser, token: finalToken }));

      redirectUserByRole({
        navigate,
        role: finalUser?.role ?? finalUser?.Role,
        successMessage: "Signed in successfully.",
      });
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Invalid credentials. Please try again.";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setLoginError("");
    setIsSigningIn(true);
    try {
      await performMicrosoftLoginRedirect({
        onError: (msg) => {
          setLoginError(msg);
          toast.error(msg);
          setIsSigningIn(false);
        },
      });
    } catch (e) {
      setIsSigningIn(false);
    }
  };

  const handleMfaVerify = async () => {
    if (mfaCode.length !== 6) {
      setLoginError("Please enter the 6-digit code.");
      return;
    }
    setLoginError("");
    setIsVerifyingMfa(true);
    try {
      let response;
      if (mfaMethod === "EMAIL") {
        response = await verifyEmailMfa({
          sessionToken: mfaTempToken,
          code: mfaCode,
        }).unwrap();
      } else {
        response = await verifyMfaLogin({
          tempToken: mfaTempToken,
          sessionToken: mfaTempToken,
          token: mfaTempToken,
          totpCode: mfaCode,
        }).unwrap();
      }

      // Backend returns camelCase or PascalCase.
      const finalUser = response?.user ?? response?.User;
      const finalToken = response?.token ?? response?.Token;

      if (!finalUser || !finalToken) {
        throw new Error("Incomplete response from server. Please try again.");
      }

      // Set credentials in Redux BEFORE navigating so ProtectedRoute sees the user.
      dispatch(setCredentials({ user: finalUser, token: finalToken }));

      redirectUserByRole({
        navigate,
        role: finalUser?.role ?? finalUser?.Role,
        successMessage: "Signed in successfully.",
      });
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "Invalid MFA code. Please try again.";
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="split-container">

        {/* FORM COLUMN (Left side) */}
        <div className="form-column">

          {/* HEADER: Logo */}
          <div className="form-header">
            <img
              src={ncbalogo}
              alt="NCBA Bank Logo"
              className="h-8 w-auto object-contain"
              style={{ maxHeight: "40px" }}
            />
          </div>

          {/* MIDDLE: SSO Content */}
          <div className="login-form-wrapper">
            <div className="welcome-text">
              <h3>Welcome to the DCL and Deferral Management System</h3>
            </div>

            {statusMessage && (
              <div className="status-banner">{statusMessage}</div>
            )}

            {loginError && (
              <div className="error-banner">{loginError}</div>
            )}

            {mfaRequired ? (
              <div className="mfa-login-wrapper">
                <div style={{ textAlign: "center", marginBottom: "1.5rem", color: "#6B7280", fontSize: "0.875rem" }}>
                  {mfaMethod === "EMAIL"
                    ? "Please enter the 6-digit code sent to your email."
                    : "Please enter the 6-digit code from your Authenticator app."}
                </div>
                
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="login-input mfa-code-input"
                  disabled={isVerifyingMfa}
                  style={{ width: "100%", padding: "0.75rem", textAlign: "center", letterSpacing: "0.5rem", fontSize: "1.5rem", borderRadius: "0.375rem", border: "1px solid #D1D5DB", marginBottom: "1rem" }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mfaCode.length === 6) {
                      handleMfaVerify();
                    }
                  }}
                  autoFocus
                />
                
                <button
                  type="button"
                  className="login-btn"
                  onClick={handleMfaVerify}
                  disabled={isVerifyingMfa || mfaCode.length !== 6}
                  style={{ background: "#2196f3", color: "white", width: "100%", justifyContent: "center" }}
                >
                  {isVerifyingMfa ? (
                    <>
                      <LoadingOutlined style={{ fontSize: "1rem", marginRight: "0.5rem" }} />
                      Verifying…
                    </>
                  ) : "Verify"}
                </button>
                <button
                  type="button"
                  className="login-btn"
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaCode("");
                    setLoginError("");
                  }}
                  disabled={isVerifyingMfa}
                  style={{ marginTop: "0.5rem", background: "transparent", color: "#4B5563", border: "1px solid #D1D5DB", width: "100%", justifyContent: "center" }}
                >
                  Cancel
                </button>
              </div>
            ) : loginMethod === "select" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ textAlign: "center", marginBottom: "1.5rem", color: "#6B7280", fontSize: "0.875rem" }}>
                  Please select your preferred sign-in method.
                </div>
                {/* Admin Credentials sign-in option — temporarily hidden */}
                {/* <button
                  type="button"
                  className="login-btn"
                  onClick={() => setLoginMethod("admin")}
                  style={{ background: "#2196f3", color: "white", width: "100%", justifyContent: "center" }}
                >
                  Sign in with Admin Credentials
                </button>
                <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: "0.875rem", margin: "0.5rem 0" }}>
                  — OR —
                </div> */}
                <button
                  id="microsoftSsoBtn"
                  type="button"
                  className="login-btn"
                  onClick={handleMicrosoftSignIn}
                  disabled={isSigningIn}
                  style={{ background: "white", color: "#374151", border: "1px solid #D1D5DB", width: "100%", justifyContent: "center", gap: "0.75rem" }}
                >
                  {isSigningIn ? (
                    <>
                      <LoadingOutlined style={{ fontSize: "1rem" }} />
                      Signing in…
                    </>
                  ) : (
                    <>
                      {/* Microsoft "waffle" logo */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 21 21"
                        aria-hidden="true"
                      >
                        <rect x="1"  y="1"  width="9" height="9" fill="#f25022" />
                        <rect x="11" y="1"  width="9" height="9" fill="#7fba00" />
                        <rect x="1"  y="11" width="9" height="9" fill="#00a4ef" />
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                      </svg>
                      Sign in with Microsoft Entra ID
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("select");
                      setLoginError("");
                    }}
                    style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "0.875rem", textDecoration: "underline" }}
                  >
                    &larr; Back
                  </button>
                  <div style={{ flex: 1, textAlign: "center", color: "#6B7280", fontSize: "0.875rem" }}>
                    Sign in with Admin Credentials
                  </div>
                  <div style={{ width: "40px" }}></div>
                </div>

                <form onSubmit={handleAdLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label htmlFor="ad-email" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                      Email / Username
                    </label>
                    <input
                      id="ad-email"
                      type="text"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        setLoginError("");
                      }}
                      placeholder="Enter your email"
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid #D1D5DB" }}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="ad-password" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
                      Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="ad-password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => {
                          setForm({ ...form, password: e.target.value });
                          setLoginError("");
                        }}
                        placeholder="Enter your password"
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid #D1D5DB" }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6B7280" }}
                      >
                        {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="login-btn"
                    disabled={isSigningIn}
                    style={{ background: "#2196f3", color: "white", width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
                  >
                    {isSigningIn ? (
                      <>
                        <LoadingOutlined style={{ fontSize: "1rem", marginRight: "0.5rem" }} />
                        Signing in…
                      </>
                    ) : "Sign In"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* BOTTOM: Footer */}
          <div className="form-footer-layout">
            <div className="copyright">
              Copyright : NCBA Bank LTD, All Right Reserved
            </div>
            <div className="footer-links-inline">
              <a href="#">Terms &amp; Condition</a>
              <a href="#">Privacy &amp; Policy</a>
            </div>
          </div>
        </div>

        {/* BRAND COLUMN (Right side) */}
        <div className="brand-column">
          <div className="brand-large">
            <h1>NCBA BANK</h1>
            <div className="tagline">DCL &amp; Deferral System</div>
          </div>
          <div className="flex-1 flex items-center justify-center relative w-full mt-10">
            {/* Glowing background effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#3AB3E5] rounded-full blur-[100px] opacity-10"></div>

            {/* Security Shield Widget (Bottom Left) */}
            <div className="absolute bottom-10 left-6 z-20 transform hover:scale-105 transition-transform duration-300">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0px 15px 25px rgba(0,0,0,0.5))" }}>
                <rect width="80" height="80" rx="16" fill="#111827" stroke="#1F2937" strokeWidth="2"/>
                <path d="M40 20L25 26V40C25 52 31 62 40 66C49 62 55 52 55 40V26L40 20Z" fill="#3AB3E5" fillOpacity="0.15" stroke="#3AB3E5" strokeWidth="2"/>
                <path d="M35 43L39 47L47 37" stroke="#3AB3E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Analytics Chart Widget (Top Right) */}
            <div className="absolute top-12 right-6 z-20 transform hover:-translate-y-2 transition-transform duration-300">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0px 15px 25px rgba(0,0,0,0.5))" }}>
                <rect width="100" height="100" rx="16" fill="#111827" stroke="#1F2937" strokeWidth="2"/>
                <rect x="20" y="55" width="14" height="25" rx="3" fill="#4B5563"/>
                <rect x="43" y="40" width="14" height="40" rx="3" fill="#3AB3E5" fillOpacity="0.6"/>
                <rect x="66" y="25" width="14" height="55" rx="3" fill="#3AB3E5"/>
                <circle cx="73" cy="25" r="5" fill="#FFFFFF"/>
              </svg>
            </div>

            {/* Approval Notification Widget (Top Left) */}
            <div className="absolute top-1/3 left-0 z-20 transform -translate-x-4 hover:translate-x-0 transition-transform duration-300">
              <svg width="140" height="48" viewBox="0 0 140 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0px 10px 20px rgba(0,0,0,0.5))" }}>
                <rect width="140" height="48" rx="24" fill="#111827" stroke="#1F2937" strokeWidth="2"/>
                <circle cx="24" cy="24" r="12" fill="#10B981" fillOpacity="0.2"/>
                <path d="M19 24L22 27L29 20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="46" y="18" width="60" height="4" rx="2" fill="#9CA3AF"/>
                <rect x="46" y="28" width="40" height="3" rx="1.5" fill="#4B5563"/>
              </svg>
            </div>

            {/* Document Checklist SVG Illustration (Center) */}
            <svg width="280" height="340" viewBox="0 0 280 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10" style={{ filter: "drop-shadow(0px 20px 40px rgba(0,0,0,0.6))" }}>
              <rect x="30" y="40" width="220" height="280" rx="20" fill="#111827" stroke="#1F2937" strokeWidth="4"/>
              <rect x="50" y="60" width="180" height="240" rx="12" fill="#1F2937"/>
              <rect x="50" y="60" width="180" height="240" rx="12" fill="url(#grad1)" opacity="0.3"/>
              <path d="M110 20H170C175.523 20 180 24.4772 180 30V55H100V30C100 24.4772 104.4772 20 110 20Z" fill="#3AB3E5"/>
              <rect x="120" y="32" width="40" height="6" rx="3" fill="#000000" fillOpacity="0.4"/>
              <rect x="70" y="90" width="60" height="10" rx="5" fill="#4B5563"/>
              <rect x="70" y="110" width="140" height="2" fill="#374151"/>
              <g transform="translate(70, 130)">
                <rect x="0" y="0" width="24" height="24" rx="6" fill="#3AB3E5" fillOpacity="0.15" stroke="#3AB3E5" strokeWidth="2"/>
                <path d="M6 12L10 16L18 8" stroke="#3AB3E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="40" y="8" width="90" height="8" rx="4" fill="#9CA3AF"/>
              </g>
              <g transform="translate(70, 180)">
                <rect x="0" y="0" width="24" height="24" rx="6" fill="#3AB3E5" fillOpacity="0.15" stroke="#3AB3E5" strokeWidth="2"/>
                <path d="M6 12L10 16L18 8" stroke="#3AB3E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="40" y="8" width="70" height="8" rx="4" fill="#9CA3AF"/>
              </g>
              <g transform="translate(70, 230)">
                <rect x="0" y="0" width="24" height="24" rx="6" fill="transparent" stroke="#4B5563" strokeWidth="2"/>
                <rect x="40" y="8" width="80" height="8" rx="4" fill="#4B5563"/>
              </g>
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3AB3E5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#111827" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;