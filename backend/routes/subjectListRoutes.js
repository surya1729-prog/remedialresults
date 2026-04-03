const express = require("express");
const router = express.Router();
const Subject = require("../models/Subject");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:branch/:year/:semester", authMiddleware, async (req, res) => {
  try {

    const { branch, year, semester } = req.params;

    const subjects = await Subject.find({
      branch: branch,
      year: Number(year),
      semester: Number(semester)
    });

    if (!subjects.length) {
      return res.status(404).json({ message: "No subjects found" });
    }

    res.json(subjects);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;