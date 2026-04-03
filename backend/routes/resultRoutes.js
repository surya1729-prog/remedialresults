const express = require("express");
const router = express.Router();
const Marks = require("../models/Marks");
const Subject = require("../models/Subject");
const authMiddleware = require("../middleware/authMiddleware");


router.get("/:rollNumber", authMiddleware, async (req, res) => {
  try {

    const { rollNumber } = req.params;

    const marks = await Marks.find({ rollNumber });

    if (!marks.length) {
      return res.status(404).json({ message: "No marks found" });
    }

    const results = [];

    for (let m of marks) {

      const mids = [m.mid1, m.mid2, m.mid3];
      mids.sort((a, b) => b - a);

      const bestTwoMid = mids[0] + mids[1];

      const total = bestTwoMid + m.semMarks;

      let status = "PASS";
      let reason = "";

      if (m.semMarks < 18) {
        status = "FAIL";
        reason = "Semester marks below 18";
      }
      else if (total < 40) {
        status = "FAIL";
        reason = "Total marks below 40";
      }

      // Fetch subject name
      const subject = await Subject.findOne({
        subjectCode: m.subjectCode
      });

      results.push({
        subjectCode: m.subjectCode,
        subjectName: subject ? subject.subjectName : "Unknown",
        mid1: m.mid1,
        mid2: m.mid2,
        mid3: m.mid3,
        bestTwoMid,
        semMarks: m.semMarks,
        total,
        status,
        reason
      });

    }

    res.json({
      rollNumber,
      results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;