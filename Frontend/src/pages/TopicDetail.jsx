import { useRef, useState, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import { useLocation } from "react-router-dom"
import { generateSimulationAI } from "../services/api"
import { generateExplanation } from "../services/api"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useAssistant } from "../contexts/AssistantContext"


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

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/topics/single/${id}`)
        const data = await res.json()
        setTopic(data)
        setExplanation(data.explanation || "")
        setHindiExplanation(data.hindiExplanation || "")
        setSimulationPath(data.simulationPath ? import.meta.env.VITE_API_BASE_URL + data.simulationPath : "")
        // Tell the AI assistant what topic is being viewed
        updateTopicContext({
          topicName: data.name,
          topicLevel: data.level,
          subjectName: data.subjectId?.name || null,
        })
      } catch (err) {
        console.error("Error fetching topic:", err)
      }
    }
    fetchTopic()
    // Clear context when leaving the topic page
    return () => clearTopicContext()
  }, [id])


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

  const createSimulation = async () => {
    setSimulationError(null)
    setLoading(true)

    try {
      const result = await generateSimulationAI(topic._id)
      setSimulationPath(import.meta.env.VITE_API_BASE_URL + result.simulationPath)
    } catch (err) {
      setSimulationError(err.message || "Failed to generate simulation")
      console.error("Error generating simulation:", err)
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
      console.error("Error generating explanation:", err)
    } finally {
      setExplanationLoading(false)
    }
  }

  // Determine which explanation text to show based on global language
  const displayedExplanation =
    i18n.language === "hi" && hindiExplanation
      ? hindiExplanation
      : explanation

  if (!topic) {
    return <div className="p-4">Loading topic...</div>
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
        <h1 className="text-2xl mt-2">
          {topic.name}
        </h1>
        <p className="text-sm opacity-70 mt-1">
          {topic.level}
        </p>
      </div>

     <div className="mb-10 leading-7">
  <div className="flex justify-between items-center mb-3">
    <h2 className="text-xl">{t("topic.explanation")}</h2>
    {!explanation && (
      <button
        onClick={createExplanation}
        disabled={explanationLoading}
        className={`px-3 py-1 bg-primary text-white rounded ${explanationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {explanationLoading ? t("topic.generating") : t("topic.generateExplanation")}
      </button>
    )}
  </div>
  
  {explanationError && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
      <strong>Error:</strong> {explanationError}
    </div>
  )}

  {explanation && (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown>
        {displayedExplanation}
      </ReactMarkdown>
    </div>
  )}
</div>


      {topic.level === "advanced" && (
        <div ref={simulationRef}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl">{t("topic.simulation")}</h2>
            {!simulationPath && (
              <button
                onClick={createSimulation}
                disabled={loading}
                className={`px-3 py-1 bg-primary text-white rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? t("topic.generating") : t("topic.generateSimulation")}
              </button>
            )}
            {simulationPath && (
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1 bg-primary text-white rounded"
              >
                {t("topic.fullscreen")}
              </button>
            )}
          </div>
          
          {simulationError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
              <strong>Error:</strong> {simulationError}
            </div>
          )}

          {simulationPath && (
            <div className="border rounded overflow-hidden">
              <iframe
                ref={iframeRef}
                src={simulationPath}
                title="Simulation"
                className="w-full h-[500px]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TopicDetail
