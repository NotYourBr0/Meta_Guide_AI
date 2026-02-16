import express from "express"
import { saveSimulationFile } from "../utils/saveSimulation.js"
import Topic from "../models/Topic.js"
import { generateSimulationFromAI } from "../services/simulationService.js"
import { protect } from "../middleware/authMiddleware.js"


const router = express.Router()

// Complete route handler with validation and protection
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

    // ✅ ADD VALIDATION RIGHT HERE
   if (
  !htmlContent ||
  typeof htmlContent !== "string" ||
  !htmlContent.includes("<html") ||
  !htmlContent.includes("<body") ||
  !htmlContent.includes("<script") ||
  htmlContent.includes("fetch(") ||
  htmlContent.includes("XMLHttpRequest") ||
  htmlContent.includes("<link") ||
  htmlContent.includes("import ") ||
  htmlContent.includes("src=\"http") ||
  htmlContent.includes("https://")
) {
  return res.status(400).json({
    error: "Invalid or unsafe simulation format"
  })
}
if (htmlContent.length > 200000) {
  return res.status(400).json({
    error: "Simulation too large"
  })
}


    const path = saveSimulationFile(topicId, htmlContent)

    topic.simulationPath = path
    await topic.save()

    res.json({ simulationPath: path })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



export default router
