import fetch from "node-fetch"

export const generateExplanationFromAI = async ({
  subjectName,
  subjectLevel,
  topicName,
  topicLevel,
  language
}) => {

  const prompt = `
Generate a structured explanation for the topic.

Subject: ${subjectName}
Subject Level: ${subjectLevel}
Topic: ${topicName}
Difficulty: ${topicLevel}
Language: ${language}

You are an expert ${subjectName} educator. Write a comprehensive, focused, and well-structured explanation for "${topicName}" in ${subjectName}.

IMPORTANT FORMATTING RULES:

Output GitHub-Flavored Markdown only.

Do NOT use code blocks or backticks.

Leave one blank line after every heading.

Leave one blank line between every section.

Use proper Markdown headings with # and ##.

Use bullet points with "-" only.

Use numbered steps with "1." format.

Do NOT write everything as one paragraph.

Keep sections clearly separated with spacing.

Use the exact structure below and preserve spacing:

${topicName}
Overview

Write a clear, student-friendly introduction.

Key Concepts

Concept 1

Concept 2

Concept 3

Formulas / Equations

F = m a → Brief explanation

E = m c^2 → Brief explanation

(Write equations in plain text only. Do not use LaTeX.)

Step-by-step Reasoning / Procedure

First logical step

Second logical step

Third logical step

Real-world Applications

Application 1

Application 2

Common Misconceptions

Misconception 1 → Correction

Misconception 2 → Correction

Quick Check

Short question 1

Short question 2

Answers:

A1: Brief answer

A2: Brief answer

Summary / Takeaways

Key takeaway 1

Key takeaway 2

Key takeaway 3

Tone requirements:

Clear and precise.

Adjust depth to match difficulty: ${topicLevel}.

Avoid unnecessary filler.

Keep explanations focused and structured.
`

  const apiKey = process.env.EXPLANATION_API_KEY
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  // Extract text from Gemini API response
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!generatedText) {
    throw new Error("No content generated from AI")
  }

  return generatedText
}
