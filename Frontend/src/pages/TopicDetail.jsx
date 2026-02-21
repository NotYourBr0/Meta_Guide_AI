import { useRef, useState, useEffect, useCallback } from "react"
import ReactMarkdown from 'react-markdown'
import { generateSimulationAI, generateExplanation } from "../services/api"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useAssistant } from "../contexts/AssistantContext"

/* ── Spinner component ─────────────────────────────────────── */
const Spinner = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    {label && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{label}</p>}
  </div>
)

const TopicDetail = () => {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { updateTopicContext, clearTopicContext } = useAssistant()

  const [topic, setTopic] = useState(null)
  const [explanation, setExplanation] = useState("")
  const [hindiExplanation, setHindiExplanation] = useState("")
  const [explanationLoading, setExplanationLoading] = useState(false)
  const [explanationError, setExplanationError] = useState(null)

  const [simulationPath, setSimulationPath] = useState("")
  const [loading, setLoading] = useState(false)
  const [simulationError, setSimulationError] = useState(null)

  /* ── Auto-generate explanation ────────────────────────────── */
  const autoGenerateExplanation = useCallback(async (fetchedTopic) => {
    setExplanationError(null)
    setExplanationLoading(true)
    try {
      const result = await generateExplanation(fetchedTopic._id, i18n.language)
      setExplanation(result.explanation)
      setHindiExplanation(result.hindiExplanation || "")
      return result.explanation // pass forward for chaining
    } catch (err) {
      setExplanationError(err.message || "Failed to generate explanation")
      console.error("Error auto-generating explanation:", err)
      return null
    } finally {
      setExplanationLoading(false)
    }
  }, [i18n.language])

  /* ── Auto-generate simulation ─────────────────────────────── */
  const autoGenerateSimulation = useCallback(async (fetchedTopic) => {
    setSimulationError(null)
    setLoading(true)
    try {
      await generateSimulationAI(fetchedTopic._id)
      // Serve HTML from MongoDB via the serve endpoint (survives restarts)
      setSimulationPath(`${import.meta.env.VITE_API_BASE_URL}/api/simulation/serve/${fetchedTopic._id}`)
    } catch (err) {
      setSimulationError(err.message || "Failed to generate simulation")
      console.error("Error auto-generating simulation:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Initial fetch + auto-generate chain ─────────────────── */
  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/topics/single/${id}`
        )
        const data = await res.json()
        setTopic(data)
        setExplanation(data.explanation || "")
        setHindiExplanation(data.hindiExplanation || "")
        // Use DB-backed serve endpoint so simulation survives restarts
        setSimulationPath(
          data.simulationHtml
            ? `${import.meta.env.VITE_API_BASE_URL}/api/simulation/serve/${id}`
            : ""
        )

        updateTopicContext({
          topicName: data.name,
          topicLevel: data.level,
          subjectName: data.subjectId?.name || null,
        })

        // ── Auto-generate if content is missing ────────────────
        let currentExplanation = data.explanation

        if (!currentExplanation) {
          // No explanation — generate it first
          currentExplanation = await autoGenerateExplanation(data)
        }

        // After explanation is ready, auto-gen simulation for advanced topics
        if (data.level === "advanced" && !data.simulationHtml && currentExplanation) {
          await autoGenerateSimulation(data)
        }
      } catch (err) {
        console.error("Error fetching topic:", err)
      }
    }

    fetchTopic()
    return () => clearTopicContext()
  }, [id]) // eslint-disable-line

  const simulationRef = useRef(null)
  const iframeRef = useRef(null)

  const scrollToSimulation = () => {
    simulationRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleFullscreen = () => {
    if (!iframeRef.current) return
    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  /* ── Manual regenerate handlers (kept for future use) ─────── */
  const createSimulation = async () => {
    setSimulationError(null)
    setLoading(true)
    try {
      await generateSimulationAI(topic._id)
      setSimulationPath(`${import.meta.env.VITE_API_BASE_URL}/api/simulation/serve/${topic._id}`)
    } catch (err) {
      setSimulationError(err.message || "Failed to generate simulation")
    } finally {
      setLoading(false)
    }
  }

  const createExplanation = async () => {
    setExplanationError(null)
    setExplanationLoading(true)
    try {
      const result = await generateExplanation(topic._id, i18n.language)
      setExplanation(result.explanation)
      setHindiExplanation(result.hindiExplanation || "")
    } catch (err) {
      setExplanationError(err.message || "Failed to generate explanation")
    } finally {
      setExplanationLoading(false)
    }
  }

  const displayedExplanation =
    i18n.language === "hi" && hindiExplanation ? hindiExplanation : explanation

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative">

      {topic.level === "advanced" && (
        <button
          onClick={scrollToSimulation}
          className="fixed bottom-6 right-6 w-12 h-12 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 z-50"
        >
          ↓
        </button>
      )}

      <div className="mb-6">
        <div className="text-sm text-accent">
          {topic.createdBy?.name || "Unknown"}
        </div>
        <h1 className="text-2xl mt-2">{topic.name}</h1>
        <p className="text-sm opacity-70 mt-1">{topic.level}</p>
      </div>

      {/* ── Explanation section ─────────────────────────────────── */}
      <div className="mb-10 leading-7">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl">{t("topic.explanation")}</h2>
          {/* Retry button shown only when explanation failed */}
          {!explanation && !explanationLoading && (
            <button
              onClick={createExplanation}
              className="px-3 py-1 bg-primary text-white rounded text-sm"
            >
              {t("topic.generateExplanation")}
            </button>
          )}
        </div>

        {explanationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            <strong>Error:</strong> {explanationError}
            <button
              onClick={createExplanation}
              className="ml-3 underline text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading spinner while auto-generating */}
        {explanationLoading && (
          <Spinner label={t("topic.generating") + " explanation…"} />
        )}

        {explanation && !explanationLoading && (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{displayedExplanation}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* ── Simulation section (advanced topics only) ──────────── */}
      {topic.level === "advanced" && (
        <div ref={simulationRef}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl">{t("topic.simulation")}</h2>
            <div className="flex gap-2">
              {simulationPath && (
                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-1 bg-primary text-white rounded text-sm"
                >
                  {t("topic.fullscreen")}
                </button>
              )}
              {/* Regenerate button shown only when there's an error or after initial load */}
              {!loading && simulationPath && (
                <button
                  onClick={createSimulation}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  ↻ Regenerate
                </button>
              )}
            </div>
          </div>

          {simulationError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
              <strong>Error:</strong> {simulationError}
              <button
                onClick={createSimulation}
                className="ml-3 underline text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading spinner while auto-generating simulation */}
          {loading && (
            <Spinner label={t("topic.generating") + " simulation…"} />
          )}

          {/* ── Responsive simulation iframe ─────────────────────── */}
          {simulationPath && !loading && (
            <div
              className="border rounded overflow-hidden w-full"
              style={{ minHeight: '600px', height: 'calc(100vh - 220px)', maxHeight: '900px' }}
            >
              <iframe
                ref={iframeRef}
                src={simulationPath}
                title="Simulation"
                className="w-full h-full"
                style={{ border: 'none', display: 'block' }}
                scrolling="auto"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TopicDetail
