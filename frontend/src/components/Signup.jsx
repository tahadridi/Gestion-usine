import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageCircleHeart, User } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "../assets/css/signup.css"; 
import logo from'../assets/images/logo.png'

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 8) return toast.error("Password must be at least 8 characters");

    return true;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const isValid = validateForm();
  if (isValid !== true) return;

  const result = await signup(formData);

  if (result.success) {
    toast.success(" Account created successfully!");
    setFormData({ fullName: "", email: "", password: "" }); // reset form
  } else {
    toast.error( result.message);
  }
};


  return (
    <div className="admin-signup-container">
      <div className="admin-signup-card">
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
          <h1 className="admin-signup-title">Create Admin Account</h1>
          <p className="admin-signup-subtitle">Get started with the Admin Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-signup-form">
          <div className="admin-signup-inputGroup">
            <label className="admin-signup-label">Full Name</label>
            <div className="admin-signup-inputContainer">
              <div className="admin-signup-inputIcon">
                <User size={18} />
              </div>
              <input
                type="text"
                className="admin-signup-input"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="admin-signup-inputGroup">
            <label className="admin-signup-label">Email Address</label>
            <div className="admin-signup-inputContainer">
              <div className="admin-signup-inputIcon">
                <Mail size={18} />
              </div>
              <input
                type="email"
                className="admin-signup-input"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="admin-signup-inputGroup">
            <label className="admin-signup-label">Password</label>
            <div className="admin-signup-inputContainer">
              <div className="admin-signup-inputIcon">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                className="admin-signup-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="admin-signup-passwordToggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} className="admin-signup-toggleIcon" />
                ) : (
                  <Eye size={18} className="admin-signup-toggleIcon" />
                )}
              </button>
            </div>
            <p className="admin-signup-passwordHint">Must be at least 8 characters</p>
          </div>

          <button
            type="submit"
            className={isSigningUp ? "admin-signup-buttonDisabled" : "admin-signup-button"}
            disabled={isSigningUp}
          >
            {isSigningUp ? (
              <>
                <Loader2 size={18} className="admin-signup-spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="admin-signup-footer">
          <p className="admin-signup-footerText">
            Already have an account?{" "}
            <Link to="/admin" className="admin-signup-footerLink">
              Sign in
            </Link>
          </p>
          <p className="admin-signup-copyright">
            © {new Date().getFullYear()} Admin Portal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
