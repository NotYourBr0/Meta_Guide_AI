import express from "express"
import Topic from "../models/Topic.js"
import Subject from "../models/Subject.js"
import { generateExplanationFromAI } from "../services/explanationService.js"
import { translateToHindi } from "../services/translationService.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/generate/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params
    const { language } = req.body

    const topic = await Topic.findById(topicId)
    if (!topic) return res.status(404).json({ error: "Topic not found" })

    const subject = await Subject.findById(topic.subjectId)

    // Step 1: Generate English explanation (needed before translation)
    const explanation = await generateExplanationFromAI({
      subjectName: subject.name,
      subjectLevel: subject.level,
      topicName: topic.name,
      topicLevel: topic.level,
      language
    })

    topic.explanation = explanation

    // Step 2: Run Hindi translation and DB save in PARALLEL for speed
    let hindiExplanation = ""
    const [translationResult] = await Promise.allSettled([
      translateToHindi(explanation),
    ])

    if (translationResult.status === "fulfilled") {
      hindiExplanation = translationResult.value
      topic.hindiExplanation = hindiExplanation
    } else {
      console.error("Translation error (non-fatal):", translationResult.reason)
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
