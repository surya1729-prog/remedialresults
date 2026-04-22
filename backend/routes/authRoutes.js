const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const jwt = require("jsonwebtoken");

const createToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

const staffCredentials = {
  faculty: {
    username: process.env.FACULTY_USERNAME || "faculty",
    password: process.env.FACULTY_PASSWORD || "faculty123"
  },
  admin: {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123"
  }
};

// Student Login
router.post("/login", async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    // Check if student exists
    const student = await Student.findOne({ rollNumber });

    if (!student) {
      return res.status(400).json({ message: "Student not found" });
    }

    // Check password (plain comparison for now)
    const isMatch = password === student.password;

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate token
    const token = createToken({
      id: student._id,
      rollNumber: student.rollNumber,
      role: "student"
    });

    res.json({
      message: "Login successful",
      token,
      student: {
        rollNumber: student.rollNumber,
        name: student.name,
        branch: student.branch,
        year: student.year,
        role: "student"
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/staff-login", async (req, res) => {
  try {
    const { role, username, password } = req.body;

    if (!role || !["faculty", "admin"].includes(role)) {
      return res.status(400).json({ message: "Valid role is required" });
    }

    const configured = staffCredentials[role];
    const isMatch =
      username === configured.username && password === configured.password;

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid staff credentials" });
    }

    const token = createToken({
      username,
      role
    });

    res.json({
      message: "Staff login successful",
      token,
      user: {
        username,
        role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;