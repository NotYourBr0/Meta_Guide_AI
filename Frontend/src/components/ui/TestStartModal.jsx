import { useState } from "react"
import SimpleSpinner from "./SimpleSpinner"
import TestRunner from "./TestRunner"
import { getTestQuestions, generateQuestionBank } from "../../services/api"

const LEVEL_COLORS = {
  beginner:     { gradient: "from-emerald-500 to-teal-600",   badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", glow: "shadow-emerald-200 dark:shadow-emerald-900/40" },
  intermediate: { gradient: "from-blue-500 to-cyan-600",      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", glow: "shadow-blue-200 dark:shadow-blue-900/40" },
  advanced:     { gradient: "from-purple-600 to-violet-700",  badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", glow: "shadow-purple-200 dark:shadow-purple-900/40" },
}

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }
const TIMER_SECONDS  = { beginner: 30, intermediate: 30, advanced: 45 }

/**
 * TestStartModal
 * Phase 1 → "preview": shows topic info + "Start Test" button
 * Phase 2 → "loading": fetches random questions from question bank (or generates bank)
 * Phase 3 → "running": renders TestRunner with the fetched questions
 */
const TestStartModal = ({ topic, previousHighScore = 0, onClose }) => {
  const [phase, setPhase]         = useState("preview")  // preview | loading | running
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
    setLoadMsg("Fetching your questions…")

    try {
      // 1. Try to get random questions from the bank
      let data = await getTestQuestions(topic._id)

      // 2. If no bank yet, generate it first then fetch
      if (!data.bankExists) {
        setLoadMsg("Generating your 50-question bank for the first time… (this only happens once)")
        await generateQuestionBank(topic._id)
        setLoadMsg("Bank ready! Picking your questions…")
        data = await getTestQuestions(topic._id)
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions available. Please ensure this topic has an explanation.")
      }

      setTestMeta(data)
      setQuestions(data.questions)
      setPhase("running")
    } catch (err) {
      setError(err.message || "Failed to load questions. Please try again.")
      setPhase("preview")
    }
  }

  // ── Phase: Running ──────────────────────────────────────────────────────────
  if (phase === "running" && questions.length > 0) {
    return (
      <TestRunner
        topicId={topic._id}
        topicName={testMeta?.topicName || topic.name}
        topicLevel={testMeta?.topicLevel || topic.level}
        questions={questions}
        maxScore={testMeta?.maxScore || questions.length * 10}
        previousHighScore={previousHighScore}
        onClose={onClose}
      />
    )
  }

  // ── Phase: Preview or Loading ───────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl ${levelStyle.glow} w-full max-w-md overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Gradient Header ── */}
        <div className={`bg-gradient-to-br ${levelStyle.gradient} p-8 text-center text-white relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />

          <div className="relative">
            <div className="text-5xl mb-3">📝</div>
            <h2 className="text-2xl font-extrabold mb-1 leading-tight">{topic.name}</h2>
            {topic.subject && (
              <p className="text-white/75 text-sm mb-3">{topic.subject.name}</p>
            )}
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full capitalize ${levelStyle.badge}`}>
              {topic.level}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{expectedCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Questions</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{expectedCount * 10}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Max Score</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{timerSeconds}s</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Per Question</div>
            </div>
          </div>

          {/* ── Previous best ── */}
          {previousHighScore > 0 && (
            <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl p-3">
              <span className="text-2xl">⭐</span>
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                Your best: <strong>{previousHighScore}</strong> / {expectedCount * 10}
              </div>
            </div>
          )}

          {/* ── Info box ── */}
          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">How it works</p>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="text-base leading-none">🎲</span>
              <span>Questions are randomly selected from a pool of <strong>50+</strong> each time you play</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="text-base leading-none">✅</span>
              <span>Some questions may require <strong>multiple correct answers</strong></span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="text-base leading-none">⏱️</span>
              <span>Answer within <strong>{timerSeconds} seconds</strong> — time runs out = 0 points</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="text-base leading-none">🏆</span>
              <span>Scores are saved automatically — beat your high score!</span>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
              ⚠️ {error}
            </div>
          )}

          {/* ── Loading state ── */}
          {phase === "loading" && (
            <div className="text-center py-3 space-y-2">
              <SimpleSpinner />
              <p className="text-sm text-gray-500 dark:text-gray-400">{loadMsg}</p>
            </div>
          )}

          {/* ── Actions ── */}
          {phase === "preview" && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className={`flex-1 py-3.5 rounded-2xl bg-gradient-to-r ${levelStyle.gradient} text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg`}
              >
                🚀 Start Test
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestStartModal
