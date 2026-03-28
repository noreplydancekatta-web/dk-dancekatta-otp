// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

console.log("🔍 OTP backend starting...");

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ------------------ MongoDB ------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ------------------ Routes ------------------
const userOtpRoutes = require("./user_otps");
app.use("/api/user", userOtpRoutes);
const signupRoutes = require('./signup_otps');
app.use('/api/signup', signupRoutes);

// ------------------ Health Check ------------------
app.get("/", (req, res) => {
  res.send("OTP Service is Running 🔑");
});

// ------------------ 404 ------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ------------------ Start ------------------
app.listen(PORT, () => {
  console.log(`🚀 OTP Backend running on http://localhost:${PORT}`);
});

// ✅ Crash Safety
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
