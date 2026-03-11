import express from "express"
import Topic from "../models/Topic.js"
import { optionalProtect, protect } from "../middleware/authMiddleware.js"
import {
  createTopicGenerationState,
  runTopicGenerationInBackground
} from "../services/topicGenerationService.js"

const router = express.Router()

const serializeTopic = (topic, userId = null) => {
  const topicObject = topic.toObject ? topic.toObject() : topic
  const likedBy = Array.isArray(topicObject.likedBy) ? topicObject.likedBy : []

  return {
    ...topicObject,
    likesCount: typeof topicObject.likesCount === "number" ? topicObject.likesCount : likedBy.length,
    isLikedByUser: userId ? likedBy.includes(String(userId)) : false,
    likedBy: undefined
  }
}

router.get("/single/:id", optionalProtect, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate("subjectId", "name level university semester courseCode")
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" })
    }
    res.json(serializeTopic(topic, req.user?._id))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
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
      likedBy: [],
      likesCount: 0,
      generationStatus: createTopicGenerationState(level),
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    })

    res.status(201).json(topic)
    runTopicGenerationInBackground(topic._id)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post("/:id/like", protect, async (req, res) => {
  try {
    const userId = String(req.user._id)

    let topic = await Topic.findOneAndUpdate(
      {
        _id: req.params.id,
        likedBy: { $ne: userId }
      },
      {
        $addToSet: { likedBy: userId },
        $inc: { likesCount: 1 }
      },
      { new: true }
    )

    if (!topic) {
      topic = await Topic.findById(req.params.id)
    }

    if (!topic) {
      return res.status(404).json({ error: "Topic not found" })
    }

    res.json({
      topic: serializeTopic(topic, userId)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete("/:id/like", protect, async (req, res) => {
  try {
    const userId = String(req.user._id)

    let topic = await Topic.findOneAndUpdate(
      {
        _id: req.params.id,
        likedBy: userId
      },
      {
        $pull: { likedBy: userId },
        $inc: { likesCount: -1 }
      },
      { new: true }
    )

    if (!topic) {
      topic = await Topic.findById(req.params.id)
    } else if (topic.likesCount < 0) {
      topic.likesCount = 0
      await topic.save()
    }

    if (!topic) {
      return res.status(404).json({ error: "Topic not found" })
    }

    res.json({
      topic: serializeTopic(topic, userId)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get topics by subject
router.get("/:subjectId", optionalProtect, async (req, res) => {
  try {
    const topics = await Topic.find({
      subjectId: req.params.subjectId
    }).sort({ createdAt: -1 }).lean()

    res.json(topics.map((topic) => serializeTopic(topic, req.user?._id)))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
