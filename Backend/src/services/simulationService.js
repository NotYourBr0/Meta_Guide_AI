import fetch from "node-fetch"

export const generateSimulationFromAI = async ({
  topicName,
  explanation
}) => {

  const prompt = `
Create a complete simulation in a single HTML file.

Topic: ${topicName}

Explanation:
${explanation}

Rules:
- Return ONLY full HTML.
- Include internal <style> and <script>.
- No external CDN.
- No imports.
- No frameworks.
- No network calls.
- Must be responsive.
- Must include interactive sliders.
- Parameters must update live.
- Lightweight and optimized.
- Clean UI.
- No unnecessary HTML tags.
- Only simulation and parameters tweaker, nothing else.
`

  const apiKey = process.env.SIMULATION_API_KEY
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
    