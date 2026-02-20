import express from "express"
import Topic from "../models/Topic.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/single/:id", async (req, res) => {
  const topic = await Topic.findById(req.params.id).populate('subjectId', 'name')
  res.json(topic)
})



// Create topic
router.post("/", protect, async (req, res) => {
  try {
    const { subjectId, name, level } = req.body

    if (!subjectId || !name || !level) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const topic = await Topic.create({
      subjectId,
      name,
      level,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    })

    res.status(201).json(topic)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// Get topics by subject
router.get("/:subjectId", async (req, res) => {
  try {
    const topics = await Topic.find({
      subjectId: req.params.subjectId
    }).sort({ createdAt: -1 })

    res.json(topics)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
