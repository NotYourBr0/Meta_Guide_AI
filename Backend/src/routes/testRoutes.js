import express from "express"
import jwt from "jsonwebtoken"
import Topic from "../models/Topic.js"
import Subject from "../models/Subject.js"
import Test from "../models/Test.js"
import User from "../models/User.js"
import { generateTestQuestionsFromAI } from "../services/testService.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

// GET /api/tests — Get all topics with test metadata (high scores for logged-in user)
router.get("/", async (req, res) => {
  try {
    // Get auth token if present (optional auth)
    let userId = null
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        userId = decoded.userId
      } catch (e) {
        // Token invalid, continue as guest
      }
    }

    // Fetch all topics with subject info
    const topics = await Topic.find({}).populate("subjectId", "name level").lean()

    // Fetch high scores for this user if logged in
    let userScores = {}
    if (userId) {
      const scores = await Test.find({ userId }).lean()
      scores.forEach(s => {
        userScores[s.topicId.toString()] = {
          highScore: s.highScore,
          maxScore: s.maxScore,
          attemptCount: s.attemptCount
        }
      })
    }

    const result = topics.map(topic => ({
      _id: topic._id,
      name: topic.name,
      level: topic.level,
      createdBy: topic.createdBy,
      subject: topic.subjectId,
      hasExplanation: !!topic.explanation,
      highScore: userScores[topic._id.toString()]?.highScore || 0,
      maxScore: userScores[topic._id.toString()]?.maxScore || 0,
      attemptCount: userScores[topic._id.toString()]?.attemptCount || 0
    }))

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tests/generate/:topicId — Generate test questions (auth required)
router.post("/generate/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params

    const topic = await Topic.findById(topicId)
    if (!topic) return res.status(404).json({ error: "Topic not found" })

    const subject = await Subject.findById(topic.subjectId)
    if (!subject) return res.status(404).json({ error: "Subject not found" })

    const questions = await generateTestQuestionsFromAI({
      subjectName: subject.name,
      subjectLevel: subject.level,
      topicName: topic.name,
      topicLevel: topic.level,
      explanation: topic.explanation
    })

    res.json({
      questions,
      topicName: topic.name,
      topicLevel: topic.level,
      totalQuestions: questions.length,
      maxScore: questions.length * 10
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tests/score/:topicId — Submit score, save if high score (auth required)
router.post("/score/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params
    const { score, maxScore } = req.body
    const userId = req.user._id.toString()

    // Find existing record or create new one
    let testRecord = await Test.findOne({ topicId, userId })

    let isNewHighScore = false
    let previousHighScore = 0

    if (!testRecord) {
      testRecord = new Test({
        topicId,
        userId,
        highScore: score,
        maxScore,
        attemptCount: 1,
        lastAttemptAt: new Date()
      })
      isNewHighScore = true
    } else {
      previousHighScore = testRecord.highScore
      testRecord.attemptCount += 1
      testRecord.lastAttemptAt = new Date()

      if (score > testRecord.highScore) {
        testRecord.highScore = score
        testRecord.maxScore = maxScore
        isNewHighScore = true
      }
    }

    await testRecord.save()

    res.json({
      highScore: testRecord.highScore,
      previousHighScore,
      isNewHighScore,
      attemptCount: testRecord.attemptCount
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tests/highscore/:topicId — Get user's high score for a topic (auth required)
router.get("/highscore/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params
    const userId = req.user._id.toString()

    const testRecord = await Test.findOne({ topicId, userId })

    if (!testRecord) {
      return res.json({ highScore: 0, maxScore: 0, attemptCount: 0 })
    }

    res.json({
      highScore: testRecord.highScore,
      maxScore: testRecord.maxScore,
      attemptCount: testRecord.attemptCount
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tests/leaderboard/:topicId — Get ranked leaderboard for a topic (public)
router.get("/leaderboard/:topicId", async (req, res) => {
  try {
    const { topicId } = req.params

    // Get all scores for this topic, sorted by highScore desc
    const scores = await Test.find({ topicId }).sort({ highScore: -1 }).limit(20).lean()

    if (scores.length === 0) {
      return res.json([])
    }

    // Manually fetch user info (userId is stored as String, not ObjectId ref)
    const userIds = scores.map(s => s.userId)
    const users = await User.find({ _id: { $in: userIds } }).select("name avatar").lean()
    const userMap = {}
    users.forEach(u => { userMap[u._id.toString()] = u })

    const leaderboard = scores.map((score, idx) => {
      const user = userMap[score.userId] || {}
      const percent = score.maxScore > 0 ? Math.round((score.highScore / score.maxScore) * 100) : 0
      return {
        rank: idx + 1,
        userId: score.userId,
        name: user.name || "Unknown",
        avatar: user.avatar || null,
        highScore: score.highScore,
        maxScore: score.maxScore,
        percent,
        attemptCount: score.attemptCount,
        lastAttemptAt: score.lastAttemptAt
      }
    })

    res.json(leaderboard)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
