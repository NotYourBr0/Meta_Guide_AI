import express from "express"
import Subject from "../models/Subject.js"
import Topic from "../models/Topic.js"
import { protect } from "../middleware/authMiddleware.js"
import { generateTopicSimulation } from "../services/topicGenerationService.js"

const router = express.Router()

// ── Serve simulation HTML straight from MongoDB ──────────────────────────────
router.get("/serve/:topicId", async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.topicId)
    if (!topic || !topic.simulationHtml) {
      return res.status(404).send("<h1>Simulation not found</h1>")
    }
    res.setHeader("Content-Type", "text/html")
    res.send(topic.simulationHtml)
  } catch (err) {
    res.status(500).send("<h1>Server error</h1>")
  }
})

// ── Generate simulation and persist HTML to MongoDB ──────────────────────────
router.post("/generate-ai/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params

    const topic = await Topic.findById(topicId)
    if (!topic) {
      return res.status(404).json({ error: "Topic not found" })
    }

    if (!topic.explanation) {
      return res.status(400).json({ error: "Explanation required first" })
    }

    const subject = await Subject.findById(topic.subjectId)
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" })
    }

    await generateTopicSimulation({
      topicId,
      subjectName: subject.name,
      subjectUniversity: subject.university,
      subjectSemester: subject.semester,
      subjectCode: subject.courseCode,
      syllabusContext: subject.syllabusContext,
      topicName: topic.name,
      topicLevel: topic.level,
      explanation: topic.explanation,
      force: true
    })

    const updatedTopic = await Topic.findById(topicId).select("generationStatus simulationHtml")
    res.json({ success: true, generationStatus: updatedTopic.generationStatus, hasSimulation: !!updatedTopic.simulationHtml })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
