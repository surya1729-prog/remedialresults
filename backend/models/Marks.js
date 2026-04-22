const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema({

  rollNumber: {
    type: String,
    required: true
  },

  subjectCode: {
    type: String,
    required: true
  },

  mid1: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },

  mid2: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },

  mid3: {
    type: Number,
    required: true,
    min: 0,
    max: 20
  },

  assignmentMarks: {
    type: Number,
    default: null
  },

  attendanceMarks: {
    type: Number,
    default: null
  },

  continuousEvaluationMarks: {
    type: Number,
    default: null
  },

  semMarks: {
    type: Number,
    required: true,
    min: 0,
    max: 60
  }

});

module.exports = mongoose.model("Marks", marksSchema);