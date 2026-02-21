import express from "express"
import Topic from "../models/Topic.js"
import { generateSimulationFromAI } from "../services/simulationService.js"
import { protect } from "../middleware/authMiddleware.js"

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

    const htmlContent = await generateSimulationFromAI({
      topicName: topic.name,
      explanation: topic.explanation
    })

    // Block only genuinely dangerous patterns
    if (
      !htmlContent ||
      typeof htmlContent !== "string" ||
      !htmlContent.includes("<html") ||
      !htmlContent.includes("<body") ||
      !htmlContent.includes("<script") ||
      htmlContent.includes("fetch(") ||
      htmlContent.includes("XMLHttpRequest")
    ) {
      return res.status(400).json({ error: "Invalid or unsafe simulation format" })
    }

    if (htmlContent.length > 200000) {
      return res.status(400).json({ error: "Simulation too large" })
    }

    // Store HTML in MongoDB — survives Render restarts
    topic.simulationHtml = htmlContent
    await topic.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
