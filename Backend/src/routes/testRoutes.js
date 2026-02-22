import express from "express"
import jwt from "jsonwebtoken"
import fetch from "node-fetch"
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

// GET /api/tests/stream/:topicId — Stream questions one-by-one as SSE (auth required)
router.get("/stream/:topicId", protect, async (req, res) => {
  const { topicId } = req.params

  const topic = await Topic.findById(topicId)
  if (!topic) return res.status(404).json({ error: "Topic not found" })

  const subject = await Subject.findById(topic.subjectId)
  if (!subject) return res.status(404).json({ error: "Subject not found" })

  const QUESTION_COUNT = { beginner: 5, intermediate: 5, advanced: 10 }
  const count = QUESTION_COUNT[topic.level] || 5
  const maxScore = count * 10

  const prompt = `You are a ${subject.name} quiz creator. Generate exactly ${count} multiple-choice questions for the topic "${topic.name}" (${topic.level} level).

Context:
${topic.explanation ? topic.explanation.substring(0, 1500) : `${topic.name} in ${subject.name}`}

Rules:
- Each question has exactly 6 options (A-F)
- Mix single and multiple correct answers
- Test understanding, not memorization
- Keep explanations to 1 sentence

Return ONLY a valid JSON array, no markdown:
[{"question":"...","options":["A","B","C","D","E","F"],"correctAnswers":[0],"explanation":"...","isMultiple":false}]

Generate ${count} questions now:`

  const apiKey = process.env.TEST_API_KEY
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse&key=${apiKey}`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // Send metadata first
  res.write(`data: ${JSON.stringify({ type: 'meta', topicName: topic.name, topicLevel: topic.level, maxScore, totalExpected: count })  }\n\n`)

  try {
    const geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      })
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      res.write(`data: ${JSON.stringify({ type: 'error', message: errText })}\n\n`)
      res.end()
      return
    }

    const body = geminiRes.body
    let textBuffer = '' // accumulated raw text from Gemini
    let sseBuffer = '' // SSE line buffer
    let questionIndex = 0

    // Try to extract and emit complete question objects from textBuffer
    function tryEmitQuestions() {
      let start = textBuffer.indexOf('{')
      while (start !== -1) {
        // Find a balanced closing brace
        let depth = 0
        let end = -1
        for (let i = start; i < textBuffer.length; i++) {
          if (textBuffer[i] === '{') depth++
          else if (textBuffer[i] === '}') {
            depth--
            if (depth === 0) { end = i; break }
          }
        }
        if (end === -1) break // incomplete object — wait for more data

        const candidate = textBuffer.substring(start, end + 1)
        try {
          const q = JSON.parse(candidate)
          // Validate minimal structure
          if (q.question && Array.isArray(q.options) && Array.isArray(q.correctAnswers)) {
            const normalized = {
              id: questionIndex + 1,
              question: q.question,
              options: q.options.slice(0, 6),
              correctAnswers: q.correctAnswers,
              explanation: q.explanation || '',
              isMultiple: q.isMultiple || q.correctAnswers.length > 1,
              points: 10
            }
            res.write(`data: ${JSON.stringify({ type: 'question', question: normalized, index: questionIndex })}\n\n`)
            questionIndex++
            textBuffer = textBuffer.substring(end + 1)
            start = textBuffer.indexOf('{')
            continue
          }
        } catch { /* not valid JSON yet */ }
        // Move past this brace to look for the next start
        start = textBuffer.indexOf('{', start + 1)
      }
    }

    body.on('data', (chunk) => {
      sseBuffer += chunk.toString('utf8')
      const lines = sseBuffer.split('\n')
      sseBuffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw || raw === '[DONE]') continue
        try {
          const parsed = JSON.parse(raw)
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            textBuffer += text
            tryEmitQuestions()
          }
        } catch { /* ignore */ }
      }
    })

    body.on('end', () => {
      // Final flush
      tryEmitQuestions()
      res.write(`data: ${JSON.stringify({ type: 'done', total: questionIndex })}\n\n`)
      res.end()
    })

    body.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
      res.end()
    })

    req.on('close', () => body.destroy())

  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
    res.end()
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
