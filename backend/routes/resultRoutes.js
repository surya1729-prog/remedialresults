const express = require("express");
const router = express.Router();
const Marks = require("../models/Marks");
const Subject = require("../models/Subject");
const authMiddleware = require("../middleware/authMiddleware");
const ResultPublication = require("../models/ResultPublication");

const RESULT_RULES = {
  maxMid: 20,
  maxBestTwoInternal: 40,
  maxExternal: 60,
  passMinimumTotal: 40
};

const numberOrNull = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const isResultsPublished = async () => {
  const publication = await ResultPublication.findOne({ key: "global" }).lean();
  if (!publication) {
    return true;
  }

  return publication.isPublished;
};

const buildTransparentResult = async (rollNumber) => {
  const marks = await Marks.find({ rollNumber }).lean();

  if (!marks.length) {
    return null;
  }

  const subjectCodes = marks.map((m) => m.subjectCode);
  const subjects = await Subject.find({ subjectCode: { $in: subjectCodes } }).lean();

  const subjectMap = new Map(subjects.map((s) => [s.subjectCode, s]));

  const results = marks.map((m) => {
    const mids = [m.mid1, m.mid2, m.mid3].sort((a, b) => b - a);
    const bestTwoMid = mids[0] + mids[1];

    const assignmentMarks = numberOrNull(m.assignmentMarks);
    const attendanceMarks = numberOrNull(m.attendanceMarks);
    const continuousEvaluationMarks = numberOrNull(m.continuousEvaluationMarks);

    const internalTotal = bestTwoMid;
    const externalTotal = m.semMarks;
    const total = internalTotal + externalTotal;

    const reasons = [];

    if (total < RESULT_RULES.passMinimumTotal) {
      reasons.push(
        `Total marks below ${RESULT_RULES.passMinimumTotal} (${total})`
      );
    }

    const status = reasons.length ? "REMEDIAL" : "PASS";

    const subject = subjectMap.get(m.subjectCode);
    const subjectYear = subject?.year ?? null;
    const subjectSemester = subject?.semester ?? null;

    return {
      subjectCode: m.subjectCode,
      subjectName: subject?.subjectName || "Unknown",
      semesterInfo: {
        year: subjectYear,
        semester: subjectSemester,
        label:
          subjectYear && subjectSemester
            ? `B.Tech ${subjectYear} Year - Sem ${subjectSemester}`
            : "Semester info unavailable"
      },
      internal: {
        mid1: m.mid1,
        mid2: m.mid2,
        mid3: m.mid3,
        bestTwoMid,
        assignmentMarks,
        attendanceMarks,
        continuousEvaluationMarks,
        total: internalTotal,
        source: "best-two-mid"
      },
      external: {
        semMarks: externalTotal
      },
      total,
      status,
      remedialReasons: reasons,
      reason: reasons.join("; ")
    };
  });

  const summary = results.reduce(
    (acc, item) => {
      if (item.status === "PASS") {
        acc.passCount += 1;
      } else {
        acc.remedialCount += 1;
      }

      acc.totalMarks += item.total;
      return acc;
    },
    { passCount: 0, remedialCount: 0, totalMarks: 0 }
  );

  const grandTotal = summary.totalMarks;
  const subjectCount = results.length;

  const remedialBySemester = results
    .filter((item) => item.status === "REMEDIAL")
    .reduce((acc, item) => {
      const year = item.semesterInfo?.year;
      const semester = item.semesterInfo?.semester;
      const key = `${year || "NA"}-${semester || "NA"}`;

      if (!acc[key]) {
        acc[key] = {
          year,
          semester,
          label:
            year && semester
              ? `B.Tech ${year} Year - Sem ${semester}`
              : "Semester info unavailable",
          remedialCount: 0,
          subjects: []
        };
      }

      acc[key].remedialCount += 1;
      acc[key].subjects.push({
        subjectCode: item.subjectCode,
        subjectName: item.subjectName,
        reasons: item.remedialReasons
      });

      return acc;
    }, {});

  const remedialTimeline = Object.values(remedialBySemester).sort((a, b) => {
    const yearA = a.year || 999;
    const yearB = b.year || 999;

    if (yearA !== yearB) {
      return yearA - yearB;
    }

    const semA = a.semester || 999;
    const semB = b.semester || 999;
    return semA - semB;
  });

  const latestResult = results
    .filter((item) => item.semesterInfo?.year && item.semesterInfo?.semester)
    .sort((a, b) => {
      const yearDiff = a.semesterInfo.year - b.semesterInfo.year;
      if (yearDiff !== 0) {
        return yearDiff;
      }

      return a.semesterInfo.semester - b.semesterInfo.semester;
    })
    .at(-1);

  const latestResultYear = latestResult?.semesterInfo?.year ?? null;
  const latestResultSemester = latestResult?.semesterInfo?.semester ?? null;
  const latestResultLabel =
    latestResultYear && latestResultSemester
      ? `B.Tech ${latestResultYear} Year - Sem ${latestResultSemester}`
      : "Semester info unavailable";

  return {
    rollNumber,
    rules: RESULT_RULES,
    summary: {
      subjectCount,
      passCount: summary.passCount,
      remedialCount: summary.remedialCount,
      grandTotal,
      average: Number((grandTotal / subjectCount).toFixed(2)),
      remedialTimeline,
      latestResultYear,
      latestResultSemester,
      latestResultLabel,
      isPassedOut: latestResultYear === 4 && latestResultSemester === 2
    },
    results
  };
};

router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({
        message: "Only student accounts can access /me"
      });
    }

    const published = await isResultsPublished();

    if (!published) {
      return res.status(403).json({
        message: "Results are not published yet"
      });
    }

    const response = await buildTransparentResult(req.student.rollNumber);

    if (!response) {
      return res.status(404).json({ message: "No marks found" });
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:rollNumber", authMiddleware, async (req, res) => {
  try {
    const { rollNumber } = req.params;

    const role = req.user?.role || "student";
    const isStudentOwner = role === "student" && req.student.rollNumber === rollNumber;
    const isStaff = role === "faculty" || role === "admin";

    if (!isStudentOwner && !isStaff) {
      return res.status(403).json({
        message: "Forbidden: access denied"
      });
    }

    if (role === "student") {
      const published = await isResultsPublished();

      if (!published) {
        return res.status(403).json({
          message: "Results are not published yet"
        });
      }
    }

    const response = await buildTransparentResult(rollNumber);

    if (!response) {
      return res.status(404).json({ message: "No marks found" });
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;