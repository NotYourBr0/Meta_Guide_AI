import { useState } from "react"
import { generateQuestionBank, getTestQuestions } from "../../services/api"
import SimpleSpinner from "./SimpleSpinner"
import TestRunner from "./TestRunner"

const LEVEL_COLORS = {
  beginner: {
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    glow: "shadow-emerald-200 dark:shadow-emerald-900/40"
  },
  intermediate: {
    gradient: "from-blue-500 to-cyan-600",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    glow: "shadow-blue-200 dark:shadow-blue-900/40"
  },
  advanced: {
    gradient: "from-purple-600 to-violet-700",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    glow: "shadow-purple-200 dark:shadow-purple-900/40"
  }
}

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }
const TIMER_SECONDS = { beginner: 30, intermediate: 30, advanced: 45 }

const TestStartModal = ({ topic, onClose }) => {
  const [phase, setPhase] = useState("preview")
  const [questions, setQuestions] = useState([])
  const [testMeta, setTestMeta] = useState(null)
  const [loadMsg, setLoadMsg] = useState("")
  const [error, setError] = useState(null)

  const levelStyle = LEVEL_COLORS[topic.level] || LEVEL_COLORS.beginner
  const expectedCount = QUESTION_COUNTS[topic.level] || 5
  const timerSeconds = TIMER_SECONDS[topic.level] || 30

  const handleStart = async () => {
    setPhase("loading")
    setError(null)
    setLoadMsg("Fetching questions...")

    try {
      let data = await getTestQuestions(topic._id)

      if (!data.bankExists) {
        setLoadMsg("Generating question bank...")
        await generateQuestionBank(topic._id)
        setLoadMsg("Finalizing test setup...")
        data = await getTestQuestions(topic._id)
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions available. Make sure this topic has an explanation.")
      }

      setTestMeta(data)
      setQuestions(data.questions)
      setPhase("running")
    } catch (err) {
      setError(err.message || "Failed to load questions. Please try again.")
      setPhase("preview")
    }
  }

  if (phase === "running" && questions.length > 0) {
    return (
      <TestRunner
        topicId={topic._id}
        topicName={testMeta?.topicName || topic.name}
        topicLevel={testMeta?.topicLevel || topic.level}
        questions={questions}
        maxScore={testMeta?.maxScore || questions.length * 10}
        previousHighScore={topic.highScore || 0}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl ${levelStyle.glow} sm:max-w-lg sm:rounded-3xl dark:bg-gray-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-br ${levelStyle.gradient} relative overflow-hidden px-5 py-6 text-white sm:px-6 sm:py-7`}>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Test Preview
            </div>
            <h2 className="mt-2 text-xl font-extrabold leading-tight sm:text-2xl">{topic.name}</h2>
            {topic.subject && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-white/80">{topic.subject.name}</p>
                <p className="text-xs text-white/65">
                  {(topic.subject.university || "RTU")} | Semester {topic.subject.semester || "?"}
                  {topic.subject.courseCode ? ` | ${topic.subject.courseCode}` : ""}
                </p>
              </div>
            )}
            <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${levelStyle.badge}`}>
              {topic.level}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-4 py-5 sm:px-5">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-lg font-extrabold text-gray-900 dark:text-white sm:text-xl">{expectedCount}</div>
              <div className="mt-0.5 text-xs text-gray-500">Questions</div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-lg font-extrabold text-gray-900 dark:text-white sm:text-xl">{expectedCount * 10}</div>
              <div className="mt-0.5 text-xs text-gray-500">Max Score</div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className="text-lg font-extrabold text-gray-900 dark:text-white sm:text-xl">{timerSeconds}s</div>
              <div className="mt-0.5 text-xs text-gray-500">Per Question</div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {phase === "loading" && (
            <div className="space-y-2 py-2 text-center">
              <SimpleSpinner />
              <p className="text-sm text-gray-500 dark:text-gray-400">{loadMsg}</p>
            </div>
          )}

          {phase === "preview" && (
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className={`flex-1 rounded-2xl bg-gradient-to-r ${levelStyle.gradient} py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.99]`}
              >
                Start Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestStartModal
