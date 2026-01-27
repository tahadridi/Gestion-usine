import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    cin: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function(v) {
          return /^\d{8}$/.test(v);
        },
        message: props => `${props.value} is not a valid CIN! Must be exactly 8 digits.`
      }
    },
    fullName: { 
      type: String, 
      required: true,
      trim: true
    },
    email: { 
      type: String, 
      required: function () {
        return this.hasSystemAccount === true;
      },
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email!`
      }
    },
    password: {
      type: String,
      required: function () {
        return this.hasSystemAccount === true;
      },
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["operator", "technician", "supervisor", "manager", "admin"],
      default: "operator",
    },
    department: {
      type: String,
      enum: ["production", "quality", "maintenance", "shipping", "office"],
      default: "production",
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night", "flex"],
      default: "morning",
    },
    hasSystemAccount: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    hireDate: { type: Date, default: Date.now },
    phone: { 
      type: String, 
      default: "",
      validate: {
        validator: function(v) {
          return !v || /^[0-9+\-\s()]+$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    address: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;