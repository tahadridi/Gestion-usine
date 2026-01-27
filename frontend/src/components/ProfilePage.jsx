import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import { Camera, Mail, User, Eye, EyeOff, X, Check } from "lucide-react";
import '../assets/css/profile.css';
import avatar from '../assets/images/avatar.png';
import Navbar from './navbar';
const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateCredentials, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const [email, setEmail] = useState(authUser?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [memberSince, setMemberSince] = useState("");

  useEffect(() => {
    if (authUser?.createdAt) {
      setMemberSince(new Date(authUser.createdAt).toLocaleDateString());
    }
  }, [authUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setSelectedImg(reader.result);
  };

  const handleSave = async () => {
    setError("");
    setSavedMessage("");
    setPasswordMatchError(false);

    try {
      const profileUpdates = {};
      if (selectedImg) profileUpdates.profilePic = selectedImg;

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(profileUpdates);
        setSavedMessage("Profile updated successfully!");
        setSelectedImg(null);
      }

      if ((email && email !== authUser?.email) || newPassword) {
        if (newPassword && newPassword.length < 8) {
          setError("Password must be at least 8 characters long.");
          return;
        }
        if (newPassword && newPassword !== confirmPassword) {
          setPasswordMatchError(true);
          setError("Passwords do not match.");
          return;
        }

        await updateCredentials({ email, password: newPassword || undefined });
        setNewPassword("");
        setConfirmPassword("");
        setSavedMessage(prev => prev ? prev + " & Credentials updated!" : "Credentials updated!");
      }

      // Clear alert after 3 seconds
      setTimeout(() => setSavedMessage(""), 3000);

    } catch (err) {
      setError("Failed to update profile.");
      console.error(err);
    }
  };

  const passwordIsValid = newPassword.length >= 8;

  if (!authUser) return <p>Loading profile...</p>;

  return (
    <div>
    <Navbar />
    <div className="profile-container">

      {/* Simple Top-Center Alert */}
      {savedMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#18207A",
          color: "white",
          padding: "10px 20px",
          borderRadius: "5px",
          zIndex: 1000,
          fontWeight: "bold"
        }}>
          {savedMessage}
        </div>
      )}

      <div className="profile-wrapper">
        {/* Header */}
        <div className="profile-header text-center">
          <h1>Profile</h1>
          <p>Manage your profile information</p>
        </div>

        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img
              src={selectedImg || authUser?.profilePic || avatar}
              alt="Profile"
              className="avatar-image"
              onError={(e) => (e.currentTarget.src = avatar)}
            />
            <label htmlFor="avatar-upload" className="avatar-upload">
              <Camera className="icon" />
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <p className="avatar-text">Click the camera icon to update your photo</p>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <div className="info-item">
            <div className="info-label">
              <User className="icon-small" /> Full Name
            </div>
            <div className="info-value">{authUser?.fullName}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <Mail className="icon-small" /> Email
            </div>
            <div className="info-value">{authUser?.email}</div>
          </div>
        </div>

        {/* Update Form */}
        <div className="update-section">
          <h2>Change Information</h2>

          <label className="form-label">New Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="form-label">New Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {newPassword.length > 0 && (
              <span className="password-validation-icon">
                {passwordIsValid ? <Check size={18} /> : <X size={18} />}
              </span>
            )}
          </div>

          <label className="form-label">Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            className={`form-input ${passwordMatchError ? "error" : ""}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordMatchError && <X className="password-validation-icon error-icon" size={18} />}

          {error && <p className="error-message">{error}</p>}

          <div className="button-wrapper">
            <button
              onClick={handleSave}
              className="save-btn"
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="account-info-section">
          <h2>Account Information</h2>
          <div className="account-info-row">
            <span>Member Since</span>
            <span>{memberSince || "N/A"}</span>
          </div>
          <div className="account-info-row">
            <span>Account Status</span>
            <span className="status-active">Active</span>
          </div>
        </div>
      </div>
    </div>
    </div>

  );
};

export default ProfilePage;
