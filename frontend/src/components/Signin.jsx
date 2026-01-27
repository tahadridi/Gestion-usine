import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2, Lock, Mail, MessageCircleHeart } from "lucide-react";
import toast from "react-hot-toast";
import "../assets/css/signin.css"; 
import logo from'../assets/images/logo.png'
const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn, authUser } = useAuthStore();

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.email.trim()) return toast.error("Email is required");
  if (!formData.password) return toast.error("Password is required");

  const result = await login(formData);

  if (result?.success) {
    toast.success("Logged in successfully!");
    setFailedAttempts(0);
    setShowForgotPassword(false);
    
    // Redirect based on user role
    if (result.user?.role === 'admin') {
        navigate("/Home");
    } else if (result.user?.role === 'manager' && result.user?.department === 'production') {
        navigate("/stockmanagement");
    } else {
        navigate("/fabrication", { state: { userEmail: result.user?.email } });
    }
} else {
    toast.error((result?.message || "Login failed"));
    const attempts = failedAttempts + 1;
    setFailedAttempts(attempts);
    if (attempts >= 5) setShowForgotPassword(true);
}
};
  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        {/* Logo Header */}
         <div className="admin-signup-logo-container">
                  <div
                    className="admin-signup-logo-icon"
                    style={{
                      width: "150px",
                      height: "50px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      margin: "0 auto 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#ffffff", // optional background
                    }}
                  >
                    <img
                      src={logo}
                      alt="Admin Logo"
                      style={{
                        width: "100%",
                        height: "100%"
                      }}
                    />
                  </div>
                  </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-inputGroup">
            <label className="admin-login-label">Email Address</label>
            <div className="admin-login-inputContainer">
              <div className="admin-login-inputIcon">
                <Mail size={18} />
              </div>
              <input
                type="email"
                className="admin-login-input"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="admin-login-inputGroup">
            <label className="admin-login-label">Password</label>
            <div className="admin-login-inputContainer">
              <div className="admin-login-inputIcon">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="admin-login-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="admin-login-passwordToggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} className="admin-login-toggleIcon" />
                ) : (
                  <Eye size={18} className="admin-login-toggleIcon" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={isLoggingIn ? "admin-login-buttonDisabled" : "admin-login-button"}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 size={18} className="admin-login-spinner" />
                <span>Authenticating...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {showForgotPassword && (
          <div className="admin-login-forgotPassword">
            <Link to="/forgot-password" className="admin-login-forgotLink">
              Forgot your password?
            </Link>
          </div>
        )}

        <div className="admin-login-footer">
          <p className="admin-login-footerText">
            © {new Date().getFullYear()} Autoliv Portal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
