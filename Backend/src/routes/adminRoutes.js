import express from "express"
import User from "../models/User.js"
import Subject from "../models/Subject.js"
import Topic from "../models/Topic.js"
import { protect, superAdminOnly } from "../middleware/authMiddleware.js"
import {
  resetTopicGeneratedContent,
  runTopicGenerationInBackground
} from "../services/topicGenerationService.js"
import { findRtuSubjectMatch, getRtuSubjectSuggestions } from "../services/rtuSyllabusService.js"
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
    res.status(err.statusCode || 500).json({ error: err.message })
  }
})

router.put("/subject/:id", protect, superAdminOnly, async (req, res) => {
  try {
    const { name, university, branch } = req.body

    const existing = await Subject.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: "Subject not found" })
    }

    const syllabusMatch = findRtuSubjectMatch({
      subjectName: name,
      branch
    })

    if (!syllabusMatch) {
      const suggestions = getRtuSubjectSuggestions({
        subjectName: name,
        branch
      })

      return res.status(400).json({
        error: `Could not match "${name}" in RTU ${branch} syllabus. Use the official subject name.${suggestions.length ? ` Suggestions: ${suggestions.map((suggestion) => `${suggestion.courseName} (${suggestion.courseCode || "No code"}, Semester ${suggestion.semester})`).join(", ")}.` : ""}`,
        suggestions
      })
    }

    const normalizedName = normalizeSubjectName(syllabusMatch.courseName)
    const duplicateSubject = await Subject.findOne({
      _id: { $ne: req.params.id },
      university: university || "RTU",
      branch: syllabusMatch.branch,
      semester: syllabusMatch.semester,
      normalizedName
    }).lean()

    if (duplicateSubject) {
      return res.status(409).json({
        error: `${syllabusMatch.courseName} already exists for ${syllabusMatch.branch}, ${(university || "RTU")} semester ${syllabusMatch.semester}.`
      })
    }

    const updated = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name: syllabusMatch.courseName,
        normalizedName,
        level: "university",
        university: university || "RTU",
        branch: syllabusMatch.branch,
        semester: syllabusMatch.semester,
        courseCode: syllabusMatch.courseCode,
        syllabusSourceFile: syllabusMatch.syllabusSourceFile,
        syllabusContext: syllabusMatch.syllabusContext,
        syllabusContent: syllabusMatch.syllabusContent
      },
      { new: true }
    )

    const subjectChanged =
      existing.name !== updated.name ||
      existing.branch !== updated.branch ||
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
    res.status(err.statusCode || 500).json({ error: err.message, suggestions: err.suggestions || [] })
  }
})


export default router
