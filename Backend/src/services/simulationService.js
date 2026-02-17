import fetch from "node-fetch"

export const generateSimulationFromAI = async ({
  topicName,
  explanation
}) => {

  const prompt = `Create a complete, interactive simulation in a single HTML file.

Topic: ${topicName}

Reference Explanation:
${explanation}

OUTPUT RULES:

Return ONLY valid, complete HTML.

Do NOT add explanations, comments, or markdown.

Do NOT wrap output in code blocks.

Start directly with <!DOCTYPE html>.

End with </html>.

TECHNICAL RULES:

Use only internal <style> and <script>.

No external CDN.

No imports.

No frameworks.

No network requests.

No APIs.

No fonts or assets from outside.

UI & RESPONSIVENESS:

Must work on mobile, tablet, and desktop.

Use flexible layout (Flexbox or Grid).

Adapt to screen size automatically.

No horizontal scrolling.

INTERACTIVITY:

Include multiple sliders for key parameters.

All parameters update in real time.

Changes reflect instantly in the simulation.

No refresh or reload.

PERFORMANCE:

Keep JavaScript lightweight.

Optimize rendering loops.

Avoid unnecessary reflows.

Use requestAnimationFrame where needed.

DESIGN:

Clean and minimal interface.

High contrast for readability.

Consistent spacing.

No decorative clutter.

CONTENT RULES:

Include ONLY:

The simulation area

The parameter controls

No headers, no descriptions, no credits.

No footer.

No placeholder text.

STRUCTURE REQUIREMENT:

One main container

One canvas or visualization area

One control panel

VALIDATION:

Output must run offline.

Output must pass basic HTML validation.

No unused variables.

No dead code.

Follow all rules strictly.`

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
    