require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const studentRoutes = require("./routes/studentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const marksRoutes = require("./routes/marksRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const resultRoutes = require("./routes/resultRoutes");
const profileRoutes = require("./routes/profileRoutes");
const resultSummaryRoutes = require("./routes/resultSummaryRoutes");
const subjectListRoutes = require("./routes/subjectListRoutes");
const resultControlRoutes = require("./routes/resultControlRoutes");
const facultyAdminRoutes = require("./routes/facultyAdminRoutes");

const app = express();

connectDB();

// CORS configuration for development and production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL || ""
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== "production") {
      // In development, allow all origins
      callback(null, true);
    } else {
      // In production, only allow whitelisted origins
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/api/students", studentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/result-summary", resultSummaryRoutes);
app.use("/api/subjectlist", subjectListRoutes);
app.use("/api/result-control", resultControlRoutes);
app.use("/api/faculty-admin", facultyAdminRoutes);

app.get("/", (req, res) => {
  res.send("College Portal API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});