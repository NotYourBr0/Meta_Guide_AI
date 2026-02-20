import mongoose from "mongoose"

const testSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Topic",
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  highScore: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    default: 0
  },
  attemptCount: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// Compound index: one record per user per topic
testSchema.index({ topicId: 1, userId: 1 }, { unique: true })

export default mongoose.model("Test", testSchema)
