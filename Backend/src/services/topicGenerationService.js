import QuestionBank from "../models/QuestionBank.js"
import Subject from "../models/Subject.js"
import Topic from "../models/Topic.js"
import { generateExplanationFromAI } from "./explanationService.js"
import { generateSimulationFromAI } from "./simulationService.js"
import { generate50QuestionsFromAI } from "./testService.js"
import { translateToHindi } from "./translationService.js"

const STATUS = {
  IDLE: "idle",
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped"
}

const stateValue = (status, error = "") => ({
  status,
  error,
  updatedAt: new Date()
})

export const createTopicGenerationState = (level) => ({
  explanation: stateValue(STATUS.QUEUED),
  simulation: stateValue(level === "advanced" ? STATUS.QUEUED : STATUS.SKIPPED),
  questionBank: stateValue(STATUS.QUEUED)
})

const setTopicGenerationStatus = async (topicId, key, status, error = "") => {
  await Topic.findByIdAndUpdate(topicId, {
    $set: {
      [`generationStatus.${key}`]: stateValue(status, error)
    }
  })
}

const updateTopicFields = async (topicId, fields) => {
  await Topic.findByIdAndUpdate(topicId, { $set: fields })
}

const validateSimulationHtml = (htmlContent) => {
  if (
    !htmlContent ||
    typeof htmlContent !== "string" ||
    !htmlContent.includes("<html") ||
    !htmlContent.includes("<body") ||
    !htmlContent.includes("<script") ||
    htmlContent.includes("fetch(") ||
    htmlContent.includes("XMLHttpRequest")
  ) {
    throw new Error("Invalid or unsafe simulation format")
  }

  if (htmlContent.length > 200000) {
    throw new Error("Simulation too large")
  }
}

const normalizeSimulationHtml = (htmlContent) => {
  let normalizedHtml = htmlContent

  if (!/name=["']viewport["']/i.test(normalizedHtml)) {
    normalizedHtml = normalizedHtml.replace(
      /<head([^>]*)>/i,
      `<head$1><meta name="viewport" content="width=device-width, initial-scale=1">`
    )
  }

  const responsiveGuard = `
<style id="meta-guide-simulation-guard">
  html, body {
    margin: 0;
    width: 100%;
    min-height: 100%;
    overflow-x: hidden;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  canvas, svg, img, video {
    display: block;
    max-width: 100%;
  }

  body {
    max-width: 100vw;
  }
</style>`

  if (!normalizedHtml.includes('id="meta-guide-simulation-guard"')) {
    normalizedHtml = normalizedHtml.replace(/<\/head>/i, `${responsiveGuard}</head>`)
  }

  return normalizedHtml
}

export const resetTopicGeneratedContent = async (topicId, level) => {
  const queuedState = createTopicGenerationState(level)
  await QuestionBank.deleteOne({ topicId })
  return Topic.findByIdAndUpdate(
    topicId,
    {
      $set: {
        explanation: "",
        hindiExplanation: "",
        simulationHtml: "",
        generationStatus: queuedState
      }
    },
    { new: true }
  )
}

export const generateTopicExplanation = async (topicId) => {
  const topic = await Topic.findById(topicId)
  if (!topic) {
    throw new Error("Topic not found")
  }

  const subject = await Subject.findById(topic.subjectId)
  if (!subject) {
    throw new Error("Subject not found")
  }

  await setTopicGenerationStatus(topicId, "explanation", STATUS.PROCESSING)

  try {
    const explanation = await generateExplanationFromAI({
      subjectName: subject.name,
      subjectUniversity: subject.university,
      subjectSemester: subject.semester,
      subjectCode: subject.courseCode,
      syllabusContext: subject.syllabusContext,
      topicName: topic.name,
      topicLevel: topic.level,
      language: "English"
    })

    await updateTopicFields(topicId, {
      explanation,
      hindiExplanation: ""
    })
    await setTopicGenerationStatus(topicId, "explanation", STATUS.COMPLETED)

    return {
      topic: await Topic.findById(topicId),
      subject,
      explanation
    }
  } catch (error) {
    await setTopicGenerationStatus(topicId, "explanation", STATUS.FAILED, error.message)
    throw error
  }
}

export const generateTopicTranslation = async (topicId, explanation) => {
  try {
    const hindiExplanation = await translateToHindi(explanation)
    await updateTopicFields(topicId, { hindiExplanation })
    return hindiExplanation
  } catch (error) {
    console.error("[TopicGeneration] Translation error:", error.message)
    return ""
  }
}

export const generateTopicQuestionBank = async ({
  topicId,
  subjectName,
  subjectUniversity,
  subjectSemester,
  subjectCode,
  syllabusContext,
  topicName,
  topicLevel,
  explanation,
  force = false
}) => {
  const existingBank = await QuestionBank.findOne({ topicId }).lean()
  if (existingBank && !force) {
    await setTopicGenerationStatus(topicId, "questionBank", STATUS.COMPLETED)
    return existingBank.questions
  }

  await setTopicGenerationStatus(topicId, "questionBank", STATUS.PROCESSING)

  try {
    const questions = await generate50QuestionsFromAI({
      subjectName,
      subjectUniversity,
      subjectSemester,
      subjectCode,
      syllabusContext,
      topicName,
      topicLevel,
      explanation
    })

    await QuestionBank.findOneAndUpdate(
      { topicId },
      { questions, generatedAt: new Date() },
      { upsert: true, new: true }
    )

    await setTopicGenerationStatus(topicId, "questionBank", STATUS.COMPLETED)
    return questions
  } catch (error) {
    await setTopicGenerationStatus(topicId, "questionBank", STATUS.FAILED, error.message)
    throw error
  }
}

export const generateTopicSimulation = async ({
  topicId,
  subjectName,
  subjectUniversity,
  subjectSemester,
  subjectCode,
  syllabusContext,
  topicName,
  topicLevel,
  explanation,
  force = false
}) => {
  if (topicLevel !== "advanced") {
    await setTopicGenerationStatus(topicId, "simulation", STATUS.SKIPPED)
    return null
  }

  const topic = await Topic.findById(topicId).lean()
  if (topic?.simulationHtml && !force) {
    await setTopicGenerationStatus(topicId, "simulation", STATUS.COMPLETED)
    return topic.simulationHtml
  }

  await setTopicGenerationStatus(topicId, "simulation", STATUS.PROCESSING)

  try {
    const generatedHtml = await generateSimulationFromAI({
      subjectName,
      subjectUniversity,
      subjectSemester,
      subjectCode,
      syllabusContext,
      topicName,
      topicLevel,
      explanation
    })
    const htmlContent = normalizeSimulationHtml(generatedHtml)

    validateSimulationHtml(htmlContent)

    await updateTopicFields(topicId, { simulationHtml: htmlContent })
    await setTopicGenerationStatus(topicId, "simulation", STATUS.COMPLETED)
    return htmlContent
  } catch (error) {
    await setTopicGenerationStatus(topicId, "simulation", STATUS.FAILED, error.message)
    throw error
  }
}

export const generateTopicAssets = async (topicId) => {
  const topic = await Topic.findById(topicId)
  if (!topic) {
    return null
  }

  let explanationResult

  try {
    explanationResult = await generateTopicExplanation(topicId)
  } catch (error) {
    await setTopicGenerationStatus(
      topicId,
      "questionBank",
      STATUS.FAILED,
      "Blocked because explanation generation failed"
    )

    if (topic.level === "advanced") {
      await setTopicGenerationStatus(
        topicId,
        "simulation",
        STATUS.FAILED,
        "Blocked because explanation generation failed"
      )
    }

    throw error
  }

  const { topic: freshTopic, subject, explanation } = explanationResult

  await Promise.allSettled([
    generateTopicTranslation(topicId, explanation),
    generateTopicQuestionBank({
      topicId,
      subjectName: subject.name,
      subjectUniversity: subject.university,
      subjectSemester: subject.semester,
      subjectCode: subject.courseCode,
      syllabusContext: subject.syllabusContext,
      topicName: freshTopic.name,
      topicLevel: freshTopic.level,
      explanation
    }),
    generateTopicSimulation({
      topicId,
      subjectName: subject.name,
      subjectUniversity: subject.university,
      subjectSemester: subject.semester,
      subjectCode: subject.courseCode,
      syllabusContext: subject.syllabusContext,
      topicName: freshTopic.name,
      topicLevel: freshTopic.level,
      explanation
    })
  ])

  return Topic.findById(topicId).populate("subjectId", "name")
}

export const runTopicGenerationInBackground = (topicId) => {
  setTimeout(() => {
    generateTopicAssets(topicId).catch((error) => {
      console.error(`[TopicGeneration] Failed for topic ${topicId}:`, error.message)
    })
  }, 0)
}
