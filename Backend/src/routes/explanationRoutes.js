import express from "express"
import Topic from "../models/Topic.js"
import Subject from "../models/Subject.js"
import QuestionBank from "../models/QuestionBank.js"
import { generateExplanationFromAI } from "../services/explanationService.js"
import { translateToHindi } from "../services/translationService.js"
import { generate50QuestionsFromAI } from "../services/testService.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/generate/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params
    const { language } = req.body

    const topic = await Topic.findById(topicId)
    if (!topic) return res.status(404).json({ error: "Topic not found" })

    const subject = await Subject.findById(topic.subjectId)

    // Step 1: Generate English explanation
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

    // Step 3: Fire-and-forget — generate 50-question bank in the background
    // We do NOT await this so the response is sent immediately
    ;(async () => {
      try {
        const existingBank = await QuestionBank.findOne({ topicId })
        if (!existingBank) {
          console.log(`[QuestionBank] Generating 50 questions for topic: ${topic.name}`)
          const questions = await generate50QuestionsFromAI({
            subjectName: subject.name,
            topicName: topic.name,
            topicLevel: topic.level,
            explanation
          })
          await QuestionBank.findOneAndUpdate(
            { topicId },
            { questions, generatedAt: new Date() },
            { upsert: true, new: true }
          )
          console.log(`[QuestionBank] Saved ${questions.length} questions for topic: ${topic.name}`)
        }
      } catch (err) {
        console.error("[QuestionBank] Background generation error (non-fatal):", err.message)
      }
    })()

    res.json({
      explanation,
      hindiExplanation
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
