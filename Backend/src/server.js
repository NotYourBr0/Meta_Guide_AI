import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import adminRoutes from "./routes/adminRoutes.js"
import { connectDB } from "./config/db.js"
import simulationRoutes from "./routes/simulationRoutes.js"
import subjectRoutes from "./routes/subjectRoutes.js"
import topicRoutes from "./routes/topicRoutes.js"
import { fileURLToPath } from "url"
import explanationRoutes from "./routes/explanationRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import testRoutes from "./routes/testRoutes.js"
import assistantRoutes from "./routes/assistantRoutes.js"


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CORS configuration to allow credentials
const allowedOrigins = [
  "https://metaguideai.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}))

// Handle preflight requests for all routes
app.options("*", cors())
app.use(express.json())

// Serve simulation files
app.use("/simulations", express.static(path.join(__dirname, "../public/simulations")))
app.use("/api/simulation", simulationRoutes)
app.use("/api/subjects", subjectRoutes)
app.use("/api/topics", topicRoutes)
app.use("/api/explanation", explanationRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/tests", testRoutes)
app.use("/api/assistant", assistantRoutes)


// Test route
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running" })
})

connectDB()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
