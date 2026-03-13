import { useCallback, useEffect, useRef, useState } from "react"
import "katex/dist/katex.min.css"
import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import SimpleSpinner from "../components/ui/SimpleSpinner"
import { useAuth } from "../context/AuthContext"
import { useAssistant } from "../contexts/AssistantContext"
import {
  generateExplanation,
  generateSimulationAI,
  getTopicById,
  likeTopic,
  unlikeTopic
} from "../services/api"

const ACTIVE_STATUSES = new Set(["queued", "processing"])

const isActiveStatus = (status) => ACTIVE_STATUSES.has(status)

const shouldPollTopic = (topic) => {
  if (!topic?.generationStatus) {
    return false
  }

  return (
    isActiveStatus(topic.generationStatus.explanation?.status) ||
    isActiveStatus(topic.generationStatus.questionBank?.status) ||
    (topic.level === "advanced" && isActiveStatus(topic.generationStatus.simulation?.status))
  )
}

const formatLikesCount = (value = 0) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1).replace(/\.0$/, "")}M`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`
  }

  return `${value}`
}

const TopicDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { updateTopicContext, clearTopicContext } = useAssistant()

  const [topic, setTopic] = useState(null)
  const [explanation, setExplanation] = useState("")
  const [hindiExplanation, setHindiExplanation] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [explanationLoading, setExplanationLoading] = useState(false)
  const [explanationError, setExplanationError] = useState(null)
  const [simulationPath, setSimulationPath] = useState("")
  const [simulationLoading, setSimulationLoading] = useState(false)
  const [simulationError, setSimulationError] = useState(null)
  const [likeBusy, setLikeBusy] = useState(false)
  const [likeError, setLikeError] = useState(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const pageRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const iframeRef = useRef(null)

  const loadTopic = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) {
      setPageLoading(true)
    }

    try {
      const data = await getTopicById(id)
      setTopic(data)
      setExplanation(data.explanation || "")
      setHindiExplanation(data.hindiExplanation || "")
      setSimulationPath(
        data.simulationHtml
          ? `${import.meta.env.VITE_API_BASE_URL}/api/simulation/serve/${id}`
          : ""
      )

      updateTopicContext({
        topicName: data.name,
        topicLevel: data.level,
        subjectName: data.subjectId?.name || null,
        topicExplanation: data.explanation || ""
      })
    } catch (error) {
      console.error("Error fetching topic:", error)
    } finally {
      if (showLoader) {
        setPageLoading(false)
      }
    }
  }, [id, updateTopicContext])

  useEffect(() => {
    loadTopic({ showLoader: true })
    return () => clearTopicContext()
  }, [clearTopicContext, loadTopic])

  useEffect(() => {
    if (!topic || !shouldPollTopic(topic)) {
      return undefined
    }

    const intervalId = setInterval(() => {
      loadTopic()
    }, 4000)

    return () => clearInterval(intervalId)
  }, [topic, loadTopic])

  useEffect(() => {
    if (!pageRef.current) {
      return undefined
    }

    const scrollContainer = pageRef.current?.closest(".overflow-y-auto")
    scrollContainerRef.current = scrollContainer || null

    const onScroll = () => {
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY
      setShowBackToTop(scrollTop > 280)
    }

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", onScroll, { passive: true })
    } else {
      window.addEventListener("scroll", onScroll, { passive: true })
    }

    onScroll()

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", onScroll)
      } else {
        window.removeEventListener("scroll", onScroll)
      }
    }
  }, [pageLoading, topic?._id])

  const handleLikeToggle = async () => {
    if (!user || !topic || likeBusy) {
      return
    }

    if (topic.isLikedByUser) {
      const shouldUnlike = window.confirm("Remove your like from this topic?")
      if (!shouldUnlike) {
        return
      }
    }

    setLikeBusy(true)
    setLikeError(null)

    try {
      const result = topic.isLikedByUser
        ? await unlikeTopic(topic._id)
        : await likeTopic(topic._id)

      setTopic(result.topic)
    } catch (error) {
      setLikeError(error.message || "Failed to update like")
    } finally {
      setLikeBusy(false)
    }
  }

  const createSimulation = async () => {
    setSimulationError(null)
    setSimulationLoading(true)

    try {
      await generateSimulationAI(id)
      await loadTopic()
    } catch (error) {
      setSimulationError(error.message || "Failed to generate simulation")
    } finally {
      setSimulationLoading(false)
    }
  }

  const createExplanation = async () => {
    setExplanationError(null)
    setExplanationLoading(true)

    try {
      const result = await generateExplanation(id, i18n.language)
      setExplanation(result.explanation)
      setHindiExplanation(result.hindiExplanation || "")
      await loadTopic()
    } catch (error) {
      setExplanationError(error.message || "Failed to generate explanation")
    } finally {
      setExplanationLoading(false)
    }
  }

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleFullscreen = () => {
    if (!iframeRef.current) {
      return
    }

    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen()
      return
    }

    document.exitFullscreen()
  }

  const displayedExplanation =
    i18n.language === "hi" && hindiExplanation ? hindiExplanation : explanation

  const explanationStatus =
    topic?.generationStatus?.explanation?.status || (explanation ? "completed" : "idle")
  const explanationStatusError = topic?.generationStatus?.explanation?.error
  const simulationStatus =
    topic?.generationStatus?.simulation?.status || (simulationPath ? "completed" : "idle")
  const simulationStatusError = topic?.generationStatus?.simulation?.error

  if (pageLoading || !topic) {
    return (
      <div className="flex h-48 items-center justify-center">
        <SimpleSpinner label="Loading topic..." />
      </div>
    )
  }

  return (
    <div ref={pageRef} className="relative pb-10">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-accent">
              {topic.createdBy?.name || "Unknown"}
            </div>
            <h1 className="mt-2 text-2xl">{topic.name}</h1>
            <p className="mt-1 text-sm opacity-70">{topic.level}</p>
          </div>

          <button
            onClick={handleLikeToggle}
            disabled={!user || likeBusy}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
              topic.isLikedByUser
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
                : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            } ${!user ? "cursor-not-allowed opacity-60" : ""}`}
            title={user ? "Like this topic" : "Log in to like topics"}
          >
            <span aria-hidden="true">{topic.isLikedByUser ? "♥" : "♡"}</span>
            <span>{formatLikesCount(topic.likesCount || 0)}</span>
          </button>
        </div>

        {!user && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Log in to like this topic.
          </p>
        )}

        {likeError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{likeError}</p>
        )}
      </div>

      <div className="mb-10 leading-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl">{t("topic.explanation")}</h2>
          {!explanation && !explanationLoading && !isActiveStatus(explanationStatus) && (
            <button
              onClick={createExplanation}
              className="rounded bg-primary px-3 py-1 text-sm text-white"
            >
              {t("topic.generateExplanation")}
            </button>
          )}
        </div>

        {explanationError && (
          <div className="mb-3 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
            <strong>Error:</strong> {explanationError}
            <button
              onClick={createExplanation}
              className="ml-3 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {(explanationLoading || (!explanation && isActiveStatus(explanationStatus))) && (
          <SimpleSpinner label={`${t("topic.generating")} explanation...`} />
        )}

        {!explanation && explanationStatus === "failed" && explanationStatusError && !explanationError && (
          <div className="mb-3 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
            <strong>Error:</strong> {explanationStatusError}
          </div>
        )}

        {explanation && !explanationLoading && (
          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {displayedExplanation}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {topic.level === "advanced" && (
        <div>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl">{t("topic.simulation")}</h2>
            <div className="flex flex-wrap gap-2">
              {simulationPath && (
                <button
                  onClick={toggleFullscreen}
                  className="rounded bg-primary px-3 py-1 text-sm text-white"
                >
                  {t("topic.fullscreen")}
                </button>
              )}
            </div>
          </div>

          {simulationError && (
            <div className="mb-3 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
              <strong>Error:</strong> {simulationError}
              <button
                onClick={createSimulation}
                className="ml-3 text-sm underline"
              >
                Retry
              </button>
            </div>
          )}

          {(simulationLoading || (!simulationPath && isActiveStatus(simulationStatus))) && (
            <SimpleSpinner label={`${t("topic.generating")} simulation...`} />
          )}

          {!simulationPath && simulationStatus === "failed" && simulationStatusError && !simulationError && (
            <div className="mb-3 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
              <strong>Error:</strong> {simulationStatusError}
            </div>
          )}

          {!simulationPath && !simulationLoading && !isActiveStatus(simulationStatus) && explanation && (
            <button
              onClick={createSimulation}
              className="mb-4 rounded bg-primary px-3 py-1 text-sm text-white"
            >
              Generate simulation
            </button>
          )}

          {simulationPath && !simulationLoading && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Interactive simulation optimized for desktop and mobile viewport sizes.
              </div>
              <div className="h-[68vh] min-h-[420px] w-full sm:h-[72vh] lg:h-[78vh]">
                <iframe
                  ref={iframeRef}
                  src={simulationPath}
                  title="Simulation"
                  className="h-full w-full"
                  style={{ border: "none", display: "block" }}
                  scrolling="auto"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-24 left-4 z-50 flex flex-col gap-3 sm:bottom-6 sm:left-6">
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-red-300 bg-red-700 text-red-700 shadow-[0_10px_24px_rgba(220,38,38,0.18)] transition-all hover:-translate-y-1 hover:bg-red-100 dark:border-red-500/70 dark:bg-red-950/85 dark:text-red-100 dark:hover:bg-red-900"
            title="Back to top"
            aria-label="Back to top"
          >
            <span className="text-3xl font-white leading-none">⮝</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default TopicDetail
