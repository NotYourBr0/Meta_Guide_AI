import { useCallback, useEffect, useState } from "react"
import { submitTestScore } from "../../services/api"

const TIMER_SECONDS = {
  beginner: 30,
  intermediate: 30,
  advanced: 45
}

const getResultTone = (percentage) => {
  if (percentage >= 90) {
    return {
      title: "Outstanding",
      message: "You have a strong command of this topic.",
      color: "from-yellow-400 to-orange-500"
    }
  }

  if (percentage >= 75) {
    return {
      title: "Strong Work",
      message: "You handled this test well.",
      color: "from-green-400 to-emerald-500"
    }
  }

  if (percentage >= 60) {
    return {
      title: "Good Progress",
      message: "A little more review should move this up quickly.",
      color: "from-blue-400 to-cyan-500"
    }
  }

  if (percentage >= 40) {
    return {
      title: "Needs Review",
      message: "Revisit the explanation and try again.",
      color: "from-purple-400 to-violet-500"
    }
  }

  return {
    title: "Try Again",
    message: "Use the explanation, then take another pass.",
    color: "from-red-400 to-pink-500"
  }
}

const TimerRing = ({ timeLeft, maxTime }) => {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const percent = timeLeft / maxTime
  const dashOffset = circumference * (1 - percent)
  const color = percent > 0.5 ? "#22c55e" : percent > 0.25 ? "#f59e0b" : "#ef4444"

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
        <circle
          cx="28"
          cy="28"
          r={radius}
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS[topicLevel] || 30)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [testComplete, setTestComplete] = useState(false)
  const [scoreResult, setScoreResult] = useState(null)
  const [submittingScore, setSubmittingScore] = useState(false)
  const [animateIn, setAnimateIn] = useState(true)

  const timerMax = TIMER_SECONDS[topicLevel] || 30
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const calculateQuestionScore = useCallback((question, selected) => {
    const correct = question.correctAnswers

    if (question.isMultiple) {
      const correctSelected = selected.filter((answer) => correct.includes(answer)).length
      const wrongSelected = selected.filter((answer) => !correct.includes(answer)).length

      if (wrongSelected > 0) {
        return 0
      }

      return Math.round((correctSelected / correct.length) * question.points)
    }

    return selected.length === 1 && correct.includes(selected[0]) ? question.points : 0
  }, [])

  useEffect(() => {
    if (submitted || testComplete) {
      return
    }

    if (timeLeft <= 0) {
      handleSubmitAnswer(true)
      return
    }

    const timer = setTimeout(() => setTimeLeft((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, submitted, testComplete])

  useEffect(() => {
    setTimeLeft(timerMax)
    setSelectedAnswers([])
    setSubmitted(false)
    setAnimateIn(false)
    const timeoutId = setTimeout(() => setAnimateIn(true), 50)
    return () => clearTimeout(timeoutId)
  }, [currentIndex, timerMax])

  const toggleOption = (index) => {
    if (submitted) {
      return
    }

    if (currentQuestion.isMultiple) {
      setSelectedAnswers((previous) =>
        previous.includes(index) ? previous.filter((value) => value !== index) : [...previous, index]
      )
      return
    }

    setSelectedAnswers([index])
  }

  const handleSubmitAnswer = async (timedOut = false) => {
    if (submitted) {
      return
    }

    setSubmitted(true)

    const earned = timedOut ? 0 : calculateQuestionScore(currentQuestion, selectedAnswers)
    const nextScore = score + earned

    const answerRecord = {
      question: currentQuestion.question,
      selected: timedOut ? [] : selectedAnswers,
      correct: currentQuestion.correctAnswers,
      earned,
      maxPoints: currentQuestion.points,
      explanation: currentQuestion.explanation,
      timedOut
    }

    setScore(nextScore)
    setAnsweredQuestions((previous) => [...previous, answerRecord])

    if (!isLastQuestion) {
      return
    }

    setSubmittingScore(true)
    try {
      const result = await submitTestScore(topicId, nextScore, maxScore)
      setScoreResult(result)

      if (result.isNewHighScore) {
        window.dispatchEvent(new CustomEvent("leaderboard-updated"))
      }
    } catch (err) {
      console.error("Failed to save score:", err)
      setScoreResult({ highScore: nextScore, isNewHighScore: true })
    } finally {
      setSubmittingScore(false)
      setTestComplete(true)
    }
  }

  const handleNext = () => {
    if (submitted && !isLastQuestion) {
      setCurrentIndex((value) => value + 1)
    }
  }

  if (testComplete) {
    const percentage = Math.round((score / maxScore) * 100)
    const tone = getResultTone(percentage)
    const isNewHighScore = scoreResult?.isNewHighScore
    const previousBest = scoreResult?.previousHighScore ?? previousHighScore ?? 0

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
          <div className={`bg-gradient-to-br ${tone.color} relative overflow-hidden p-6 text-white sm:p-8`}>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">Test Complete</div>
              <h2 className="mt-3 text-3xl font-extrabold">{tone.title}</h2>
              <p className="mt-2 text-sm text-white/85">{tone.message}</p>
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="text-center">
              <div className="mb-1 text-5xl font-extrabold text-gray-900 dark:text-white">
                {score}
                <span className="text-2xl font-semibold text-gray-400">/{maxScore}</span>
              </div>
              <div className="text-base text-gray-500 dark:text-gray-400">{percentage}% accuracy</div>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${tone.color} transition-all duration-1000`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{questions.length}</div>
                <div className="text-xs text-gray-500">Questions</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {answeredQuestions.filter((question) => question.earned === question.maxPoints).length}
                </div>
                <div className="text-xs text-gray-500">Perfect</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="text-xl font-bold text-red-500 dark:text-red-400">
                  {answeredQuestions.filter((question) => question.timedOut).length}
                </div>
                <div className="text-xs text-gray-500">Timed Out</div>
              </div>
            </div>

            {isNewHighScore && (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900/30">
                <div className="text-sm font-bold text-yellow-800 dark:text-yellow-300">New high score</div>
                {previousBest > 0 && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    Previous: {previousBest}/{maxScore} | Current: {score}/{maxScore}
                  </div>
                )}
              </div>
            )}

            {!isNewHighScore && previousBest > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Best score: <strong>{previousBest}/{maxScore}</strong>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 py-3.5 font-bold text-white shadow-md transition-opacity hover:opacity-90 dark:from-gray-100 dark:to-white dark:text-gray-900"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    )
  }

  const progressPercent = (currentIndex / questions.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-4 text-white">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{topicName}</div>
              <div className="text-xs capitalize text-white/60">{topicLevel} level</div>
            </div>

            <TimerRing timeLeft={timeLeft} maxTime={timerMax} />

            <div className="text-right">
              <div className="text-sm font-bold">
                {currentIndex + 1}
                <span className="text-white/60">/{questions.length}</span>
              </div>
              <div className="text-xs text-white/60">Score: {score}</div>
            </div>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-1.5 rounded-full bg-white transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div
          className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
          style={{
            opacity: animateIn ? 1 : 0,
            transform: animateIn ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.25s ease, transform 0.25s ease"
          }}
        >
          <div className="mb-1">
            {currentQuestion.isMultiple && (
              <span className="mb-2 inline-block rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                Select all that apply
              </span>
            )}
            <h3 className="text-base font-bold leading-relaxed text-gray-900 dark:text-white">
              Q{currentIndex + 1}. {currentQuestion.question}
            </h3>
          </div>

          <div className="space-y-2.5">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers.includes(index)
              const isCorrect = currentQuestion.correctAnswers.includes(index)

              let cardClass = "group relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition-all duration-150 "

              if (!submitted) {
                cardClass += isSelected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm dark:bg-indigo-900/30"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-indigo-600 dark:hover:bg-gray-800"
              } else if (isCorrect && isSelected) {
                cardClass += "border-green-500 bg-green-50 dark:bg-green-900/30"
              } else if (isCorrect) {
                cardClass += "border-green-400 bg-green-50/50 dark:bg-green-900/20"
              } else if (isSelected) {
                cardClass += "border-red-500 bg-red-50 dark:bg-red-900/30"
              } else {
                cardClass += "border-gray-200 opacity-50 dark:border-gray-700"
              }

              let labelClass = "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-extrabold transition-all "

              if (!submitted) {
                labelClass += isSelected
                  ? "scale-110 bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:bg-gray-700 dark:text-gray-400 dark:group-hover:bg-indigo-900/30"
              } else if (isCorrect) {
                labelClass += "bg-green-500 text-white"
              } else if (isSelected) {
                labelClass += "bg-red-500 text-white"
              } else {
                labelClass += "bg-gray-100 text-gray-400 dark:bg-gray-700"
              }

              return (
                <div
                  key={index}
                  className={cardClass}
                  onClick={() => toggleOption(index)}
                >
                  <div className={labelClass}>
                    {submitted ? (isCorrect ? "OK" : isSelected ? "NO" : optionLabels[index]) : optionLabels[index]}
                  </div>
                  <span className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">{option}</span>
                </div>
              )
            })}
          </div>

          {submitted && currentQuestion.explanation && (
            <div className="mt-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-700/50 dark:bg-blue-900/20">
              <div className="mb-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">Explanation</div>
              <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 p-4 dark:border-gray-800">
          {!submitted ? (
            <button
              onClick={() => handleSubmitAnswer(false)}
              disabled={selectedAnswers.length === 0}
              className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-all ${
                selectedAnswers.length > 0
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:opacity-90 active:scale-[0.99]"
                  : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}
            >
              Submit Answer
            </button>
          ) : !isLastQuestion ? (
            <button
              onClick={handleNext}
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.99]"
            >
              Next Question
            </button>
          ) : (
            <button
              disabled={submittingScore}
              className="flex-1 cursor-default rounded-2xl bg-green-500 py-3 text-sm font-bold text-white opacity-90"
            >
              {submittingScore ? "Saving score..." : "Calculating results..."}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestRunner
