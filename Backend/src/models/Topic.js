import mongoose from "mongoose"

const generationStateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["idle", "queued", "processing", "completed", "failed", "skipped"],
    default: "idle"
  },
  error: {
    type: String,
    default: ""
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

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
  simulationHtml: {
    type: String,
    default: ""
  },
  likedBy: {
    type: [String],
    default: []
  },
  likesCount: {
    type: Number,
    default: 0
  },
  generationStatus: {
    explanation: {
      type: generationStateSchema,
      default: () => ({ status: "idle", error: "", updatedAt: new Date() })
    },
    simulation: {
      type: generationStateSchema,
      default: () => ({ status: "idle", error: "", updatedAt: new Date() })
    },
    questionBank: {
      type: generationStateSchema,
      default: () => ({ status: "idle", error: "", updatedAt: new Date() })
    }
  },
  createdBy: {
    id: String,
    name: String
  }
}, { timestamps: true })

topicSchema.index({ subjectId: 1, likesCount: -1, createdAt: -1 })

export default mongoose.model("Topic", topicSchema)
