import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import TestStartModal from "../components/ui/TestStartModal"
import RankingsModal from "../components/ui/RankingsModal"
import SimpleSpinner from "../components/ui/SimpleSpinner"
import { useAuth } from "../context/AuthContext"
import { getAllTests } from "../services/api"

const LEVEL_STYLES = {
  beginner: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300",
  intermediate: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-300",
  advanced: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300"
}

const QUESTION_COUNTS = { beginner: 5, intermediate: 5, advanced: 10 }
const BANK_SIZE = 20

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("tests.header.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("tests.header.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t("tests.search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="all">{t("tests.search.levels.all")}</option>
          <option value="beginner">{t("tests.search.levels.beginner")}</option>
          <option value="intermediate">{t("tests.search.levels.intermediate")}</option>
          <option value="advanced">{t("tests.search.levels.advanced")}</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
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
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <p className="text-lg font-medium">{t("tests.empty.title")}</p>
          <p className="mt-1 text-sm">{t("tests.empty.subtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTopics.map((topic) => {
            const levelStyle = LEVEL_STYLES[topic.level] || LEVEL_STYLES.beginner
            const questionCount = QUESTION_COUNTS[topic.level] || 5

            return (
              <div
                key={topic._id}
                className="flex min-h-[240px] flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-primary/40 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${levelStyle}`}>
                      {topic.level}
                    </span>
                    {topic.hasQuestionBank && (
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {BANK_SIZE} question bank
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRankingsTopic(topic)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t("tests.card.ranks")}
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">
                    {topic.name}
                  </h3>
                  {topic.subject && (
                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <p>{topic.subject.name}</p>
                      <p>
                        {(topic.subject.university || "RTU")} | Semester {topic.subject.semester || "?"}
                        {topic.subject.courseCode ? ` | ${topic.subject.courseCode}` : ""}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    {(topic.createdBy?.name || "U")[0].toUpperCase()}
                  </div>
                  <span>{topic.createdBy?.name || t("tests.unknownCreator")}</span>
                </div>

                <div className="mt-auto space-y-3 border-t border-gray-100 pt-4 text-xs dark:border-gray-800">
                  <div className="flex flex-wrap gap-3 text-gray-500 dark:text-gray-400">
                    <span>{t("tests.card.questions", { count: questionCount })}</span>
                    <span>{t("tests.card.pts", { count: questionCount * 10 })}</span>
                  </div>

                  {!topic.hasExplanation && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                      {t("tests.card.noExplanation")}
                    </div>
                  )}

                  {!user ? (
                    <p className="text-gray-500 dark:text-gray-400">{t("tests.card.loginToStart")}</p>
                  ) : (
                    <button
                      type="button"
                      disabled={!topic.hasExplanation}
                      onClick={() => setActiveTest(topic)}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        topic.hasExplanation
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                      }`}
                    >
                      {topic.attemptCount > 0 ? t("tests.card.retry") : t("tests.card.start")}
                    </button>
                  )}
                </div>
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
