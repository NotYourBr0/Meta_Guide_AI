import fetch from "node-fetch"

const TRANSLATION_BASE_URL = "https://api.groq.com/openai/v1"
const TRANSLATION_MODEL = "openai/gpt-oss-120b"
const TRANSLATION_MAX_TOKENS = 8000

export const translateToHindi = async (englishText) => {
  const prompt = `
Translate the following English explanation to Hindi. Maintain the exact same markdown formatting, structure, headings, spacing, and formula formatting.

English Text:
${englishText}

IMPORTANT:
- Preserve all markdown formatting exactly (headings, bullet points, numbered lists)
- Keep the same structure and spacing
- Preserve all LaTeX formulas exactly as written inside $...$ and $$...$$
- Translate only the human-readable text content
- Do not translate markdown symbols or LaTeX syntax
- Do not add any additional explanations or notes
- Output only the translated Hindi text with the original markdown formatting
`

  const apiKey = process.env.EXPLANATION_API_KEY
  if (!apiKey) {
    throw new Error("EXPLANATION_API_KEY is not configured on the server")
  }

  const response = await fetch(`${TRANSLATION_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: TRANSLATION_MODEL,
      messages: [
        {
          role: "system",
          content: "You translate engineering explanations to Hindi while preserving markdown structure and LaTeX formulas exactly."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: TRANSLATION_MAX_TOKENS
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Translation API Error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const translatedText = data.choices?.[0]?.message?.content?.trim()

  if (!translatedText) {
    throw new Error("No translation generated from AI")
  }

  return translatedText
}
