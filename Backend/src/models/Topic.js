import mongoose from "mongoose"

const topicSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: true
  },
  explanation: {
    type: String,
    default: ""
  },
  hindiExplanation: {
    type: String,
    default: ""
  },
  simulationPath: {
    type: String,
    default: ""
  },
  createdBy: {
    id: String,
    name: String
  }
}, { timestamps: true })

export default mongoose.model("Topic", topicSchema)
