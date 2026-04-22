const mongoose = require("mongoose");

const resultPublicationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global"
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false
    },
    publishedBy: {
      type: String,
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResultPublication", resultPublicationSchema);
