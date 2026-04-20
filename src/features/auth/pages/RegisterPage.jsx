import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useRegisterAdminMutation } from "../../../api/authApi";
import { getAuthErrorMessage, toLoggableAuthError } from "../utils/authError";
import "../../../styles/microsoftLogin.css";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerAdmin, { isLoading }] = useRegisterAdminMutation();
  const navigate = useNavigate();

  const getRegistrationErrorMessage = (error) => {
    const message = getAuthErrorMessage(error);
    return message === "Login failed" ? "Registration failed" : message;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setRegisterError("");

    if (form.password !== form.confirmPassword) {
      setRegisterError("Password and confirm password must match.");
      return;
    }

    try {
      await registerAdmin({
        name: form.name,
        email: form.email,
        password: form.password,
      }).unwrap();
      navigate("/login", {
        state: { status: "Your account has been created successfully." },
      });
    } catch (err) {
      console.error("❌ [REGISTER ERROR]", toLoggableAuthError(err));
      console.error("Error Details:", getRegistrationErrorMessage(err));
      setRegisterError(getRegistrationErrorMessage(err));
    }
  };

  return (
    <div className="ms-login-page">
      <div
        className="ms-login-card ms-login-card--register"
        role="main"
        aria-label="Microsoft-style registration"
      >
        <div className="ms-login-brand" aria-label="Microsoft">
          <span className="ms-login-brand__mark" aria-hidden="true">
            <span className="ms-login-brand__square ms-login-brand__square--red" />
            <span className="ms-login-brand__square ms-login-brand__square--green" />
            <span className="ms-login-brand__square ms-login-brand__square--blue" />
            <span className="ms-login-brand__square ms-login-brand__square--yellow" />
          </span>
          <span className="ms-login-brand__wordmark">Microsoft</span>
        </div>

        <h1 className="ms-login-card__title">Create account</h1>
        <p className="ms-login-card__subtitle">
          Use your Microsoft account details to create access. <span className="ms-login-card__subtitle-link">What&apos;s this?</span>
        </p>

        <form onSubmit={handleSubmit} className="ms-login-form">
          <label className="ms-login-form__label" htmlFor="register-name">
            Full name
          </label>
          <div className="ms-login-input-wrap">
            <FiUser className="ms-login-input__icon" />
            <input
              id="register-name"
              type="text"
              value={form.name}
              placeholder="Full name"
              className="ms-login-input ms-login-input--with-icon"
              onChange={(event) => {
                setForm({ ...form, name: event.target.value });
                setRegisterError("");
              }}
              autoComplete="name"
              required
            />
          </div>

          <label className="ms-login-form__label" htmlFor="register-email">
            Email address
          </label>
          <div className="ms-login-input-wrap">
            <FiMail className="ms-login-input__icon" />
            <input
              id="register-email"
              type="email"
              value={form.email}
              placeholder="Email, phone, or Skype"
              className="ms-login-input ms-login-input--with-icon"
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                setRegisterError("");
              }}
              autoComplete="email"
              required
            />
          </div>

          <label className="ms-login-form__label" htmlFor="register-password">
            Password
          </label>
          <div className="ms-login-input-wrap">
            <FiLock className="ms-login-input__icon" />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              placeholder="Password"
              className="ms-login-input ms-login-input--with-icon ms-login-input--with-action"
              onChange={(event) => {
                setForm({ ...form, password: event.target.value });
                setRegisterError("");
              }}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ms-login-input__action"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <label className="ms-login-form__label" htmlFor="register-confirm-password">
            Confirm password
          </label>
          <div className="ms-login-input-wrap">
            <FiLock className="ms-login-input__icon" />
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              placeholder="Confirm password"
              className="ms-login-input ms-login-input--with-icon ms-login-input--with-action"
              onChange={(event) => {
                setForm({ ...form, confirmPassword: event.target.value });
                setRegisterError("");
              }}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="ms-login-input__action"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {registerError ? (
            <div className="ms-login-card__message ms-login-card__message--error">
              {registerError}
            </div>
          ) : null}

          <button type="submit" disabled={isLoading} className="ms-login-submit">
            {isLoading ? "Creating account..." : "Next"}
          </button>
        </form>

        <p className="ms-login-card__footer">
          Already have an account?{" "}
          <button
            type="button"
            className="ms-login-card__footer-link"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;