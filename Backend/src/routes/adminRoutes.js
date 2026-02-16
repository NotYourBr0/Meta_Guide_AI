import express from "express"
import User from "../models/User.js"
import Subject from "../models/Subject.js"
import Topic from "../models/Topic.js"
import { protect, superAdminOnly } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/overview", protect, superAdminOnly, async (req, res) => {
  const users = await User.find().select("-password")
  const subjects = await Subject.find()
  const topics = await Topic.find()

  res.json({ users, subjects, topics })
})

router.delete("/subject/:id", protect, superAdminOnly, async (req, res) => {
  await Subject.findByIdAndDelete(req.params.id)
  await Topic.deleteMany({ subjectId: req.params.id })
  res.json({ message: "Subject deleted" })
})

router.delete("/topic/:id", protect, superAdminOnly, async (req, res) => {
  await Topic.findByIdAndDelete(req.params.id)
  res.json({ message: "Topic deleted" })
})
router.put("/topic/:id", protect, superAdminOnly, async (req, res) => {
  try {
    const { name, level } = req.body

    const updated = await Topic.findByIdAndUpdate(
      req.params.id,
      { name, level },
      { new: true }
    )

    res.json(updated)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put("/subject/:id", protect, superAdminOnly, async (req, res) => {
  try {
    const { name, level } = req.body

    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, level },
      { new: true }
    )

    res.json(updated)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


export default router
