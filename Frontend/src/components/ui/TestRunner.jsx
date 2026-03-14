import { useCallback, useEffect, useState } from "react"
import { submitTestScore } from "../../services/api"

const TIMER_SECONDS = {
  beginner: 30,
  intermediate: 30,
  advanced: 45
}

const optionLabels = ["A", "B", "C", "D", "E", "F"]

const getResultTone = (percentage) => {
  if (percentage >= 90) {
    return {
      title: "Outstanding",
      message: "You have a strong command of this topic.",
      accent: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-900/60"
    }
  }

  if (percentage >= 75) {
    return {
      title: "Strong Work",
      message: "You handled this test well.",
      accent: "text-sky-600 dark:text-sky-400",
      border: "border-sky-200 dark:border-sky-900/60"
    }
  }

  if (percentage >= 60) {
    return {
      title: "Good Progress",
      message: "A little more review should move this up quickly.",
      accent: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-900/60"
    }
  }

  return {
    title: "Needs Review",
    message: "Revisit the explanation and try again.",
    accent: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-900/60"
  }
}

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className={`w-full max-w-lg rounded-2xl border bg-white dark:bg-gray-900 ${tone.border}`}>
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
              Test Complete
            </p>
            <h2 className={`mt-2 text-2xl font-semibold ${tone.accent}`}>{tone.title}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tone.message}</p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="text-center">
              <div className="text-4xl font-semibold text-gray-900 dark:text-white">
                {score}
                <span className="ml-1 text-xl text-gray-400">/ {maxScore}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{percentage}% accuracy</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{questions.length}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Questions</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {answeredQuestions.filter((question) => question.earned === question.maxPoints).length}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Perfect</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {answeredQuestions.filter((question) => question.timedOut).length}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Timed Out</div>
              </div>
            </div>

            {isNewHighScore && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                New high score
                {previousBest > 0 && (
                  <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                    Previous: {previousBest}/{maxScore}
                  </span>
                )}
              </div>
            )}

            {!isNewHighScore && previousBest > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                Best score: <strong>{previousBest}/{maxScore}</strong>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    )
  }

  const progressPercent = ((currentIndex + (submitted ? 1 : 0)) / questions.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-gray-900 dark:text-white">{topicName}</div>
              <div className="mt-1 text-xs capitalize text-gray-500 dark:text-gray-400">{topicLevel} level</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">
                {timeLeft}s
              </div>
              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <div>
                  {currentIndex + 1}/{questions.length}
                </div>
                <div>Score: {score}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
          <div>
            {currentQuestion.isMultiple && (
              <span className="mb-3 inline-block rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300">
                Select all that apply
              </span>
            )}
            <h3 className="text-base font-semibold leading-relaxed text-gray-900 dark:text-white">
              Q{currentIndex + 1}. {currentQuestion.question}
            </h3>
          </div>

          <div className="space-y-2.5">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers.includes(index)
              const isCorrect = currentQuestion.correctAnswers.includes(index)

              let cardClass = "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors "
              let labelClass = "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold "

              if (!submitted) {
                cardClass += isSelected
                  ? "border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                labelClass += isSelected
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
              } else if (isCorrect && isSelected) {
                cardClass += "border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                labelClass += "border-emerald-500 bg-emerald-500 text-white"
              } else if (isCorrect) {
                cardClass += "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                labelClass += "border-emerald-500 text-emerald-700 dark:text-emerald-300"
              } else if (isSelected) {
                cardClass += "border-rose-300 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30"
                labelClass += "border-rose-500 bg-rose-500 text-white"
              } else {
                cardClass += "border-gray-200 opacity-60 dark:border-gray-700"
                labelClass += "border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500"
              }

              return (
                <button
                  key={index}
                  type="button"
                  className={cardClass}
                  onClick={() => toggleOption(index)}
                >
                  <div className={labelClass}>
                    {submitted ? (isCorrect ? "OK" : isSelected ? "NO" : optionLabels[index]) : optionLabels[index]}
                  </div>
                  <span className="text-left text-sm leading-relaxed text-gray-800 dark:text-gray-200">{option}</span>
                </button>
              )
            })}
          </div>

          {submitted && currentQuestion.explanation && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                Explanation
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 p-4 dark:border-gray-800">
          {!submitted ? (
            <button
              type="button"
              onClick={() => handleSubmitAnswer(false)}
              disabled={selectedAnswers.length === 0}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                selectedAnswers.length > 0
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              Submit Answer
            </button>
          ) : !isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Next Question
            </button>
          ) : (
            <button
              type="button"
              disabled={submittingScore}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
