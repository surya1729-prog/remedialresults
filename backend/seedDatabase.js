require("dotenv").config();
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const Student = require("./models/Student");
const Subject = require("./models/Subject");
const Marks = require("./models/Marks");
const ResultPublication = require("./models/ResultPublication");

const readJson = (fileName) => {
  const filePath = path.join(__dirname, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const getUniqueBranches = (students) => {
  const branches = new Set();

  students.forEach((student) => {
    if (student.branch) {
      branches.add(student.branch);
    }
  });

  return Array.from(branches);
};

const buildSubjectsForAllBranches = (subjects, branches) => {
  const records = [];

  subjects.forEach((subject) => {
    branches.forEach((branch) => {
      records.push({
        ...subject,
        branch
      });
    });
  });

  return records;
};

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const students = readJson("students.json");
  const baseSubjects = readJson("subjects.json");
  const marks = readJson("marks.json");

  await Student.deleteMany({});
  await Student.insertMany(students);

  const branches = getUniqueBranches(students);
  const subjects = buildSubjectsForAllBranches(baseSubjects, branches);

  await Subject.deleteMany({});
  await Subject.insertMany(subjects);

  await Marks.deleteMany({});
  await Marks.insertMany(marks);

  await ResultPublication.findOneAndUpdate(
    { key: "global" },
    {
      key: "global",
      isPublished: true,
      publishedBy: "seed-script",
      publishedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Seed complete");
  console.log(`Students: ${students.length}`);
  console.log(`Subjects: ${subjects.length}`);
  console.log(`Marks: ${marks.length}`);

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore disconnect errors
  }
  process.exit(1);
});
