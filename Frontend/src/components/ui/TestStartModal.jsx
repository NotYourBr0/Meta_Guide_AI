import { useState } from "react"
import { generateQuestionBank, getTestQuestions } from "../../services/api"
import SimpleSpinner from "./SimpleSpinner"
import TestRunner from "./TestRunner"

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }
const TIMER_SECONDS = { beginner: 30, intermediate: 30, advanced: 45 }

const TestStartModal = ({ topic, onClose }) => {
  const [phase, setPhase] = useState("preview")
  const [questions, setQuestions] = useState([])
  const [testMeta, setTestMeta] = useState(null)
  const [loadMsg, setLoadMsg] = useState("")
  const [error, setError] = useState(null)

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div
        className="w-full rounded-t-3xl border border-gray-200 bg-white sm:max-w-lg sm:rounded-2xl dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
            Test Preview
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{topic.name}</h2>
          {topic.subject && (
            <div className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
              <p>{topic.subject.name}</p>
              <p>
                {(topic.subject.university || "RTU")} | Semester {topic.subject.semester || "?"}
                {topic.subject.courseCode ? ` | ${topic.subject.courseCode}` : ""}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-800 dark:bg-gray-950">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{expectedCount}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Questions</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-800 dark:bg-gray-950">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{expectedCount * 10}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Max Score</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-800 dark:bg-gray-950">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{timerSeconds}s</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Per Question</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="rounded-full border border-gray-200 px-2.5 py-1 capitalize dark:border-gray-700">
              {topic.level}
            </span>
            <span>Questions are drawn from the saved bank for this topic.</span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {phase === "loading" && (
            <div className="space-y-2 py-4 text-center">
              <SimpleSpinner />
              <p className="text-sm text-gray-500 dark:text-gray-400">{loadMsg}</p>
            </div>
          )}

          {phase === "preview" && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStart}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
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
