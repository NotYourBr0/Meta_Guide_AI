import { useState } from "react"
import SimpleSpinner from "./SimpleSpinner"
import TestRunner from "./TestRunner"
import { getTestQuestions, generateQuestionBank } from "../../services/api"

const LEVEL_COLORS = {
  beginner:     { gradient: "from-emerald-500 to-teal-600",  badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", glow: "shadow-emerald-200 dark:shadow-emerald-900/40" },
  intermediate: { gradient: "from-blue-500 to-cyan-600",     badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",             glow: "shadow-blue-200 dark:shadow-blue-900/40" },
  advanced:     { gradient: "from-purple-600 to-violet-700", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",       glow: "shadow-purple-200 dark:shadow-purple-900/40" },
}

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }
const TIMER_SECONDS   = { beginner: 30, intermediate: 30, advanced: 45 }

const TestStartModal = ({ topic, onClose }) => {
  const [phase, setPhase]         = useState("preview")
  const [questions, setQuestions] = useState([])
  const [testMeta, setTestMeta]   = useState(null)
  const [loadMsg, setLoadMsg]     = useState("")
  const [error, setError]         = useState(null)

  const levelStyle    = LEVEL_COLORS[topic.level] || LEVEL_COLORS.beginner
  const expectedCount = QUESTION_COUNTS[topic.level] || 5
  const timerSeconds  = TIMER_SECONDS[topic.level] || 30

  const handleStart = async () => {
    setPhase("loading")
    setError(null)
    setLoadMsg("Fetching questions…")

    try {
      let data = await getTestQuestions(topic._id)

      if (!data.bankExists) {
        setLoadMsg("Generating question bank… (one-time setup)")
        await generateQuestionBank(topic._id)
        setLoadMsg("Almost ready…")
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div
        className={`bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl ${levelStyle.glow} w-full sm:max-w-sm overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className={`bg-gradient-to-br ${levelStyle.gradient} px-6 py-7 text-center text-white relative overflow-hidden`}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative">
            <div className="text-4xl mb-2">📝</div>
            <h2 className="text-xl font-extrabold leading-tight line-clamp-2">{topic.name}</h2>
            {topic.subject && (
              <p className="text-white/70 text-xs mt-1">{topic.subject.name}</p>
            )}
            <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full capitalize ${levelStyle.badge}`}>
              {topic.level}
            </span>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xl font-extrabold text-gray-900 dark:text-white">{expectedCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">Questions</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xl font-extrabold text-gray-900 dark:text-white">{expectedCount * 10}</div>
              <div className="text-xs text-gray-500 mt-0.5">Max Score</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-xl font-extrabold text-gray-900 dark:text-white">{timerSeconds}s</div>
              <div className="text-xs text-gray-500 mt-0.5">Per Q</div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {phase === "loading" && (
            <div className="text-center py-2 space-y-2">
              <SimpleSpinner />
              <p className="text-sm text-gray-500 dark:text-gray-400">{loadMsg}</p>
            </div>
          )}

          {/* Actions */}
          {phase === "preview" && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className={`flex-1 py-3 rounded-2xl bg-gradient-to-r ${levelStyle.gradient} text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg`}
              >
                🚀 Start
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestStartModal
