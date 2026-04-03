const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:rollNumber", authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({
      rollNumber: req.params.rollNumber
    });

    res.json(student);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;