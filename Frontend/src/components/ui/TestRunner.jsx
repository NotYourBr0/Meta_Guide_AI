import { useState, useEffect, useCallback } from "react"
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

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  // Calculate points for a question
  const calculateQuestionScore = useCallback((question, selected) => {
    const correct = question.correctAnswers
    if (question.isMultiple) {
      // Partial credit: correct selections / total correct answers * points
      const correctSelected = selected.filter(s => correct.includes(s)).length
      const wrongSelected = selected.filter(s => !correct.includes(s)).length
      if (wrongSelected > 0) return 0 // Penalty for wrong selections
      return Math.round((correctSelected / correct.length) * question.points)
    } else {
      return selected.length === 1 && correct.includes(selected[0]) ? question.points : 0
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (submitted || testComplete) return
    if (timeLeft <= 0) {
      handleSubmitAnswer(true)
      return
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, submitted, testComplete])

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(TIMER_SECONDS[topicLevel] || 30)
    setSelectedAnswers([])
    setSubmitted(false)
  }, [currentIndex, topicLevel])

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

    const earned = timedOut ? 0 : calculateQuestionScore(currentQuestion, selectedAnswers)
    const newScore = score + earned

    const answerRecord = {
      question: currentQuestion.question,
      selected: timedOut ? [] : selectedAnswers,
      correct: currentQuestion.correctAnswers,
      earned,
      maxPoints: currentQuestion.points,
      explanation: currentQuestion.explanation,
      timedOut
    }

    setScore(newScore)
    setAnsweredQuestions(prev => [...prev, answerRecord])

    // If last question, finalize test
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

  const timerPercent = (timeLeft / (TIMER_SECONDS[topicLevel] || 30)) * 100
  const timerColor = timerPercent > 50 ? "#22c55e" : timerPercent > 25 ? "#f59e0b" : "#ef4444"

  // Results Screen
  if (testComplete) {
    const percentage = Math.round((score / maxScore) * 100)
    const appreciation = getAppreciation(percentage)
    const isNewHighScore = scoreResult?.isNewHighScore
    const prevHigh = scoreResult?.previousHighScore ?? previousHighScore ?? 0

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header gradient */}
          <div className={`bg-gradient-to-r ${appreciation.color} p-8 text-center text-white`}>
            <div className="text-6xl mb-3">{appreciation.emoji}</div>
            <h2 className="text-3xl font-bold mb-1">{appreciation.title}</h2>
            <p className="text-white/90 text-sm">{appreciation.message}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Score display */}
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900 dark:text-white mb-1">
                {score}<span className="text-2xl text-gray-400">/{maxScore}</span>
              </div>
              <div className="text-lg text-gray-500 dark:text-gray-400">{percentage}% Score</div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${appreciation.color} transition-all duration-1000`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="text-xl font-bold text-gray-900 dark:text-white">{questions.length}</div>
                <div className="text-xs text-gray-500">Questions</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {answeredQuestions.filter(q => q.earned === q.maxPoints).length}
                </div>
                <div className="text-xs text-gray-500">Perfect</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {answeredQuestions.filter(q => q.timedOut).length}
                </div>
                <div className="text-xs text-gray-500">Timed Out</div>
              </div>
            </div>

            {/* High score badge */}
            {isNewHighScore && (
              <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">New High Score!</div>
                  {prevHigh > 0 && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      Previous best: {prevHigh}/{maxScore} → Now: {score}/{maxScore}
                    </div>
                  )}
                </div>
              </div>
            )}
            {!isNewHighScore && prevHigh > 0 && (
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-3">
                <span className="text-xl">📊</span>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  High Score: <strong>{prevHigh}/{maxScore}</strong> — Keep trying to beat it!
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Question Screen
  const optionLabels = ["A", "B", "C", "D", "E", "F"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/70 p-4 text-white">
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="font-bold text-sm opacity-80">{topicName}</div>
              <div className="text-xs opacity-60 capitalize">{topicLevel} Level</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">Question {currentIndex + 1}/{questions.length}</div>
              <div className="text-xs opacity-70">Score: {score}/{maxScore}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
            <div
              className="h-1.5 bg-white rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            />
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/20 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${timerPercent}%`, backgroundColor: timerColor }}
              />
            </div>
            <div className="text-sm font-mono font-bold min-w-[2.5rem] text-right" style={{ color: timerColor }}>
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4">
            {currentQuestion.isMultiple && (
              <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full mb-2 font-medium">
                ✓ Multiple answers possible
              </span>
            )}
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers.includes(idx)
              const isCorrect = currentQuestion.correctAnswers.includes(idx)

              let optionClass = "border-2 rounded-xl p-3 cursor-pointer transition-all flex items-start gap-3 "

              if (!submitted) {
                optionClass += isSelected
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800"
              } else {
                if (isCorrect && isSelected) optionClass += "border-green-500 bg-green-50 dark:bg-green-900/30"
                else if (isCorrect) optionClass += "border-green-400 bg-green-50/50 dark:bg-green-900/20"
                else if (isSelected && !isCorrect) optionClass += "border-red-500 bg-red-50 dark:bg-red-900/30"
                else optionClass += "border-gray-200 dark:border-gray-700 opacity-60"
              }

              return (
                <div
                  key={idx}
                  className={optionClass}
                  onClick={() => toggleOption(idx)}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    !submitted
                      ? isSelected ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      : isCorrect ? "bg-green-500 text-white" : isSelected ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                  }`}>
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
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Explanation</div>
              <p className="text-sm text-blue-800 dark:text-blue-200">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 flex gap-3">
          {!submitted ? (
            <button
              onClick={() => handleSubmitAnswer(false)}
              disabled={selectedAnswers.length === 0}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                selectedAnswers.length > 0
                  ? "bg-primary text-white hover:opacity-90 shadow-md"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <>
              {!isLastQuestion ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  disabled={submittingScore}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-semibold opacity-90 cursor-default"
                >
                  {submittingScore ? "Saving score..." : "Calculating results..."}
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
