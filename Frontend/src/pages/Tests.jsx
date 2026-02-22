import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import { getAllTests } from "../services/api"
import TestStartModal from "../components/ui/TestStartModal"
import RankingsModal from "../components/ui/RankingsModal"
import MetaSpinner from "../components/ui/MetaSpinner"

const LEVEL_COLORS = {
  beginner: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-700" },
  intermediate: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-700" },
  advanced: { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-700" }
}

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }

const Tests = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [generatingId, setGeneratingId] = useState(null) // kept for compat but unused
  const [activeTest, setActiveTest] = useState(null) // topic object to show start modal
  const [rankingsTopic, setRankingsTopic] = useState(null) // topic object for rankings modal

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true)
        const data = await getAllTests()
        setTopics(data)
      } catch (err) {
        setError(err.message || t("tests.error", { message: "Failed to load tests" }))
      } finally {
        setLoading(false)
      }
    }
    fetchTests()
  }, [])

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const matchesLevel = filterLevel === "all" || topic.level === filterLevel
      const q = search.toLowerCase()
      const matchesSearch =
        topic.name.toLowerCase().includes(q) ||
        (topic.createdBy?.name || "").toLowerCase().includes(q) ||
        (topic.subject?.name || "").toLowerCase().includes(q)
      return matchesLevel && matchesSearch
    })
  }, [topics, filterLevel, search])

  const handleStartTest = (topic) => {
    if (!user) return
    setActiveTest(topic)
  }

  const handleTestClose = async () => {
    // Refresh scores after test
    setActiveTest(null)
    try {
      const data = await getAllTests()
      setTopics(data)
    } catch (e) {
      // Silently fail
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <MetaSpinner label="Loading tests…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300">
        <strong>Error:</strong> {error}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t("tests.header.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("tests.header.subtitle")}
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t("tests.search.placeholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="px-4 py-2.5 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">{t("tests.search.levels.all")}</option>
          <option value="beginner">{t("tests.search.levels.beginner")}</option>
          <option value="intermediate">{t("tests.search.levels.intermediate")}</option>
          <option value="advanced">{t("tests.search.levels.advanced")}</option>
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400">
        <span>{filteredTopics.length > 1 ? t("tests.stats.topics_plural", { count: filteredTopics.length }) : t("tests.stats.topics", { count: filteredTopics.length })}</span>
        {user && (
          <span>
            {t("tests.stats.attempted", { count: topics.filter(t => t.highScore > 0).length })}
          </span>
        )}
      </div>

      {/* Topic Cards Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-lg font-medium">{t("tests.empty.title")}</p>
          <p className="text-sm mt-1">{t("tests.empty.subtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map(topic => {
            const levelStyle = LEVEL_COLORS[topic.level] || LEVEL_COLORS.beginner
            const questionCount = QUESTION_COUNTS[topic.level] || 5
            const isGenerating = generatingId === topic._id
            const hasScore = topic.highScore > 0
            const scorePercent = topic.maxScore > 0 ? Math.round((topic.highScore / topic.maxScore) * 100) : 0

            return (
              <div
                key={topic._id}
                className="group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all hover:border-primary/40 cursor-pointer overflow-hidden"
                onClick={() => user && handleStartTest(topic)}
              >
                {/* Decorative gradient blob */}
                <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 ${levelStyle.bg}`} />

                {/* Level badge + rankings button */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${levelStyle.bg} ${levelStyle.text}`}>
                      {topic.level}
                    </span>
                    {/* Rankings button */}
                    <button
                      onClick={e => { e.stopPropagation(); setRankingsTopic(topic) }}
                      title="View Rankings"
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700/50 transition-all font-medium"
                    >
                      🏆 <span>See {t("tests.card.ranks")}</span>
                    </button>
                  </div>
                  {hasScore && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                      <span>⭐</span>
                      <span>{topic.highScore}/{topic.maxScore}</span>
                    </div>
                  )}
                </div>

                {/* Topic name */}
                <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {topic.name}
                </h3>

                {/* Subject */}
                {topic.subject && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                    {topic.subject.name}
                  </p>
                )}

                {/* Creator */}
                <div className="flex items-center gap-1.5 mb-4">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs font-bold">
                    {(topic.createdBy?.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {topic.createdBy?.name || t("tests.unknownCreator")}
                  </span>
                </div>

                {/* Score progress bar */}
                {hasScore && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{t("tests.card.bestScore")}</span>
                      <span>{scorePercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>📝 {t("tests.card.questions", { count: questionCount })}</span>
                    <span>⭐ {t("tests.card.pts", { count: questionCount * 10 })}</span>
                  </div>

                  {!user ? (
                    <span className="text-xs text-gray-400">{t("tests.card.loginToStart")}</span>
                  ) : (
                    <span className="text-xs font-semibold text-primary group-hover:underline">
                      {topic.attemptCount > 0 ? t("tests.card.retry") : t("tests.card.start")}
                    </span>
                  )}
                </div>

                {/* No explanation warning */}
                {!topic.hasExplanation && (
                  <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                    {t("tests.card.noExplanation")}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Test Start Modal */}
      {activeTest && (
        <TestStartModal
          topic={activeTest}
          previousHighScore={activeTest.highScore || 0}
          onClose={async () => {
            setActiveTest(null)
            try { const data = await getAllTests(); setTopics(data) } catch {}
          }}
        />
      )}

      {/* Rankings Modal */}
      {rankingsTopic && (
        <RankingsModal
          topic={rankingsTopic}
          onClose={() => setRankingsTopic(null)}
        />
      )}
    </div>
  )
}

export default Tests
