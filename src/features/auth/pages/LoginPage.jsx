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

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [persistedStatusMessage] = useState(() => consumeAuthStatusMessage());
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const statusMessage = location.state?.status || persistedStatusMessage || "";

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
      // Robustly extract the server message, handling both objects and plain strings
      const serverMessage = (err?.data && typeof err.data === 'object' ? err.data.message : err?.data) || err?.message;
      setLoginError(serverMessage || errMsg);
      toast.error(serverMessage || errMsg);
    }
  };

  // Colors
  const ncbBlue = "#3ab3e5";
  const ncbBlueDark = "#2a8cb5";
  const headingColor = "#1C1018";
  const brownText = "#332100";

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(58,179,229,0.03)_0%,transparent_70%)]" />
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 md:p-10 relative z-10 transition-transform duration-200 hover:-translate-y-0.5">
        {/* NCBA Logo */}
        <div className="text-center mb-6">
          <div className="inline-block">
            <svg className="w-full max-w-[200px] h-auto mx-auto" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Bank Building Icon */}
              <rect x="8" y="25" width="40" height="30" rx="3" fill={ncbBlue} />
              <rect x="14" y="19" width="8" height="12" fill={ncbBlue} />
              <rect x="26" y="19" width="8" height="12" fill={ncbBlue} />
              <rect x="38" y="19" width="8" height="12" fill={ncbBlue} />
              <polygon points="8,25 28,14 48,25" fill={brownText} />

              {/* NCBA Text */}
              <text x="60" y="30" fontFamily="Century Gothic" fontSize="24" fontWeight="bold" fill={ncbBlue}>NCBA BANK</text>

              {/* DCL & Deferral Tagline */}
              <text x="60" y="52" fontFamily="Century Gothic" fontSize="16" fontWeight="600" fill={brownText} letterSpacing="1">DCL & DEFERRAL</text>
            </svg>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-center tracking-tight" style={{ color: headingColor }}>
          Welcome Back
        </h1>
        <p className="text-lg text-gray-500 text-center mb-8">
          Sign in to access the DCL & Deferral Management System
        </p>

        {statusMessage && (
          <div className="mb-4 p-3 rounded-xl bg-blue-50 text-blue-700 text-sm border border-blue-200">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3ab3e5] focus:ring-4 focus:ring-[#3ab3e5]/10 transition-all duration-200 font-normal placeholder:text-gray-400"
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                setLoginError("");
              }}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={form.password}
              placeholder="Enter your password"
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3ab3e5] focus:ring-4 focus:ring-[#3ab3e5]/10 transition-all duration-200 font-normal placeholder:text-gray-400"
              onChange={(event) => {
                setForm({ ...form, password: event.target.value });
                setLoginError("");
              }}
              autoComplete="current-password"
              required
            />
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoginLoading}
            className="w-full py-3 px-6 text-white! font-semibold text-base rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-2 flex items-center justify-center gap-2"
            style={{ backgroundColor: ncbBlue }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = ncbBlueDark}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ncbBlue}
          >
            {isLoginLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Secure access to NCBA's Document Checklist & Deferral Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;