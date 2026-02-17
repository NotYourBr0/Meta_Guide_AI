import fetch from "node-fetch"

export const translateToHindi = async (englishText) => {
  const prompt = `
Translate the following English explanation to Hindi. Maintain the exact same markdown formatting, structure, headings, and spacing. Only translate the text content, keep all markdown symbols (# ## - etc.) unchanged.

English Text:
${englishText}

IMPORTANT:
- Preserve all markdown formatting (headings, bullet points, numbered lists)
- Keep the same structure and spacing
- Translate only the text content
- Do not add any additional explanations or notes
- Output only the translated Hindi text with markdown formatting
`

  const apiKey = process.env.TRANSLATION_API_KEY
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
    throw new Error(`Translation API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  // Extract text from Gemini API response
  const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!translatedText) {
    throw new Error("No translation generated from AI")
  }

  return translatedText
}
