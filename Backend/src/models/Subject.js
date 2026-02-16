import mongoose from "mongoose"

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ["school", "university"],
    required: true
  },
  createdBy: {
    id: String,
    name: String
  }
}, { timestamps: true })

export default mongoose.model("Subject", subjectSchema)
