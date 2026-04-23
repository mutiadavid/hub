import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterAdminMutation } from "../../../api/authApi";
import { getAuthErrorMessage } from "../utils/authError";
import "../../../styles/microsoftLogin.css";

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState("");
  const [registerAdmin, { isLoading }] = useRegisterAdminMutation();
  const navigate = useNavigate();

  const getRegistrationErrorMessage = (error) => {
    const message = getAuthErrorMessage(error);
    return message === "Authentication failed." ? "Registration failed." : message;
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
      setRegisterError(getRegistrationErrorMessage(err));
    }
  };

  return (
    <div className="ms-login-page">
      <div
        className="ms-login-card ms-login-card--register"
        role="main"
        aria-label="Microsoft registration"
      >
        <div className="ms-login-brand" aria-label="Microsoft">
          <span className="ms-login-brand__mark" aria-hidden="true">
            <span className="ms-login-brand__tile ms-login-brand__tile--red" />
            <span className="ms-login-brand__tile ms-login-brand__tile--green" />
            <span className="ms-login-brand__tile ms-login-brand__tile--blue" />
            <span className="ms-login-brand__tile ms-login-brand__tile--yellow" />
          </span>
          <span className="ms-login-brand__name">Microsoft</span>
        </div>

        <h1 className="ms-login-card__title">Create account</h1>

        <form onSubmit={handleSubmit} className="ms-login-form">
          <label className="ms-login-form__label" htmlFor="register-name">
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            value={form.name}
            placeholder="Full name"
            className="ms-login-input"
            onChange={(event) => {
              setForm({ ...form, name: event.target.value });
              setRegisterError("");
            }}
            autoComplete="name"
            required
          />

          <label className="ms-login-form__label" htmlFor="register-email">
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            value={form.email}
            placeholder="Email address"
            className="ms-login-input"
            onChange={(event) => {
              setForm({ ...form, email: event.target.value });
              setRegisterError("");
            }}
            autoComplete="email"
            required
          />

          <label className="ms-login-form__label" htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={form.password}
            placeholder="Password"
            className="ms-login-input"
            onChange={(event) => {
              setForm({ ...form, password: event.target.value });
              setRegisterError("");
            }}
            autoComplete="new-password"
            required
          />

          <label className="ms-login-form__label" htmlFor="register-confirm-password">
            Confirm password
          </label>
          <input
            id="register-confirm-password"
            type="password"
            value={form.confirmPassword}
            placeholder="Confirm password"
            className="ms-login-input"
            onChange={(event) => {
              setForm({ ...form, confirmPassword: event.target.value });
              setRegisterError("");
            }}
            autoComplete="new-password"
            required
          />

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