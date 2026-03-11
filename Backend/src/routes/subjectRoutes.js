import express from "express"
import Subject from "../models/Subject.js"
import { protect } from "../middleware/authMiddleware.js"
import { findRtuSubjectMatch } from "../services/rtuSyllabusService.js"
import { normalizeSubjectName } from "../utils/subjectNameUtils.js"

const router = express.Router()

// Create subject
router.post("/", protect, async (req, res) => {
  try {
    const { name, university, semester } = req.body

    if (!name || !university || !semester) {
      return res.status(400).json({ error: "Name, university, and semester are required" })
    }

    if (university !== "RTU") {
      return res.status(400).json({ error: "Only RTU is supported right now" })
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
    const existingSubject = await Subject.findOne({
      university: syllabusMatch.university,
      semester: syllabusMatch.semester,
      normalizedName
    }).lean()

    if (existingSubject) {
      return res.status(409).json({
        error: `${syllabusMatch.courseName} already exists for ${syllabusMatch.university} semester ${syllabusMatch.semester}.`
      })
    }

    const subject = await Subject.create({
      name: syllabusMatch.courseName,
      normalizedName,
      level: "university",
      university: syllabusMatch.university,
      semester: syllabusMatch.semester,
      courseCode: syllabusMatch.courseCode,
      syllabusSourceFile: syllabusMatch.syllabusSourceFile,
      syllabusContext: syllabusMatch.syllabusContext,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    })

    res.status(201).json(subject)

  } catch (err) {
    res.status(500).json({ error: err.message })
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
