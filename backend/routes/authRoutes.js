const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const jwt = require("jsonwebtoken");

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
    const token = jwt.sign(
      { id: student._id, rollNumber: student.rollNumber },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      student: {
        rollNumber: student.rollNumber,
        name: student.name,
        branch: student.branch,
        year: student.year
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;