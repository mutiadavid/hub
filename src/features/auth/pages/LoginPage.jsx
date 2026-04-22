import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../../api/authApi";
import { consumeAuthStatusMessage } from "../../../api/baseQueryWithSession";
import { setCredentials } from "../../../api/authSlice";
import { redirectUserByRole } from "../utils/authRedirect";
import { getAuthErrorMessage, toLoggableAuthError } from "../utils/authError";
import ncbaLogo from "../../../assets/ncbabanklogo.png";
import "../../../styles/microsoftLogin.css";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [persistedStatusMessage] = useState(() => consumeAuthStatusMessage());
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const statusMessage = location.state?.status || persistedStatusMessage || "";

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      const response = await login(form).unwrap();
      dispatch(setCredentials(response));
      redirectUserByRole({
        navigate,
        role: response?.user?.role,
        successMessage: "Login successful.",
      });
    } catch (err) {
      console.error("❌ [LOGIN ERROR]", toLoggableAuthError(err));
      console.error("Error Details:", getAuthErrorMessage(err));
      setLoginError(getAuthErrorMessage(err));
    }
  };

  return (
    <div className="ms-login-page">
      <div className="ms-login-card" role="main" aria-label="NCBA sign in">
        <div className="ms-login-brand" aria-label="NCBA">
          <img src={ncbaLogo} alt="NCBA" className="ms-login-brand__logo" />
        </div>

        <h1 className="ms-login-card__title">Sign in</h1>

        {statusMessage ? (
          <div className="ms-login-card__message ms-login-card__message--status">
            {statusMessage}
          </div>
        ) : null}

        <form onSubmit={handleLoginSubmit} className="ms-login-form">
          <label className="ms-login-form__label" htmlFor="login-email">
            Email, phone, or Skype
          </label>
          <input
            id="login-email"
            type="email"
            value={form.email}
            placeholder="Email, phone, or Skype"
            className="ms-login-input"
            onChange={(event) => {
              setForm({ ...form, email: event.target.value });
              setLoginError("");
            }}
            autoComplete="username"
            required
          />

          <label className="ms-login-form__label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={form.password}
            placeholder="Password"
            className="ms-login-input"
            onChange={(event) => {
              setForm({ ...form, password: event.target.value });
              setLoginError("");
            }}
            autoComplete="current-password"
            required
          />

          {loginError ? (
            <div className="ms-login-card__message ms-login-card__message--error">
              {loginError}
            </div>
          ) : null}

          <button type="submit" disabled={isLoginLoading} className="ms-login-submit">
            {isLoginLoading ? "Signing in..." : "Next"}
          </button>
        </form>

        <p className="ms-login-card__footer">
          No account?{" "}
          <button
            type="button"
            className="ms-login-card__footer-link"
            onClick={() => navigate("/register")}
          >
            Create one!
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;