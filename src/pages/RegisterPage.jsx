import React, { useState } from "react";
import { useRegisterAdminMutation } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import AuthSplitLayout from "../components/auth/AuthSplitLayout";

const RegisterPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [registerAdmin, { isLoading }] = useRegisterAdminMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerAdmin(form).unwrap();
      navigate("/login", {
        state: { status: "Your account has been created successfully." },
      });
    } catch (err) {
      alert(err?.data?.message || "Registration failed");
    }
  };

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle={
        <>
          Already have an account?{" "}
          <button type="button" onClick={() => navigate("/login")}>
            Sign In
          </button>
        </>
      }
      heroBody="Provision access for operations teams working on document checklists, lending conditions, review loops, and deferral decisions."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-field__label">Full Name</label>
          <div className="auth-input-wrap">
            <FiUser className="auth-input__icon" />
            <input
              type="text"
              value={form.name}
              placeholder="Jane Doe"
              className="auth-input"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field__label">Email Address</label>
          <div className="auth-input-wrap">
            <FiMail className="auth-input__icon" />
            <input
              type="email"
              value={form.email}
              placeholder="name@bank.com"
              className="auth-input"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              placeholder="Create a strong password"
              className="auth-input auth-input--with-action"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <span className="auth-inline-note">
            Use at least 8 characters with uppercase letters and numbers.
          </span>
        </div>

        <label className="auth-check">
          <input type="checkbox" required />
          <span>
            I agree to the Terms &amp; Conditions and Privacy Policy.
          </span>
        </label>

        <button type="submit" disabled={isLoading} className="auth-button">
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthSplitLayout>
  );
};

export default RegisterPage;
