import { generateGroqTextWithFailover } from "./groqKeyPool.js"

const TRANSLATION_MODEL = "llama-3.1-8b-instant"
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

  return generateGroqTextWithFailover({
    envVarName: "TRANSLATION_API_KEY",
    model: TRANSLATION_MODEL,
    maxTokens: TRANSLATION_MAX_TOKENS,
    temperature: 0.3,
    topP: 0.9,
    systemPrompt: "You translate engineering explanations to Hindi while preserving markdown structure and LaTeX formulas exactly.",
    userPrompt: prompt
  })
}
