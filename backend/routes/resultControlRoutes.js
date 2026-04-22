const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const ResultPublication = require("../models/ResultPublication");

const CONTROL_KEY = "global";

router.get("/status", authMiddleware, async (req, res) => {
  try {
    const publication = await ResultPublication.findOne({ key: CONTROL_KEY }).lean();

    if (!publication) {
      return res.json({
        isPublished: true,
        publishedAt: null,
        publishedBy: "system-default"
      });
    }

    res.json({
      isPublished: publication.isPublished,
      publishedAt: publication.publishedAt || null,
      publishedBy: publication.publishedBy || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/publish",
  authMiddleware,
  requireRoles("admin"),
  async (req, res) => {
    try {
      const publication = await ResultPublication.findOneAndUpdate(
        { key: CONTROL_KEY },
        {
          key: CONTROL_KEY,
          isPublished: true,
          publishedBy: req.user.username || req.user.rollNumber || "admin",
          publishedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.json({
        message: "Results published",
        publication
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.patch(
  "/unpublish",
  authMiddleware,
  requireRoles("admin"),
  async (req, res) => {
    try {
      const publication = await ResultPublication.findOneAndUpdate(
        { key: CONTROL_KEY },
        {
          key: CONTROL_KEY,
          isPublished: false,
          publishedBy: req.user.username || req.user.rollNumber || "admin",
          publishedAt: null
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.json({
        message: "Results unpublished",
        publication
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
