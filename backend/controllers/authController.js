// authController.js (with logActivity)
import { generateToken } from "../lib/utils.js";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";
import { logActivity } from "../lib/activityLogger.js";   // ✅ Import

// -------------------- SIGNUP --------------------
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ fullName, email, password: hashedPassword });

    const token = generateToken(newUser._id, res);
    await newUser.save();

    // ✅ Log signup
    await logActivity(newUser.email, "signup", "system", { name: newUser.fullName });

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
      role: newUser.role,
      token
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// -------------------- LOGIN --------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      hasSystemAccount: true,
      isActive: true
    });

    if (!user || !user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, res);

    const userResponse = {
      _id: user._id,
      cin: user.cin,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      shift: user.shift,
      profilePic: user.profilePic,
      phone: user.phone,
      address: user.address,
      hasSystemAccount: user.hasSystemAccount,
      isActive: user.isActive,
      token
    };

    // ✅ Log login
    await logActivity(user.email, "login", "system", {});

    res.json(userResponse);
  } catch (error) {
    console.error("Login error details:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// -------------------- LOGOUT --------------------
export const logout = async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    res.cookie("jwt", "", { maxAge: 0 });

    // ✅ Log logout
    await logActivity(userEmail, "logout", "system", {});

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// -------------------- UPDATE PROFILE --------------------
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    // ✅ Log profile update
    await logActivity(updatedUser.email, "update", "profile", {});

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

// -------------------- RESET PASSWORD --------------------
export const resetPassword = async (req, res) => {
  const { email, firstName, newPassword } = req.body;

  try {
    if (!email || !firstName || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "No account found with this email" });

    if (user.fullName.toLowerCase() !== firstName.toLowerCase()) {
      return res.status(400).json({ message: "First name doesn't match our records" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // ✅ Log reset password
    await logActivity(user.email, "update", "password", {});

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- UPDATE USER CREDENTIALS --------------------
export const updateUserCredentials = async (req, res) => {
  const { email, password } = req.body;
  const userId = req.user._id;

  try {
    const updates = {};
    if (email) updates.email = email;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });

    // ✅ Log credentials update
    await logActivity(updatedUser.email, "update", "credentials", {});

    res.status(200).json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
    });
  } catch (error) {
    console.log("Error in updateUserCredentials:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
  
};
// -------------------- CHECK AUTH --------------------
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in checkAuth:", error);
    res.status(500).json({ message: "Server error" });
  }
};

