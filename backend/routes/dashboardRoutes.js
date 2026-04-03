const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Marks = require("../models/Marks");
const Subject = require("../models/Subject");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:rollNumber", authMiddleware, async (req, res) => {
  try {
    const { rollNumber } = req.params;

    const student = await Student.findOne({ rollNumber });
    const marks = await Marks.find({ rollNumber });

    const subjects = await Subject.find({
      branch: student.branch,
      year: student.year
    });

    res.json({
      student,
      subjects,
      marks
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;