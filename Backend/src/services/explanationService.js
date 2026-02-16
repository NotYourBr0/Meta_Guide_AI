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

Rules:
- Adjust length based on difficulty.
- Beginner = simple and short.
- Intermediate = moderate depth.
- Advanced = detailed and technical.
- Include key points.
- No unnecessary introduction.
- Clear formatting.
- Use markdown formatting.
- Use bullet points for lists.
- Use bold for important points.
- Use italic for definitions.
- Use code for code snippets.
- Use code blocks for code snippets.
- Use colors for code snippets.
- In advanced level, explanation should also be very easy and understandable.
- No extra unnecessary HTML tags.
- Proper spacing and indentation.
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
