import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";
import { logActivity } from '../lib/activityLogger.js';
const router = express.Router();

/**
 * @desc Get all users
 * @route GET /api/employees
 */
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


router.get("/get-email/:cin", async (req, res) => {
  try {
    const user = await User.findOne({ cin: req.params.cin });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ email: user.email });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * @desc Create a new user
 * @route POST /api/employees
 */
router.post("/", async (req, res) => {
  try {
    const { cin, fullName, email, password, role, department, shift, hasSystemAccount, phone, address } = req.body;

    // Validate CIN (8 digits)
    if (!cin || !/^\d{8}$/.test(cin)) {
      return res.status(400).json({ error: "CIN must be exactly 8 digits" });
    }

    // Check if CIN already exists
    const existingCin = await User.findOne({ cin });
    if (existingCin) {
      return res.status(400).json({ error: "CIN already exists" });
    }

    // Validate required fields
    if (!fullName) {
      return res.status(400).json({ error: "Full name is required" });
    }

    // If system account: check email uniqueness + hash password
    let hashedPassword = undefined;
    if (hasSystemAccount) {
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required for system accounts" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    

    const newUser = new User({
      cin,
      fullName,
      email: hasSystemAccount ? email : undefined,
      password: hasSystemAccount ? hashedPassword : undefined,
      role,
      department,
      shift,
      hasSystemAccount,
      phone,
      address,
    });

    await newUser.save();
    res.status(201).json(newUser);
    await logActivity(req.user?.email || 'Admin', 'create', 'employee', {
  cin: newUser.cin, 
  name: newUser.fullName,
  role: newUser.role
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

/**
 * @desc Update user
 * @route PUT /api/employees/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { role, department, shift } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role, department, shift },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/**
 * @desc Delete user
 * @route DELETE /api/employees/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/**
 * @desc Create system account for an existing user
 * @route POST /api/employees/system-account
 */
router.post("/system-account", async (req, res) => {
  try {
    const { cin, email, password } = req.body;
    const user = await User.findOne({ cin });

    if (!user) return res.status(404).json({ error: "User not found" });

    // if no email in DB, assign it
    if (!user.email && email) {
      user.email = email;
    }

    user.password = await bcrypt.hash(password, 10);
    user.hasSystemAccount = true;

    await user.save();
    res.json({ message: "System account created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @desc Delete system account
 * @route DELETE /api/employees/system-account/:cin
 */
router.delete("/system-account/:cin", async (req, res) => {
  try {
    const { cin } = req.params;
    
    const user = await User.findOne({ cin });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.hasSystemAccount) {
      return res.status(400).json({ error: "User does not have a system account" });
    }

    // Remove system account details but keep the user
    user.email = undefined;
    user.password = undefined;
    user.hasSystemAccount = false;

    await user.save();

    res.json({ message: "System account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete system account" });
  }
});

export default router;