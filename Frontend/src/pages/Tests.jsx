import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import TestStartModal from "../components/ui/TestStartModal"
import RankingsModal from "../components/ui/RankingsModal"
import SimpleSpinner from "../components/ui/SimpleSpinner"
import { useAuth } from "../context/AuthContext"
import { getAllTests } from "../services/api"

const LEVEL_COLORS = {
  beginner: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300"
  },
  intermediate: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300"
  },
  advanced: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300"
  }
}

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }
const BANK_SIZE = 50

const Tests = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [activeTest, setActiveTest] = useState(null)
  const [rankingsTopic, setRankingsTopic] = useState(null)

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
  }, [t])

  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const matchesLevel = filterLevel === "all" || topic.level === filterLevel
      const query = search.toLowerCase()
      const matchesSearch =
        topic.name.toLowerCase().includes(query) ||
        (topic.createdBy?.name || "").toLowerCase().includes(query) ||
        (topic.subject?.name || "").toLowerCase().includes(query) ||
        (topic.subject?.university || "").toLowerCase().includes(query) ||
        `${topic.subject?.courseCode || ""}`.toLowerCase().includes(query)

      return matchesLevel && matchesSearch
    })
  }, [topics, filterLevel, search])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <SimpleSpinner label="Loading tests..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
        <strong>Error:</strong> {error}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{t("tests.header.title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("tests.header.subtitle")}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t("tests.search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="rounded-xl border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="all">{t("tests.search.levels.all")}</option>
          <option value="beginner">{t("tests.search.levels.beginner")}</option>
          <option value="intermediate">{t("tests.search.levels.intermediate")}</option>
          <option value="advanced">{t("tests.search.levels.advanced")}</option>
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
        <span>
          {filteredTopics.length > 1
            ? t("tests.stats.topics_plural", { count: filteredTopics.length })
            : t("tests.stats.topics", { count: filteredTopics.length })}
        </span>
        {user && (
          <span>{t("tests.stats.attempted", { count: topics.filter((topic) => topic.highScore > 0).length })}</span>
        )}
      </div>

      {filteredTopics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400 dark:border-gray-700 dark:text-gray-600">
          <p className="text-lg font-medium">{t("tests.empty.title")}</p>
          <p className="mt-1 text-sm">{t("tests.empty.subtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTopics.map((topic) => {
            const levelStyle = LEVEL_COLORS[topic.level] || LEVEL_COLORS.beginner
            const questionCount = QUESTION_COUNTS[topic.level] || 5

            return (
              <div
                key={topic._id}
                className="group flex min-h-[250px] cursor-pointer flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                onClick={() => user && setActiveTest(topic)}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${levelStyle.bg} ${levelStyle.text}`}>
                      {topic.level}
                    </span>
                    {topic.hasQuestionBank && (
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 dark:border-indigo-700/50 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {BANK_SIZE} question bank
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRankingsTopic(topic)
                    }}
                    title="View Rankings"
                    className="shrink-0 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {t("tests.card.ranks")}
                  </button>
                </div>

                <h3 className="mb-1 line-clamp-2 text-base font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                  {topic.name}
                </h3>

                {topic.subject && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {topic.subject.name}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                      {(topic.subject.university || "RTU")} | Semester {topic.subject.semester || "?"}
                      {topic.subject.courseCode ? ` | ${topic.subject.courseCode}` : ""}
                    </p>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-white">
                    {(topic.createdBy?.name || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {topic.createdBy?.name || t("tests.unknownCreator")}
                  </span>
                </div>

                <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span>{t("tests.card.questions", { count: questionCount })}</span>
                    <span>{t("tests.card.pts", { count: questionCount * 10 })}</span>
                  </div>

                  {!user ? (
                    <span className="text-xs text-gray-400">{t("tests.card.loginToStart")}</span>
                  ) : (
                    <span className="text-xs font-semibold text-primary group-hover:underline">
                      {topic.attemptCount > 0 ? t("tests.card.retry") : t("tests.card.start")}
                    </span>
                  )}
                </div>

                {!topic.hasExplanation && (
                  <div className="mt-3 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                    {t("tests.card.noExplanation")}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeTest && (
        <TestStartModal
          topic={activeTest}
          onClose={async () => {
            setActiveTest(null)
            try {
              const data = await getAllTests()
              setTopics(data)
            } catch {
              // ignore refresh failures after closing the modal
            }
          }}
        />
      )}

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
