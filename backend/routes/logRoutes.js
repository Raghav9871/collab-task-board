const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  const logs = await Log.find()
    .sort({ timestamp: -1 })
    .limit(20)
    .populate("userId", "name")
    .populate("taskId", "title");
  res.json(logs);
});

module.exports = router;
