import express from "express"
import Subject from "../models/Subject.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

// Create subject
router.post("/", protect, async (req, res) => {
  try {
    const { name, level } = req.body

    if (!name || !level) {
      return res.status(400).json({ error: "Name and level required" })
    }

    const subject = await Subject.create({
      name,
      level,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    })

    res.status(201).json(subject)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all subjects
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 })
    res.json(subjects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



export default router
