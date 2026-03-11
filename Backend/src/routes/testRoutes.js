import express from "express"
import jwt from "jsonwebtoken"
import Topic from "../models/Topic.js"
import Subject from "../models/Subject.js"
import Test from "../models/Test.js"
import User from "../models/User.js"
import QuestionBank from "../models/QuestionBank.js"
import { protect } from "../middleware/authMiddleware.js"
import { generateTopicQuestionBank } from "../services/topicGenerationService.js"

const router = express.Router()

// ─── Helper: shuffle array (Fisher-Yates) ────────────────────────────────────
function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }

// GET /api/tests — Get all topics with test metadata (high scores for logged-in user)
router.get("/", async (req, res) => {
  try {
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

    const topics = await Topic.find({}).populate("subjectId", "name level university semester courseCode").lean()

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

    // Check which topics have a question bank
    const bankTopicIds = (await QuestionBank.find({}, "topicId").lean()).map(b => b.topicId.toString())

    const result = topics.map(topic => ({
      _id: topic._id,
      name: topic.name,
      level: topic.level,
      createdBy: topic.createdBy,
      subject: topic.subjectId,
      hasExplanation: !!topic.explanation,
      hasQuestionBank: bankTopicIds.includes(topic._id.toString()),
      highScore: userScores[topic._id.toString()]?.highScore || 0,
      maxScore: userScores[topic._id.toString()]?.maxScore || 0,
      attemptCount: userScores[topic._id.toString()]?.attemptCount || 0
    }))

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tests/questions/:topicId — Fetch random N questions from bank (auth required)
router.get("/questions/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params

    const topic = await Topic.findById(topicId)
    if (!topic) return res.status(404).json({ error: "Topic not found" })

    const count = QUESTION_COUNTS[topic.level] || 5
    const bank = await QuestionBank.findOne({ topicId })

    if (!bank || bank.questions.length === 0) {
      return res.json({
        questions: [],
        bankExists: false,
        totalInBank: 0,
        topicName: topic.name,
        topicLevel: topic.level,
        maxScore: count * 10
      })
    }

    // Randomly select N questions from the bank
    const shuffled = shuffleArray(bank.questions)
    const selected = shuffled.slice(0, count).map((q, idx) => ({
      id: idx + 1,
      question: q.question,
      options: q.options,
      correctAnswers: q.correctAnswers,
      explanation: q.explanation,
      isMultiple: q.isMultiple,
      points: q.points || 10
    }))

    res.json({
      questions: selected,
      bankExists: true,
      totalInBank: bank.questions.length,
      topicName: topic.name,
      topicLevel: topic.level,
      maxScore: count * 10
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tests/generate-bank/:topicId — Generate & save 50 questions to DB (auth required)
router.post("/generate-bank/:topicId", protect, async (req, res) => {
  try {
    const { topicId } = req.params

    const topic = await Topic.findById(topicId)
    if (!topic) return res.status(404).json({ error: "Topic not found" })

    const subject = await Subject.findById(topic.subjectId)
    if (!subject) return res.status(404).json({ error: "Subject not found" })

    const questions = await generateTopicQuestionBank({
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

    // Upsert question bank
    res.json({
      success: true,
      totalGenerated: questions.length,
      topicName: topic.name
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tests/bank/:topicId — View all questions in bank (admin use)
router.get("/bank/:topicId", protect, async (req, res) => {
  try {
    const bank = await QuestionBank.findOne({ topicId: req.params.topicId })
    if (!bank) return res.json({ questions: [], totalInBank: 0 })
    res.json({ questions: bank.questions, totalInBank: bank.questions.length, generatedAt: bank.generatedAt })
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

// GET /api/tests/global-leaderboard — Get all users ranked by total high-score sum (public)
router.get("/global-leaderboard", async (req, res) => {
  try {
    const aggregated = await Test.aggregate([
      { $match: { highScore: { $gt: 0 } } },
      {
        $group: {
          _id: "$userId",
          totalScore: { $sum: "$highScore" },
          topicsAttempted: { $sum: 1 }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 100 }
    ])

    if (aggregated.length === 0) return res.json([])

    const userIds = aggregated.map(a => a._id)
    const users = await User.find({ _id: { $in: userIds } }).select("name").lean()
    const userMap = {}
    users.forEach(u => { userMap[u._id.toString()] = u.name })

    const leaderboard = aggregated.map((entry, idx) => ({
      rank: idx + 1,
      userId: entry._id,
      name: userMap[entry._id] || "Unknown",
      totalScore: entry.totalScore,
      topicsAttempted: entry.topicsAttempted
    }))

    res.json(leaderboard)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tests/leaderboard/:topicId — Get ranked leaderboard for a topic (public)
router.get("/leaderboard/:topicId", async (req, res) => {
  try {
    const { topicId } = req.params

    const scores = await Test.find({ topicId }).sort({ highScore: -1 }).limit(20).lean()

    if (scores.length === 0) {
      return res.json([])
    }

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
