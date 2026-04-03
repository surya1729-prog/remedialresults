const express = require("express");
const router = express.Router();
const Marks = require("../models/Marks");

router.post("/add", async (req, res) => {

  try {

    const { rollNumber, subjectCode, mid1, mid2, mid3, semMarks } = req.body;

    const marks = new Marks({
      rollNumber,
      subjectCode,
      mid1,
      mid2,
      mid3,
      semMarks
    });

    await marks.save();

    res.status(201).json(marks);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

});

module.exports = router;