import express from "express"
import Topic from "../models/Topic.js"
import Subject from "../models/Subject.js"
import { generateExplanationFromAI } from "../services/explanationService.js"
import { translateToHindi } from "../services/translationService.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/generate/:topicId", protect, async (req, res) => {  try {
    const { topicId } = req.params
    const { language } = req.body

    const topic = await Topic.findById(topicId)
    if (!topic) return res.status(404).json({ error: "Topic not found" })

    const subject = await Subject.findById(topic.subjectId)

    const explanation = await generateExplanationFromAI({
      subjectName: subject.name,
      subjectLevel: subject.level,
      topicName: topic.name,
      topicLevel: topic.level,
      language
    })

    topic.explanation = explanation

    // Automatically generate Hindi translation
    let hindiExplanation = ""
    try {
      hindiExplanation = await translateToHindi(explanation)
      topic.hindiExplanation = hindiExplanation
    } catch (translationError) {
      console.error("Translation error:", translationError)
      // Continue even if translation fails
    }

    await topic.save()

    res.json({ 
      explanation,
      hindiExplanation 
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
