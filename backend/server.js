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

const app = express();

connectDB();

app.use(cors());
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

app.get("/", (req, res) => {
  res.send("College Portal API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});