const express = require("express");
const router = express.Router();
const Marks = require("../models/Marks");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");

router.post("/add", async (req, res) => {

  try {

    const {
      rollNumber,
      subjectCode,
      mid1,
      mid2,
      mid3,
      assignmentMarks,
      attendanceMarks,
      continuousEvaluationMarks,
      semMarks
    } = req.body;

    const marks = new Marks({
      rollNumber,
      subjectCode,
      mid1,
      mid2,
      mid3,
      assignmentMarks,
      attendanceMarks,
      continuousEvaluationMarks,
      semMarks
    });

    await marks.save();

    res.status(201).json(marks);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

});

router.patch(
  "/bulk/internal",
  authMiddleware,
  requireRoles("faculty", "admin"),
  async (req, res) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          message: "updates must be a non-empty array"
        });
      }

      const operations = [];

      for (const item of updates) {
        const {
          rollNumber,
          subjectCode,
          assignmentMarks,
          attendanceMarks,
          continuousEvaluationMarks
        } = item;

        if (!rollNumber || !subjectCode) {
          continue;
        }

        const updateDoc = {};

        if (assignmentMarks !== undefined) {
          updateDoc.assignmentMarks = assignmentMarks;
        }

        if (attendanceMarks !== undefined) {
          updateDoc.attendanceMarks = attendanceMarks;
        }

        if (continuousEvaluationMarks !== undefined) {
          updateDoc.continuousEvaluationMarks = continuousEvaluationMarks;
        }

        if (Object.keys(updateDoc).length === 0) {
          continue;
        }

        operations.push({
          updateOne: {
            filter: { rollNumber, subjectCode },
            update: { $set: updateDoc },
            upsert: false
          }
        });
      }

      if (!operations.length) {
        return res.status(400).json({
          message: "No valid updates found"
        });
      }

      const result = await Marks.bulkWrite(operations);

      res.json({
        message: "Bulk internal marks update completed",
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;