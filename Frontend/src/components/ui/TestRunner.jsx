import { useState, useEffect, useCallback, useRef } from "react"
import { submitTestScore } from "../../services/api"

const TIMER_SECONDS = {
  beginner: 30,
  intermediate: 30,
  advanced: 45
}

const getAppreciation = (percentage) => {
  if (percentage >= 90) return { emoji: "🏆", title: "Outstanding!", message: "You're a master of this topic! Incredible performance!", color: "from-yellow-400 to-orange-500" }
  if (percentage >= 75) return { emoji: "🌟", title: "Excellent!", message: "Brilliant work! You really know your stuff!", color: "from-green-400 to-emerald-500" }
  if (percentage >= 60) return { emoji: "👍", title: "Good Job!", message: "Nice effort! A little more practice and you'll ace it!", color: "from-blue-400 to-cyan-500" }
  if (percentage >= 40) return { emoji: "📚", title: "Keep Studying!", message: "You're getting there! Review the explanation and try again.", color: "from-purple-400 to-violet-500" }
  return { emoji: "💪", title: "Don't Give Up!", message: "Every expert was once a beginner. Review and try again!", color: "from-red-400 to-pink-500" }
}

// ── SVG circular timer ──────────────────────────────────────────────────────
const TimerRing = ({ timeLeft, maxTime }) => {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const percent = timeLeft / maxTime
  const dashOffset = circumference * (1 - percent)

  const color = percent > 0.5 ? "#22c55e" : percent > 0.25 ? "#f59e0b" : "#ef4444"

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
        <circle
          cx="28" cy="28" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <span className="text-sm font-mono font-extrabold" style={{ color }}>{timeLeft}s</span>
    </div>
  )
}

const optionLabels = ["A", "B", "C", "D", "E", "F"]

const TestRunner = ({ topicId, topicName, topicLevel, questions, maxScore, onClose, previousHighScore }) => {
  const [currentIndex, setCurrentIndex]       = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState([])
  const [submitted, setSubmitted]             = useState(false)
  const [timeLeft, setTimeLeft]               = useState(TIMER_SECONDS[topicLevel] || 30)
  const [score, setScore]                     = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [testComplete, setTestComplete]       = useState(false)
  const [scoreResult, setScoreResult]         = useState(null)
  const [submittingScore, setSubmittingScore] = useState(false)
  const [animateIn, setAnimateIn]             = useState(true)

  const timerMax      = TIMER_SECONDS[topicLevel] || 30
  const currentQuestion = questions[currentIndex]
  const isLastQuestion  = currentIndex === questions.length - 1

  // Calculate points for a question
  const calculateQuestionScore = useCallback((question, selected) => {
    const correct = question.correctAnswers
    if (question.isMultiple) {
      const correctSelected = selected.filter(s => correct.includes(s)).length
      const wrongSelected   = selected.filter(s => !correct.includes(s)).length
      if (wrongSelected > 0) return 0
      return Math.round((correctSelected / correct.length) * question.points)
    } else {
      return selected.length === 1 && correct.includes(selected[0]) ? question.points : 0
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (submitted || testComplete) return
    if (timeLeft <= 0) { handleSubmitAnswer(true); return }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, submitted, testComplete])

  // Reset timer and animate on question change
  useEffect(() => {
    setTimeLeft(timerMax)
    setSelectedAnswers([])
    setSubmitted(false)
    setAnimateIn(false)
    const t = setTimeout(() => setAnimateIn(true), 50)
    return () => clearTimeout(t)
  }, [currentIndex, timerMax])

  const toggleOption = (idx) => {
    if (submitted) return
    if (currentQuestion.isMultiple) {
      setSelectedAnswers(prev =>
        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
      )
    } else {
      setSelectedAnswers([idx])
    }
  }

  const handleSubmitAnswer = async (timedOut = false) => {
    if (submitted) return
    setSubmitted(true)

    const earned   = timedOut ? 0 : calculateQuestionScore(currentQuestion, selectedAnswers)
    const newScore = score + earned

    const answerRecord = {
      question:   currentQuestion.question,
      selected:   timedOut ? [] : selectedAnswers,
      correct:    currentQuestion.correctAnswers,
      earned,
      maxPoints:  currentQuestion.points,
      explanation: currentQuestion.explanation,
      timedOut
    }

    setScore(newScore)
    setAnsweredQuestions(prev => [...prev, answerRecord])

    if (isLastQuestion) {
      setSubmittingScore(true)
      try {
        const result = await submitTestScore(topicId, newScore, maxScore)
        setScoreResult(result)
      } catch (err) {
        console.error("Failed to save score:", err)
        setScoreResult({ highScore: newScore, isNewHighScore: true })
      } finally {
        setSubmittingScore(false)
        setTestComplete(true)
      }
    }
  }

  const handleNext = () => {
    if (!submitted) return
    if (!isLastQuestion) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  // ── Results Screen ──────────────────────────────────────────────────────────
  if (testComplete) {
    const percentage    = Math.round((score / maxScore) * 100)
    const appreciation  = getAppreciation(percentage)
    const isNewHighScore = scoreResult?.isNewHighScore
    const prevHigh      = scoreResult?.previousHighScore ?? previousHighScore ?? 0

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Gradient header */}
          <div className={`bg-gradient-to-br ${appreciation.color} p-8 text-center text-white relative overflow-hidden`}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
            <div className="relative">
              <div className="text-6xl mb-3">{appreciation.emoji}</div>
              <h2 className="text-3xl font-extrabold mb-1">{appreciation.title}</h2>
              <p className="text-white/85 text-sm">{appreciation.message}</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Score display */}
            <div className="text-center">
              <div className="text-5xl font-extrabold text-gray-900 dark:text-white mb-1">
                {score}<span className="text-2xl text-gray-400 font-semibold">/{maxScore}</span>
              </div>
              <div className="text-base text-gray-500 dark:text-gray-400">{percentage}% accuracy</div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${appreciation.color} transition-all duration-1000`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{questions.length}</div>
                <div className="text-xs text-gray-500">Questions</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {answeredQuestions.filter(q => q.earned === q.maxPoints).length}
                </div>
                <div className="text-xs text-gray-500">Perfect</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="text-xl font-bold text-red-500 dark:text-red-400">
                  {answeredQuestions.filter(q => q.timedOut).length}
                </div>
                <div className="text-xs text-gray-500">Timed Out</div>
              </div>
            </div>

            {/* High score notification */}
            {isNewHighScore && (
              <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <div className="font-bold text-yellow-800 dark:text-yellow-300 text-sm">New High Score!</div>
                  {prevHigh > 0 && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      Previous: {prevHigh}/{maxScore} → Now: {score}/{maxScore}
                    </div>
                  )}
                </div>
              </div>
            )}
            {!isNewHighScore && prevHigh > 0 && (
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-2xl p-3">
                <span className="text-xl">📊</span>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Best score: <strong>{prevHigh}/{maxScore}</strong> — keep going!
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-100 dark:to-white text-white dark:text-gray-900 rounded-2xl font-bold hover:opacity-90 transition-opacity shadow-md"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Question Screen ─────────────────────────────────────────────────────────
  const progressPercent = (currentIndex / questions.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            {/* Topic info */}
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">{topicName}</div>
              <div className="text-xs text-white/60 capitalize">{topicLevel} Level</div>
            </div>

            {/* Timer ring */}
            <TimerRing timeLeft={timeLeft} maxTime={timerMax} />

            {/* Score */}
            <div className="text-right">
              <div className="text-sm font-bold">{currentIndex + 1}<span className="text-white/60">/{questions.length}</span></div>
              <div className="text-xs text-white/60">Score: {score}</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── Question + Options ── */}
        <div
          className="flex-1 overflow-y-auto p-5 space-y-4"
          style={{
            opacity: animateIn ? 1 : 0,
            transform: animateIn ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.25s ease, transform 0.25s ease"
          }}
        >
          {/* Question text */}
          <div className="mb-1">
            {currentQuestion.isMultiple && (
              <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full mb-2 font-semibold border border-blue-200 dark:border-blue-700">
                ✦ Select all that apply
              </span>
            )}
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-relaxed">
              Q{currentIndex + 1}. {currentQuestion.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers.includes(idx)
              const isCorrect  = currentQuestion.correctAnswers.includes(idx)

              let base = "relative border-2 rounded-2xl p-3.5 cursor-pointer transition-all duration-150 flex items-center gap-3 group "

              if (!submitted) {
                base += isSelected
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              } else {
                if (isCorrect && isSelected) base += "border-green-500 bg-green-50 dark:bg-green-900/30"
                else if (isCorrect)          base += "border-green-400 bg-green-50/50 dark:bg-green-900/20"
                else if (isSelected)         base += "border-red-500 bg-red-50 dark:bg-red-900/30"
                else                         base += "border-gray-200 dark:border-gray-700 opacity-50"
              }

              // Label badge
              let labelClass = "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-all "
              if (!submitted) {
                labelClass += isSelected
                  ? "bg-indigo-600 text-white scale-110"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600"
              } else {
                labelClass += isCorrect
                  ? "bg-green-500 text-white"
                  : isSelected
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400"
              }

              return (
                <div
                  key={idx}
                  className={base}
                  onClick={() => toggleOption(idx)}
                >
                  <div className={labelClass}>
                    {submitted
                      ? isCorrect ? "✓" : isSelected ? "✗" : optionLabels[idx]
                      : optionLabels[idx]
                    }
                  </div>
                  <span className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{option}</span>
                </div>
              )
            })}
          </div>

          {/* Explanation after submit */}
          {submitted && currentQuestion.explanation && (
            <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 mb-1.5">
                <span>💡</span> Explanation
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          {!submitted ? (
            <button
              onClick={() => handleSubmitAnswer(false)}
              disabled={selectedAnswers.length === 0}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${
                selectedAnswers.length > 0
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-md active:scale-95"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <>
              {!isLastQuestion ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-md active:scale-95"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  disabled={submittingScore}
                  className="flex-1 py-3 bg-green-500 text-white rounded-2xl font-bold text-sm opacity-90 cursor-default"
                >
                  {submittingScore ? "💾 Saving score…" : "✅ Calculating results…"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestRunner
