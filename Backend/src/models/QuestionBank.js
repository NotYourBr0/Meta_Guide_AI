import mongoose from "mongoose"

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true }, // exactly 6
  correctAnswers: { type: [Number], required: true }, // indices
  explanation: { type: String, default: "" },
  isMultiple: { type: Boolean, default: false },
  points: { type: Number, default: 10 }
}, { _id: false })

const questionBankSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true,
    unique: true
  },
  questions: {
    type: [questionSchema],
    default: []
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

export default mongoose.model("QuestionBank", questionBankSchema)
