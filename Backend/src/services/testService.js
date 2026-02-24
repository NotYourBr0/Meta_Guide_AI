import fetch from "node-fetch"

const QUESTION_COUNT = {
  beginner: 5,
  intermediate: 5,
  advanced: 10
}

/**
 * Calls Gemini to generate exactly 50 questions for a topic.
 * Each question has 6 options, correctAnswers (indices), explanation, isMultiple.
 */
export const generate50QuestionsFromAI = async ({
  subjectName,
  topicName,
  topicLevel,
  explanation
}) => {
  const prompt = `You are a ${subjectName} quiz creator. Generate exactly 50 multiple-choice questions for the topic "${topicName}" (${topicLevel} level).

Context:
${explanation ? explanation.substring(0, 2000) : `${topicName} in ${subjectName}`}

Rules:
- Each question MUST have exactly 6 options (labeled A-F as full text, not just letters)
- Mix single-correct and multi-correct questions (about 70% single, 30% multi)
- Test deep understanding, not just memorization
- Vary difficulty within the 50 questions (easy, medium, hard)
- Keep each explanation to 1-2 sentences
- No repeated or very similar questions

Return ONLY a valid JSON array of exactly 50 objects, no markdown, no extra text:
[{"question":"...","options":["Option text A","Option text B","Option text C","Option text D","Option text E","Option text F"],"correctAnswers":[0],"explanation":"...","isMultiple":false}]

Generate all 50 questions now:`

  const apiKey = process.env.TEST_API_KEY
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000) // 2 min timeout for 50 Qs

  let response
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 16384
        }
      })
    })
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Question bank generation timed out. Please try again.")
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Test Bank API Error:", response.status, errorText)
    throw new Error(`AI API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!generatedText) {
    throw new Error("No content generated from AI")
  }

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
  subjectLevel,
  topicName,
  topicLevel,
  explanation
}) => {
  const count = QUESTION_COUNT[topicLevel] || 5

  const prompt = `You are a ${subjectName} quiz creator. Generate exactly ${count} multiple-choice questions for the topic "${topicName}" (${topicLevel} level).

Context:
${explanation ? explanation.substring(0, 1500) : `${topicName} in ${subjectName}`}

Rules:
- Each question has exactly 6 options (A-F)
- Mix single and multiple correct answers
- Test understanding, not memorization
- Keep explanations to 1 sentence

Return ONLY a valid JSON array, no markdown:
[{"question":"...","options":["A","B","C","D","E","F"],"correctAnswers":[0],"explanation":"...","isMultiple":false}]

Generate ${count} questions now:`

  const apiKey = process.env.TEST_API_KEY
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout

  let response
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    })
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Test generation timed out after 30 seconds. Please try again.")
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Test API Error:", response.status, errorText)
    throw new Error(`AI API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!generatedText) {
    throw new Error("No content generated from AI")
  }

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
