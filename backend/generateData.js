const fs = require("fs");

const branches = [
  { name: "CSE", count: 360 },
  { name: "ECE", count: 360 },
  { name: "CIVIL", count: 100 },
  { name: "EEE", count: 100 },
  { name: "MECH", count: 100 },
  { name: "CHEM", count: 50 },
  { name: "META", count: 30 }
];

const batches = [
  { prefix: "R230", year: 1 },
  { prefix: "R220", year: 2 },
  { prefix: "R210", year: 3 },
  { prefix: "R200", year: 4 }
];

let students = [];

batches.forEach(batch => {
  let roll = 1;

  branches.forEach(branch => {
    for (let i = 0; i < branch.count; i++) {
      const rollNumber = batch.prefix + String(roll).padStart(3, "0");

      students.push({
        rollNumber,
        name: `Student_${rollNumber}`,
        branch: branch.name,
        year: batch.year,
        password: "12345",
        role: "student"
      });

      roll++;
    }
  });
});

fs.writeFileSync("students.json", JSON.stringify(students, null, 2));

console.log("✅ Students Generated (4400)");