import { generateGroqTextWithFailover } from "./groqKeyPool.js"

const QUESTION_COUNT = {
  beginner: 5,
  intermediate: 5,
  advanced: 10
}

const QUESTION_BANK_TARGET = 20
const QUESTION_BANK_BATCH_SIZE = 3
const QUESTION_BANK_MAX_ATTEMPTS = 40
const PRIMARY_TEST_MODEL = "llama-3.1-8b-instant"
const FALLBACK_TEST_MODELS = []
const TEST_MAX_TOKENS = 3000

const sanitizeJsonText = (value = "") =>
  value.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")

const normalizeText = (value = "") =>
  String(value).replace(/\s+/g, " ").trim()

const normalizeOptions = (options = []) =>
  options.slice(0, 6).map((option) => normalizeText(option)).filter(Boolean)

const normalizeCorrectAnswers = (correctAnswers = [], optionCount = 0) => {
  const values = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers]

  return [...new Set(
    values
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value >= 0 && value < optionCount)
  )].sort((a, b) => a - b)
}

const normalizeQuestionRecord = (question) => {
  const normalizedQuestion = normalizeText(question?.question)
  const normalizedOptions = normalizeOptions(question?.options || [])
  const normalizedCorrectAnswers = normalizeCorrectAnswers(question?.correctAnswers, normalizedOptions.length)
  const normalizedExplanation = normalizeText(question?.explanation)
  const uniqueOptionCount = new Set(normalizedOptions.map((option) => option.toLowerCase())).size

  if (!normalizedQuestion || normalizedOptions.length !== 6 || uniqueOptionCount !== 6 || !normalizedCorrectAnswers.length) {
    return null
  }

  return {
    question: normalizedQuestion,
    options: normalizedOptions,
    correctAnswers: normalizedCorrectAnswers,
    explanation: normalizedExplanation,
    isMultiple: Boolean(question?.isMultiple) || normalizedCorrectAnswers.length > 1,
    points: 10
  }
}

const extractQuestionArrayFromText = (generatedText) => {
  let jsonText = generatedText.trim()
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  const arrayStart = jsonText.indexOf("[")
  const arrayEnd = jsonText.lastIndexOf("]")
  if (arrayStart !== -1 && arrayEnd !== -1) {
    jsonText = jsonText.substring(arrayStart, arrayEnd + 1)
  }

  try {
    return JSON.parse(jsonText)
  } catch (error) {
    return JSON.parse(sanitizeJsonText(jsonText))
  }
}

const normalizeBankQuestions = (questions = []) =>
  questions.map(normalizeQuestionRecord).filter(Boolean)

const normalizeTestQuestions = (questions = []) =>
  questions
    .map(normalizeQuestionRecord)
    .filter(Boolean)
    .map((q, idx) => ({
      id: idx + 1,
      ...q
    }))

const createExistingQuestionContext = (questions = []) => {
  if (!questions.length) {
    return "None yet."
  }

  return questions
    .slice(-12)
    .map((question, idx) => `${idx + 1}. ${question.question.slice(0, 140)}`)
    .join("\n")
}

const wait = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })

const shouldRetryQuestionGeneration = (error) => {
  const message = error?.message || ""

  return (
    message.includes("No content generated from AI") ||
    message.includes("Unexpected") ||
    message.includes("Expected") ||
    message.includes("JSON")
  )
}

const isModelRateLimitError = (error) =>
  (error?.message || "").includes("rate_limit_exceeded")

const requestQuestionArrayWithRetry = async ({
  prompt,
  temperature,
  maxTokens = TEST_MAX_TOKENS,
  retries = 3
}) => {
  let lastError = null
  const modelsToTry = [PRIMARY_TEST_MODEL, ...FALLBACK_TEST_MODELS]

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        const generatedText = await generateGroqTextWithFailover({
          envVarName: "TEST_API_KEY",
          model,
          maxTokens,
          temperature,
          topP: 0.9,
          timeoutMs: 90000,
          timeoutMessage: "Question generation timed out. Please try again.",
          systemPrompt: "You generate syllabus-faithful engineering quizzes and return only valid JSON arrays.",
          userPrompt: prompt
        })

        return extractQuestionArrayFromText(generatedText)
      } catch (error) {
        lastError = error

        const canRetrySameModel = shouldRetryQuestionGeneration(error) && attempt < retries - 1
        if (canRetrySameModel) {
          await wait(1200)
          continue
        }

        if (isModelRateLimitError(error)) {
          break
        }

        throw error
      }
    }
  }

  throw lastError
}

/**
 * Generates the stored question bank for a topic.
 * Each question has 6 options, correctAnswers (indices), explanation, isMultiple.
 */
export const generateQuestionBankFromAI = async ({
  subjectName,
  subjectBranch,
  subjectUniversity,
  subjectSemester,
  subjectCode,
  syllabusContext,
  topicName,
  topicLevel,
  explanation
}) => {
  const trimmedSyllabusContext = syllabusContext
    ? syllabusContext.substring(0, 900)
    : ""
  const trimmedExplanation = explanation
    ? explanation.substring(0, 1800)
    : ""

  const uniqueQuestions = []
  const seenQuestions = new Set()
  let attempt = 0

  while (uniqueQuestions.length < QUESTION_BANK_TARGET && attempt < QUESTION_BANK_MAX_ATTEMPTS) {
    const remaining = QUESTION_BANK_TARGET - uniqueQuestions.length
    const count = remaining <= 6
      ? 1
      : remaining <= 15
        ? 2
        : Math.min(QUESTION_BANK_BATCH_SIZE, remaining)
    const existingQuestionContext = createExistingQuestionContext(uniqueQuestions)
    const prompt = `You are a ${subjectName} quiz creator. Generate exactly ${count} multiple-choice questions for the topic "${topicName}" (${topicLevel} level).

Course context:
- Branch: ${subjectBranch || "Unknown"}
- University: ${subjectUniversity || "Unknown"}
- Semester: ${subjectSemester || "Unknown"}
- Course Code: ${subjectCode || "Unknown"}

Official syllabus context:
${trimmedSyllabusContext || "No syllabus context available."}

Reference explanation for this exact topic:
${trimmedExplanation || "No explanation available."}

Already generated questions for this question bank:
${existingQuestionContext}

Rules:
- Each question MUST have exactly 6 options (labeled A-F as full text, not just letters)
- Mix single-correct and multi-correct questions
- Test deep understanding, not just memorization
- Keep each explanation to 1-2 sentences
- Every new question must be different from the already generated questions listed above
- Do not repeat the same concept in slightly reworded form
- Treat the reference explanation as the primary ground truth for what can be asked
- Every question must be directly answerable from the topic explanation above
- Use the syllabus context only to keep wording, scope, and terminology aligned with the course
- Do not ask about concepts, formulas, tricks, edge cases, or theory that are not actually taught in the topic explanation
- Do not ask surprise questions from the wider subject just because they are related to the topic name
- Do not generate random mind-twisting or trick questions
- Keep questions aligned with the RTU course scope, topic explanation, and official terminology
- If the explanation does not cover a concept clearly, do not ask about it
- If the syllabus block implies lab work or practical experiments, ask about them only when they are also supported by the explanation
- Prefer fair, clear, student-facing questions over clever traps
- Use subject details, topic details, and the provided explanation together, but never let the topic name alone drive the question content

Return ONLY a valid JSON array of exactly ${count} objects, no markdown, no extra text:
[{"question":"...","options":["Option text A","Option text B","Option text C","Option text D","Option text E","Option text F"],"correctAnswers":[0],"explanation":"...","isMultiple":false}]

Generate ${count} questions now:`

    const batchQuestions = normalizeBankQuestions(
      await requestQuestionArrayWithRetry({
        prompt,
        temperature: 0.75,
        maxTokens: 1400
      })
    )

    batchQuestions.forEach((question) => {
      const normalizedQuestion = question.question.trim().toLowerCase()
      if (seenQuestions.has(normalizedQuestion)) {
        return
      }

      seenQuestions.add(normalizedQuestion)
      uniqueQuestions.push(question)
    })

    attempt += 1
  }

  if (uniqueQuestions.length < QUESTION_BANK_TARGET) {
    throw new Error(`Question bank generation returned only ${uniqueQuestions.length} valid unique questions`)
  }

  return uniqueQuestions.slice(0, QUESTION_BANK_TARGET)
}


export const generateTestQuestionsFromAI = async ({
  subjectName,
  subjectBranch,
  subjectUniversity,
  subjectSemester,
  subjectCode,
  syllabusContext,
  topicName,
  topicLevel,
  explanation
}) => {
  const count = QUESTION_COUNT[topicLevel] || 5
  const trimmedSyllabusContext = syllabusContext
    ? syllabusContext.substring(0, 800)
    : ""
  const trimmedExplanation = explanation
    ? explanation.substring(0, 1400)
    : ""

  const prompt = `You are a ${subjectName} quiz creator. Generate exactly ${count} multiple-choice questions for the topic "${topicName}" (${topicLevel} level).

Course context:
- Branch: ${subjectBranch || "Unknown"}
- University: ${subjectUniversity || "Unknown"}
- Semester: ${subjectSemester || "Unknown"}
- Course Code: ${subjectCode || "Unknown"}

Official syllabus context:
${trimmedSyllabusContext || "No syllabus context available."}

Reference explanation for this exact topic:
${trimmedExplanation || "No explanation available."}

Rules:
- Each question has exactly 6 options (A-F)
- Mix single and multiple correct answers
- Test understanding, not memorization
- Keep explanations to 1 sentence
- Treat the reference explanation as the primary ground truth
- Every question must be directly answerable from the explanation above
- Stay within the syllabus boundary and course terminology
- Do not introduce content outside the matched branch syllabus
- Do not ask about concepts that are missing from the explanation
- Do not use the topic name alone to invent wider subject questions
- Prefer fair, direct questions over tricky or surprising ones

Return ONLY a valid JSON array, no markdown:
[{"question":"...","options":["A","B","C","D","E","F"],"correctAnswers":[0],"explanation":"...","isMultiple":false}]

  Generate ${count} questions now:`
  return normalizeTestQuestions(
    await requestQuestionArrayWithRetry({
      prompt,
      temperature: 0.7,
      maxTokens: 1200
    })
  )
}
