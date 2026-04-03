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
    required: true
  },

  mid2: {
    type: Number,
    required: true
  },

  mid3: {
    type: Number,
    required: true
  },

  semMarks: {
    type: Number,
    required: true
  }

});

module.exports = mongoose.model("Marks", marksSchema);