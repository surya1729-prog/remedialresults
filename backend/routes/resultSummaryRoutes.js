const express = require("express");
const router = express.Router();
const Marks = require("../models/Marks");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:rollNumber", authMiddleware, async (req, res) => {
  try {

    const marks = await Marks.find({ rollNumber: req.params.rollNumber });

    if (!marks.length) {
      return res.status(404).json({ message: "No marks found" });
    }

    let totalSubjects = marks.length;
    let passed = 0;
    let failed = 0;

    marks.forEach(m => {

      const mids = [m.mid1, m.mid2, m.mid3].sort((a,b)=>b-a);
      const bestTwo = mids[0] + mids[1];

      const total = bestTwo + m.semMarks;

      if (m.semMarks >= 18 && total >= 40) {
        passed++;
      } else {
        failed++;
      }

    });

    res.json({
      rollNumber: req.params.rollNumber,
      totalSubjects,
      passed,
      failed
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;