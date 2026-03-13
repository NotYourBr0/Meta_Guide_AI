import fetch from "node-fetch"

const QUESTION_COUNT = {
  beginner: 5,
  intermediate: 5,
  advanced: 10
}

const TEST_BASE_URL = "https://api.groq.com/openai/v1"
const TEST_MODEL = "openai/gpt-oss-120b"
const TEST_MAX_TOKENS = 8000

const generateTextFromGroq = async ({ prompt, temperature, timeoutMs, timeoutMessage }) => {
  const apiKey = process.env.TEST_API_KEY
  if (!apiKey) {
    throw new Error("TEST_API_KEY is not configured on the server")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(`${TEST_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [
          {
            role: "system",
            content: "You generate syllabus-faithful engineering quizzes and return only valid JSON arrays."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature,
        max_tokens: TEST_MAX_TOKENS
      })
    })
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(timeoutMessage)
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const generatedText = data.choices?.[0]?.message?.content?.trim()

  if (!generatedText) {
    throw new Error("No content generated from AI")
  }

  return generatedText
}

/**
 * Generates exactly 50 questions for a topic.
 * Each question has 6 options, correctAnswers (indices), explanation, isMultiple.
 */
export const generate50QuestionsFromAI = async ({
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
    ? syllabusContext.substring(0, 5000)
    : ""
  const trimmedExplanation = explanation
    ? explanation.substring(0, 6000)
    : ""

  const prompt = `You are a ${subjectName} quiz creator. Generate exactly 50 multiple-choice questions for the topic "${topicName}" (${topicLevel} level).

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
- Each question MUST have exactly 6 options (labeled A-F as full text, not just letters)
- Mix single-correct and multi-correct questions (about 70% single, 30% multi)
- Test deep understanding, not just memorization
- Vary difficulty within the 50 questions (easy, medium, hard)
- Keep each explanation to 1-2 sentences
- No repeated or very similar questions
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

Return ONLY a valid JSON array of exactly 50 objects, no markdown, no extra text:
[{"question":"...","options":["Option text A","Option text B","Option text C","Option text D","Option text E","Option text F"],"correctAnswers":[0],"explanation":"...","isMultiple":false}]

Generate all 50 questions now:`
  const generatedText = await generateTextFromGroq({
    prompt,
    temperature: 0.75,
    timeoutMs: 120000,
    timeoutMessage: "Question bank generation timed out. Please try again."
  })

  // Extract JSON from the response
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

  const questions = JSON.parse(jsonText)

  // Normalize and validate
  return questions.map((q, idx) => ({
    question: q.question,
    options: (q.options || []).slice(0, 6),
    correctAnswers: q.correctAnswers || [0],
    explanation: q.explanation || "",
    isMultiple: q.isMultiple || (q.correctAnswers || []).length > 1,
    points: 10
  })).filter(q => q.question && q.options.length === 6)
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
    ? syllabusContext.substring(0, 4000)
    : ""
  const trimmedExplanation = explanation
    ? explanation.substring(0, 5000)
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
  const generatedText = await generateTextFromGroq({
    prompt,
    temperature: 0.7,
    timeoutMs: 60000,
    timeoutMessage: "Test generation timed out after 30 seconds. Please try again."
  })

  // Extract JSON from the response (handle markdown code blocks if present)
  let jsonText = generatedText.trim()
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim()
  }

  // Find the JSON array
  const arrayStart = jsonText.indexOf("[")
  const arrayEnd = jsonText.lastIndexOf("]")
  if (arrayStart !== -1 && arrayEnd !== -1) {
    jsonText = jsonText.substring(arrayStart, arrayEnd + 1)
  }

  const questions = JSON.parse(jsonText)

  // Validate and normalize
  return questions.map((q, idx) => ({
    id: idx + 1,
    question: q.question,
    options: q.options.slice(0, 6),
    correctAnswers: q.correctAnswers,
    explanation: q.explanation || "",
    isMultiple: q.isMultiple || q.correctAnswers.length > 1,
    points: 10
  }))
}
