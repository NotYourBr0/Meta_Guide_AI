import express from "express"
import Topic from "../models/Topic.js"
import { protect } from "../middleware/authMiddleware.js"
import {
  generateTopicExplanation,
  generateTopicQuestionBank,
  generateTopicSimulation,
  generateTopicTranslation
} from "../services/topicGenerationService.js"

const router = express.Router()

router.post("/generate/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params
    const result = await generateTopicExplanation(topicId)
    const { topic, subject, explanation } = result
    const hindiExplanation = await generateTopicTranslation(topicId, explanation)

    Promise.allSettled([
      generateTopicQuestionBank({
        topicId,
        subjectName: subject.name,
        subjectUniversity: subject.university,
        subjectSemester: subject.semester,
        subjectCode: subject.courseCode,
        syllabusContext: subject.syllabusContext,
        topicName: topic.name,
        topicLevel: topic.level,
        explanation,
        force: true
      }),
      generateTopicSimulation({
        topicId,
        topicName: topic.name,
        topicLevel: topic.level,
        explanation,
        force: true
      })
    ]).catch(() => {})

    res.json({
      explanation,
      hindiExplanation,
      generationStatus: (await Topic.findById(topicId).select("generationStatus")).generationStatus
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
