const fs = require("fs");

const students = JSON.parse(fs.readFileSync("students.json"));
const subjects = JSON.parse(fs.readFileSync("subjects.json"));

let marks = [];

students.forEach(student => {

  const studentSubjects = subjects.filter(s => s.year === student.year);

  studentSubjects.forEach(sub => {

    const mid1 = Math.floor(Math.random() * 25);
    const mid2 = Math.floor(Math.random() * 25);
    const mid3 = Math.floor(Math.random() * 25);
    const semMarks = Math.floor(Math.random() * 40);

    marks.push({
      rollNumber: student.rollNumber,
      subjectCode: sub.subjectCode,
      mid1,
      mid2,
      mid3,
      semMarks
    });

  });

});

fs.writeFileSync("marks.json", JSON.stringify(marks, null, 2));

console.log("✅ Marks Generated");