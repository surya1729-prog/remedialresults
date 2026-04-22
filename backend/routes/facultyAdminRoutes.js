const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Marks = require("../models/Marks");
const ResultPublication = require("../models/ResultPublication");

const staffOnly = [authMiddleware, requireRoles("faculty", "admin")];

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const validateMarksRange = ({ mid1, mid2, mid3, semMarks }) => {
  const checks = [
    { label: "mid1", value: mid1, min: 0, max: 20 },
    { label: "mid2", value: mid2, min: 0, max: 20 },
    { label: "mid3", value: mid3, min: 0, max: 20 },
    { label: "semMarks", value: semMarks, min: 0, max: 60 }
  ];

  for (const item of checks) {
    if (!Number.isFinite(item.value) || item.value < item.min || item.value > item.max) {
      return `${item.label} must be between ${item.min} and ${item.max}`;
    }
  }

  return "";
};

router.get("/branches", ...staffOnly, async (req, res) => {
  try {
    const branches = await Student.distinct("branch");
    branches.sort();
    res.json({ branches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/students", ...staffOnly, async (req, res) => {
  try {
    const filter = {};

    if (req.query.year) {
      filter.year = Number(req.query.year);
    }

    if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    const students = await Student.find(filter)
      .select("rollNumber name branch year")
      .sort({ rollNumber: 1 })
      .lean();

    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/subjects", ...staffOnly, async (req, res) => {
  try {
    const filter = {};

    if (req.query.year) {
      filter.year = Number(req.query.year);
    }

    if (req.query.semester) {
      filter.semester = Number(req.query.semester);
    }

    if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    const subjects = await Subject.find(filter)
      .select("subjectCode subjectName year semester branch")
      .sort({ subjectCode: 1 })
      .lean();

    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/marks", ...staffOnly, async (req, res) => {
  try {
    const studentFilter = {};
    const subjectFilter = {};

    if (req.query.year) {
      studentFilter.year = Number(req.query.year);
      subjectFilter.year = Number(req.query.year);
    }

    if (req.query.branch) {
      studentFilter.branch = req.query.branch;
      subjectFilter.branch = req.query.branch;
    }

    if (req.query.semester) {
      subjectFilter.semester = Number(req.query.semester);
    }

    if (req.query.subjectCode) {
      subjectFilter.subjectCode = req.query.subjectCode;
    }

    const [students, subjects] = await Promise.all([
      Student.find(studentFilter).select("rollNumber").lean(),
      Subject.find(subjectFilter).select("subjectCode").lean()
    ]);

    const rollNumbers = students.map((s) => s.rollNumber);
    const subjectCodes = subjects.map((s) => s.subjectCode);

    if (!rollNumbers.length || !subjectCodes.length) {
      return res.json({ marks: [] });
    }

    const marks = await Marks.find({
      rollNumber: { $in: rollNumbers },
      subjectCode: { $in: subjectCodes }
    }).lean();

    res.json({ marks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/marks/upsert", ...staffOnly, async (req, res) => {
  try {
    const {
      rollNumber,
      subjectCode,
      mid1,
      mid2,
      mid3,
      semMarks,
      assignmentMarks,
      attendanceMarks,
      continuousEvaluationMarks
    } = req.body;

    if (!rollNumber || !subjectCode) {
      return res.status(400).json({ message: "rollNumber and subjectCode are required" });
    }

    const parsedMid1 = parseNumber(mid1);
    const parsedMid2 = parseNumber(mid2);
    const parsedMid3 = parseNumber(mid3);
    const parsedSemMarks = parseNumber(semMarks);

    const validationError = validateMarksRange({
      mid1: parsedMid1,
      mid2: parsedMid2,
      mid3: parsedMid3,
      semMarks: parsedSemMarks
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updateDoc = {
      rollNumber,
      subjectCode,
      mid1: parsedMid1,
      mid2: parsedMid2,
      mid3: parsedMid3,
      semMarks: parsedSemMarks,
      assignmentMarks:
        assignmentMarks === undefined || assignmentMarks === ""
          ? null
          : parseNumber(assignmentMarks),
      attendanceMarks:
        attendanceMarks === undefined || attendanceMarks === ""
          ? null
          : parseNumber(attendanceMarks),
      continuousEvaluationMarks:
        continuousEvaluationMarks === undefined || continuousEvaluationMarks === ""
          ? null
          : parseNumber(continuousEvaluationMarks)
    };

    const mark = await Marks.findOneAndUpdate(
      { rollNumber, subjectCode },
      { $set: updateDoc },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();

    res.json({ message: "Marks saved", mark });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/marks-sheet", ...staffOnly, async (req, res) => {
  try {
    const year = Number(req.query.year);
    const semester = Number(req.query.semester);
    const branch = req.query.branch;

    if (!year || !semester || !branch) {
      return res.status(400).json({
        message: "year, semester and branch are required"
      });
    }

    const [students, subjects] = await Promise.all([
      Student.find({ year, branch })
        .select("rollNumber name branch year")
        .sort({ rollNumber: 1 })
        .lean(),
      Subject.find({ year, semester, branch })
        .select("subjectCode subjectName")
        .sort({ subjectCode: 1 })
        .lean()
    ]);

    if (!students.length || !subjects.length) {
      return res.json({ rows: [] });
    }

    const rollNumbers = students.map((s) => s.rollNumber);
    const subjectCodes = subjects.map((s) => s.subjectCode);

    const marks = await Marks.find({
      rollNumber: { $in: rollNumbers },
      subjectCode: { $in: subjectCodes }
    }).lean();

    const studentMap = new Map(students.map((s) => [s.rollNumber, s]));
    const subjectMap = new Map(subjects.map((s) => [s.subjectCode, s]));

    const rows = marks.map((m) => ({
      rollNumber: m.rollNumber,
      studentName: studentMap.get(m.rollNumber)?.name || "Unknown",
      year,
      semester,
      branch,
      subjectCode: m.subjectCode,
      subjectName: subjectMap.get(m.subjectCode)?.subjectName || "Unknown",
      mid1: m.mid1,
      mid2: m.mid2,
      mid3: m.mid3,
      assignmentMarks: m.assignmentMarks,
      attendanceMarks: m.attendanceMarks,
      continuousEvaluationMarks: m.continuousEvaluationMarks,
      semMarks: m.semMarks
    }));

    res.json({ rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/overview", authMiddleware, requireRoles("admin"), async (req, res) => {
  try {
    const [studentCount, subjectCount, marksCount, publication] = await Promise.all([
      Student.countDocuments(),
      Subject.countDocuments(),
      Marks.countDocuments(),
      ResultPublication.findOne({ key: "global" }).lean()
    ]);

    res.json({
      studentCount,
      subjectCount,
      marksCount,
      isPublished: publication ? publication.isPublished : true,
      publishedBy: publication?.publishedBy || "system-default",
      publishedAt: publication?.publishedAt || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get(
  "/reports/remedial-summary",
  authMiddleware,
  requireRoles("admin"),
  async (req, res) => {
    try {
      const studentFilter = {};
      const subjectFilter = {};

      if (req.query.year) {
        studentFilter.year = Number(req.query.year);
        subjectFilter.year = Number(req.query.year);
      }

      if (req.query.semester) {
        subjectFilter.semester = Number(req.query.semester);
      }

      const [students, subjects] = await Promise.all([
        Student.find(studentFilter).select("rollNumber branch").lean(),
        Subject.find(subjectFilter).select("subjectCode").lean()
      ]);

      const studentMap = new Map(students.map((s) => [s.rollNumber, s.branch]));
      const branches = Array.from(new Set(students.map((s) => s.branch))).sort();
      const studentCounts = branches.reduce((acc, b) => {
        acc[b] = students.filter((s) => s.branch === b).length;
        return acc;
      }, {});

      if (!students.length) {
        return res.json({ rows: [] });
      }

      const marksFilter = {
        rollNumber: { $in: students.map((s) => s.rollNumber) }
      };

      if (subjects.length) {
        marksFilter.subjectCode = { $in: subjects.map((s) => s.subjectCode) };
      }

      const marks = await Marks.find(marksFilter).lean();

      const summary = branches.reduce((acc, b) => {
        acc[b] = {
          branch: b,
          totalStudents: studentCounts[b] || 0,
          subjectsEvaluated: 0,
          passedEntries: 0,
          remedialEntries: 0
        };
        return acc;
      }, {});

      marks.forEach((m) => {
        const branch = studentMap.get(m.rollNumber);
        if (!branch || !summary[branch]) {
          return;
        }

        const mids = [m.mid1, m.mid2, m.mid3].sort((a, b) => b - a);
        const bestTwoMid = mids[0] + mids[1];

        const internalTotal = bestTwoMid;

        const externalTotal = Number(m.semMarks) || 0;
        const total = internalTotal + externalTotal;

        const isRemedial = total < 40;

        summary[branch].subjectsEvaluated += 1;
        if (isRemedial) {
          summary[branch].remedialEntries += 1;
        } else {
          summary[branch].passedEntries += 1;
        }
      });

      const rows = Object.values(summary).map((row) => ({
        ...row,
        remedialRate:
          row.subjectsEvaluated > 0
            ? Number(((row.remedialEntries / row.subjectsEvaluated) * 100).toFixed(2))
            : 0
      }));

      res.json({ rows });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
