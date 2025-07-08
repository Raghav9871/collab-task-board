const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Task = require("../models/Task");
const createLog = require("../utils/createLog");

// Get all tasks
router.get("/", authMiddleware, async (req, res) => {
  const tasks = await Task.find().populate("assignedTo", "name email");
  res.json(tasks);
});

// Create task
router.post("/", authMiddleware, async (req, res) => {
  try {
    const createdTask = await Task.create({
      ...req.body,
      status: "Todo",
      createdBy: req.user.id,
    });

    await createLog({
      userId: req.user.id,
      taskId: createdTask._id,
      action: "created task",
    });

    res.status(201).json(createdTask);
  } catch (err) {
    res.status(400).json({ message: "Task title must be unique" });
  }
});

// Update task
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const existingTask = await Task.findById(req.params.id);

    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      req.body.updatedAt &&
      new Date(req.body.updatedAt).getTime() !==
        new Date(existingTask.updatedAt).getTime()
    ) {
      if (!req.body.force) {
        return res.status(409).json({
          message: "Conflict detected",
          serverTask: existingTask,
          userTask: req.body,
        });
      }
    }

    if (req.body.title !== undefined) existingTask.title = req.body.title;
    if (req.body.description !== undefined)
      existingTask.description = req.body.description;
    if (req.body.priority !== undefined)
      existingTask.priority = req.body.priority;
    if (req.body.status !== undefined) existingTask.status = req.body.status;

    const updatedTask = await existingTask.save();

    await createLog({
      userId: req.user.id,
      taskId: updatedTask._id,
      action: "updated task",
    });

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// Delete task
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this task" });
    }

    await task.deleteOne();

    await createLog({
      userId: req.user.id,
      taskId: task._id,
      action: "deleted task",
    });

    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(400).json({ message: "Delete failed" });
  }
});

// Smart Assign Route
router.put("/:id/smart-assign", authMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    const userTaskCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Task.countDocuments({
          assignedTo: user._id,
          status: { $in: ["Todo", "In Progress"] },
        });
        return { user, count };
      })
    );

    const leastBusy = userTaskCounts.sort((a, b) => a.count - b.count)[0].user;

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo: leastBusy._id },
      { new: true }
    ).populate("assignedTo", "name email");

    await createLog({
      userId: req.user.id,
      taskId: updated._id,
      action: `smart assigned to ${leastBusy.name}`,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Smart assign failed" });
  }
});

module.exports = router;
