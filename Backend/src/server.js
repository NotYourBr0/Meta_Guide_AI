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


dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CORS configuration to allow credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Serve simulation files
app.use("/simulations", express.static(path.join(__dirname, "../public/simulations")))
app.use("/api/simulation", simulationRoutes)
app.use("/api/subjects", subjectRoutes)
app.use("/api/topics", topicRoutes)
app.use("/api/explanation", explanationRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)


// Test route
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend running" })
})

connectDB()
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
