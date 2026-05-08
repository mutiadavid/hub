import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../../api/authApi";
import { consumeAuthStatusMessage } from "../../../api/baseQueryWithSession";
import { setCredentials } from "../../../api/authSlice";
import { redirectUserByRole } from "../utils/authRedirect";
import { getAuthErrorMessage } from "../utils/authError";
import { toast } from "react-toastify";
import { useGetUsersQuery } from "../../../api/userApi";
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

  // Lazy user list fetch (skipped until needed)
  const { refetch: refetchUsers } = useGetUsersQuery(undefined, { skip: true });

  useEffect(() => {
    if (statusMessage) {
      toast.info(statusMessage);
    }
  }, [statusMessage]);

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
      const errMsg = getAuthErrorMessage(err);
      setLoginError(errMsg);
      // Show toast with server message if present, otherwise generic mapped message
      const serverMessage = err?.data?.message || err?.message;
      toast.error(serverMessage || errMsg);

      // Try to surface failed-attempts info by fetching the user list
      try {
        const usersResult = await refetchUsers();
        const fetched = usersResult?.data || [];
        const found = fetched.find(
          (u) => String(u.email || "").toLowerCase() === String(form.email || "").toLowerCase()
        );
        if (found) {
          if (!found.active) {
            toast.error(found.disableReason || "Your account has been deactivated.");
          } else {
            toast.info(`Failed attempts: ${found.failedLoginAttempts || 0}`);
          }
        }
      } catch (e) {
        // ignore failures to fetch users
      }
    }
  };

  return (
    <div className="ms-login-page">
      <div className="ms-login-card" role="main" aria-label="Microsoft sign in">
        <div className="ms-login-brand" aria-label="Microsoft">
          <span className="ms-login-brand__mark" aria-hidden="true">
            <span className="ms-login-brand__tile ms-login-brand__tile--red" />
            <span className="ms-login-brand__tile ms-login-brand__tile--green" />
            <span className="ms-login-brand__tile ms-login-brand__tile--blue" />
            <span className="ms-login-brand__tile ms-login-brand__tile--yellow" />
          </span>
          <span className="ms-login-brand__name">Microsoft</span>
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
      </div>
    </div>
  );
};

export default LoginPage;