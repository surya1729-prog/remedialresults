const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/Student");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const students = [];

const branches = [
  { name: "CSE", count: 360 },
  { name: "ECE", count: 360 },
  { name: "EEE", count: 100 },
  { name: "CIVIL", count: 100 },
  { name: "MECH", count: 100 },
  { name: "CHEM", count: 50 },
  { name: "MET", count: 30 }
];

const batches = [
  { prefix: "R23", year: 1 },
  { prefix: "R22", year: 2 },
  { prefix: "R21", year: 3 },
  { prefix: "R20", year: 4 }
];

let counter;

batches.forEach(batch => {
  counter = 1;

  branches.forEach(branch => {
    for (let i = 0; i < branch.count; i++) {

      const rollNumber = `${batch.prefix}${String(counter).padStart(4, "0")}`;

      students.push({
        rollNumber,
        name: `Student_${rollNumber}`,
        branch: branch.name,
        year: batch.year,
        password: "12345"
      });

      counter++;
    }
  });
});

const insertData = async () => {
  try {
    await Student.deleteMany(); // clear old
    await Student.insertMany(students);
    console.log("Students Generated:", students.length);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

insertData();