import { useState, useEffect, useRef } from "react"
import MetaSpinner from "./MetaSpinner"
import TestRunner from "./TestRunner"

const API_BASE = import.meta.env.VITE_API_BASE_URL

const LEVEL_COLORS = {
  beginner:     { gradient: "from-emerald-500 to-teal-600",   badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  intermediate: { gradient: "from-blue-500 to-cyan-600",      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  advanced:     { gradient: "from-purple-600 to-violet-700",  badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
}

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }

/**
 * TestStartModal
 * Shows topic info + "Start Test" button.
 * On start → opens SSE stream to /api/tests/stream/:topicId
 * Questions appear one-by-one and TestRunner is launched once enough arrive.
 */
const TestStartModal = ({ topic, previousHighScore = 0, onClose }) => {
  const [phase, setPhase] = useState("preview")  // preview | loading | running
  const [questions, setQuestions] = useState([])
  const [streamMeta, setStreamMeta] = useState(null)  // { topicName, topicLevel, maxScore, totalExpected }
  const [streamError, setStreamError] = useState(null)
  const [receivedCount, setReceivedCount] = useState(0)
  const eventSourceRef = useRef(null)

  const levelStyle = LEVEL_COLORS[topic.level] || LEVEL_COLORS.beginner
  const expectedCount = QUESTION_COUNTS[topic.level] || 5

  // Cleanup on unmount
  useEffect(() => () => eventSourceRef.current?.close(), [])

  const handleStart = () => {
    setPhase("loading")
    setQuestions([])
    setStreamError(null)
    setReceivedCount(0)

    const token = localStorage.getItem("token")
    // Use fetch + ReadableStream instead of EventSource so we can send auth header
    const ctrl = new AbortController()

    fetch(`${API_BASE}/api/tests/stream/${topic._id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = ""

        const collected = []

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          sseBuffer += decoder.decode(value, { stream: true })
          const lines = sseBuffer.split("\n")
          sseBuffer = lines.pop()

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const raw = line.slice(6).trim()
            if (!raw) continue
            try {
              const msg = JSON.parse(raw)
              if (msg.type === "meta") {
                setStreamMeta(msg)
              } else if (msg.type === "question") {
                collected.push(msg.question)
                setQuestions([...collected])
                setReceivedCount(collected.length)

                // Launch test runner as soon as all expected questions arrive
                if (collected.length >= (msg.question ? expectedCount : 1)) {
                  // keep reading to get done event but UI can switch
                }
              } else if (msg.type === "done") {
                // All done — ensure test runner launches with final set
                setQuestions([...collected])
                setPhase("running")
              } else if (msg.type === "error") {
                throw new Error(msg.message)
              }
            } catch (e) {
              if (e.message && !e.message.includes("JSON")) {
                setStreamError(e.message)
                setPhase("preview")
              }
            }
          }
        }

        // If stream ended without a 'done' event but we have questions
        if (collected.length > 0 && phase !== "running") {
          setPhase("running")
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setStreamError("Failed to generate test: " + err.message)
          setPhase("preview")
        }
      })

    eventSourceRef.current = { close: () => ctrl.abort() }
  }

  /* ── Launch TestRunner once conditions met ───────────────── */
  useEffect(() => {
    if (phase === "loading" && questions.length >= expectedCount) {
      setPhase("running")
    }
  }, [questions, phase, expectedCount])

  if (phase === "running" && questions.length > 0) {
    return (
      <TestRunner
        topicId={topic._id}
        topicName={streamMeta?.topicName || topic.name}
        topicLevel={streamMeta?.topicLevel || topic.level}
        questions={questions}
        maxScore={streamMeta?.maxScore || questions.length * 10}
        previousHighScore={previousHighScore}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${levelStyle.gradient} p-8 text-center text-white`}>
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-2xl font-bold mb-1">{topic.name}</h2>
          {topic.subject && (
            <p className="text-white/80 text-sm">{topic.subject.name}</p>
          )}
          <span className={`mt-3 inline-block text-xs font-semibold px-3 py-1 rounded-full capitalize ${levelStyle.badge}`}>
            {topic.level}
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <div className="text-xl font-bold text-gray-900 dark:text-white">{expectedCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Questions</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <div className="text-xl font-bold text-gray-900 dark:text-white">{expectedCount * 10}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Max Score</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {topic.level === "advanced" ? "45s" : "30s"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Per Q</div>
            </div>
          </div>

          {/* Your best */}
          {previousHighScore > 0 && (
            <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
              <span className="text-xl">⭐</span>
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                Your best: <strong>{previousHighScore}</strong> / {expectedCount * 10}
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Some questions may have multiple correct answers</p>
            <p>• Timer runs per question — don't let it expire!</p>
            <p>• Scores are submitted automatically at the end</p>
          </div>

          {streamError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
              {streamError}
            </div>
          )}

          {/* Loading state: questions streaming in */}
          {phase === "loading" && (
            <div className="text-center space-y-2">
              <MetaSpinner label="Generating your questions…" />
              {receivedCount > 0 && (
                <p className="text-xs text-gray-400">
                  {receivedCount} / {expectedCount} questions ready…
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {phase === "preview" && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${levelStyle.gradient} text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-md`}
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
