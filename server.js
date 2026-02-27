const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

console.log("🔍 Render OTP backend starting... DB connection string loaded.");



const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ------------------ MongoDB Setup ------------------
mongoose
  .connect(process.env.MONGO_URI, {
  })
  .then(() => console.log("✅ MongoDB connected (Render)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ------------------ OTP Routes ------------------
const userOtpRoutes = require("./user_otps");
app.use("/api/user", userOtpRoutes); // only OTP auth logic

// ------------------ Health Check ------------------
app.get("/", (req, res) => {
  res.send("OTP Service is Running 🔑");
});

// ------------------ Catch-all 404 ------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found in OTP backend" });
});

// ------------------ Start Server ------------------
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
