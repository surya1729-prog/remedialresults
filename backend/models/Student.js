const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Student", studentSchema);