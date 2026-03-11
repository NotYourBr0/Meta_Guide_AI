import express from "express"
import User from "../models/User.js"
import Subject from "../models/Subject.js"
import Topic from "../models/Topic.js"
import { protect, superAdminOnly } from "../middleware/authMiddleware.js"
import {
  resetTopicGeneratedContent,
  runTopicGenerationInBackground
} from "../services/topicGenerationService.js"
import { findRtuSubjectMatch } from "../services/rtuSyllabusService.js"
import { normalizeSubjectName } from "../utils/subjectNameUtils.js"

const router = express.Router()

router.get("/overview", protect, superAdminOnly, async (req, res) => {
  const users = await User.find().select("-password")
  const subjects = await Subject.find()
  const topics = await Topic.find()

  res.json({ users, subjects, topics })
})

router.delete("/subject/:id", protect, superAdminOnly, async (req, res) => {
  await Subject.findByIdAndDelete(req.params.id)
  await Topic.deleteMany({ subjectId: req.params.id })
  res.json({ message: "Subject deleted" })
})

router.delete("/topic/:id", protect, superAdminOnly, async (req, res) => {
  await Topic.findByIdAndDelete(req.params.id)
  res.json({ message: "Topic deleted" })
})
router.put("/topic/:id", protect, superAdminOnly, async (req, res) => {
  try {
    const { name, level } = req.body

    const existing = await Topic.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: "Topic not found" })
    }

    const shouldRegenerate = existing.name !== name || existing.level !== level

    const updated = await Topic.findByIdAndUpdate(
      req.params.id,
      { name, level },
      { new: true }
    )

    if (shouldRegenerate) {
      await resetTopicGeneratedContent(req.params.id, level)
      runTopicGenerationInBackground(req.params.id)
    }

    res.json(await Topic.findById(req.params.id))

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put("/subject/:id", protect, superAdminOnly, async (req, res) => {
  try {
    const { name, university, semester } = req.body

    const existing = await Subject.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: "Subject not found" })
    }

    const syllabusMatch = findRtuSubjectMatch({
      subjectName: name,
      semester
    })

    if (!syllabusMatch) {
      return res.status(400).json({
        error: `Could not match "${name}" in RTU semester ${semester} syllabus. Use the official subject name.`
      })
    }

    const normalizedName = normalizeSubjectName(syllabusMatch.courseName)
    const duplicateSubject = await Subject.findOne({
      _id: { $ne: req.params.id },
      university: university || "RTU",
      semester: syllabusMatch.semester,
      normalizedName
    }).lean()

    if (duplicateSubject) {
      return res.status(409).json({
        error: `${syllabusMatch.courseName} already exists for ${(university || "RTU")} semester ${syllabusMatch.semester}.`
      })
    }

    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name: syllabusMatch.courseName,
        normalizedName,
        level: "university",
        university: university || "RTU",
        semester: syllabusMatch.semester,
        courseCode: syllabusMatch.courseCode,
        syllabusSourceFile: syllabusMatch.syllabusSourceFile,
        syllabusContext: syllabusMatch.syllabusContext
      },
      { new: true }
    )

    const subjectChanged =
      existing.name !== updated.name ||
      existing.semester !== updated.semester ||
      existing.university !== updated.university ||
      existing.courseCode !== updated.courseCode

    if (subjectChanged) {
      const relatedTopics = await Topic.find({ subjectId: req.params.id }).select("_id level")
      await Promise.all(
        relatedTopics.map(async (topic) => {
          await resetTopicGeneratedContent(topic._id, topic.level)
          runTopicGenerationInBackground(topic._id)
        })
      )
    }

    res.json(updated)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


export default router
