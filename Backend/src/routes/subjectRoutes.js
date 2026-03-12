import express from "express"
import Subject from "../models/Subject.js"
import { protect } from "../middleware/authMiddleware.js"
import { findRtuSubjectMatch, getRtuSubjectSuggestions } from "../services/rtuSyllabusService.js"
import { normalizeSubjectName } from "../utils/subjectNameUtils.js"

const router = express.Router()

// Create subject
router.post("/", protect, async (req, res) => {
  try {
    const { name, university, branch } = req.body

    if (!name || !university || !branch) {
      return res.status(400).json({ error: "Name, university, and branch are required" })
    }

    if (university !== "RTU") {
      return res.status(400).json({ error: "Only RTU is supported right now" })
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
    const existingSubject = await Subject.findOne({
      university: syllabusMatch.university,
      branch: syllabusMatch.branch,
      semester: syllabusMatch.semester,
      normalizedName
    }).lean()

    if (existingSubject) {
      return res.status(409).json({
        error: `${syllabusMatch.courseName} already exists for ${syllabusMatch.branch}, ${syllabusMatch.university} semester ${syllabusMatch.semester}.`
      })
    }

    const subject = await Subject.create({
      name: syllabusMatch.courseName,
      normalizedName,
      level: "university",
      university: syllabusMatch.university,
      branch: syllabusMatch.branch,
      semester: syllabusMatch.semester,
      courseCode: syllabusMatch.courseCode,
      syllabusSourceFile: syllabusMatch.syllabusSourceFile,
      syllabusContext: syllabusMatch.syllabusContext,
      syllabusContent: syllabusMatch.syllabusContent,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    })

    res.status(201).json(subject)

  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message, suggestions: err.suggestions || [] })
  }
})

// Get all subjects
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 })
    res.json(subjects)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



export default router
