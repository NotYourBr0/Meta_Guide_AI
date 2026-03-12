import mongoose from "mongoose"

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  normalizedName: {
    type: String,
    default: ""
  },
  level: {
    type: String,
    enum: ["school", "university"],
    default: "university"
  },
  university: {
    type: String,
    enum: ["RTU"],
    required: true
  },
  branch: {
    type: String,
    enum: [
      "Computer Science & Engineering",
      "Artificial Intelligence",
      "Civil Engineering",
      "Electrical & Electronic Engineering",
      "Mechanical Engineering"
    ],
    default: "Computer Science & Engineering",
    required: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: true
  },
  courseCode: {
    type: String,
    default: ""
  },
  syllabusSourceFile: {
    type: String,
    default: ""
  },
  syllabusContext: {
    type: String,
    default: ""
  },
  syllabusContent: {
    type: String,
    default: ""
  },
  createdBy: {
    id: String,
    name: String
  }
}, { timestamps: true })

subjectSchema.index({ university: 1, branch: 1, semester: 1, normalizedName: 1 })

export default mongoose.model("Subject", subjectSchema)
