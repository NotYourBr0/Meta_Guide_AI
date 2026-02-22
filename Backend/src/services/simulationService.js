import fetch from "node-fetch"

export const generateSimulationFromAI = async ({
  topicName,
  explanation
}) => {

  const prompt = `Create a complete, highly interactive simulation in a single HTML file.
Topic: ${topicName}

Reference Explanation:
${explanation}

The simulation MUST be designed strictly according to the given explanation.

All variables, formulas, and behaviors must follow the reference explanation.

OUTPUT RULES:
- Return ONLY valid, complete HTML.
- Start directly with <!DOCTYPE html>.
- End with </html>.
- Do NOT add markdown, explanations, or code blocks.

TECHNICAL RULES:
- Use only internal <style> and <script>.
- No external CDN, imports, or frameworks.
- No network requests or APIs.

SCREEN & RESPONSIVENESS:
- Set html, body { margin: 0; padding: 0; width: 100%; height: 100%; box-sizing: border-box; overflow: hidden; font-family: sans-serif; background: #0f172a; color: white; }
- Make the root container fill the full available width and height (100vw x 100vh).
- LAYOUT: Use a two-pane layout for desktop (min-width: 900px).
    - LEFT (or MAIN): Simulation Canvas area. This MUST take 75-80% of the width.
    - RIGHT (or SIDE): Control Panel. This MUST take 20-25% of the width.
- MOBILE: On screens below 900px, switch to a vertical stack.
    - TOP: Simulation Canvas (takes most of the height).
    - BOTTOM: Control Panel (minimal height, sticky/scrollable).
- SCROLLABLE CONTROLS: The Control Panel MUST have "overflow-y: auto" and a slim design. It should be scrollable so it never breaks the layout or gets cut off.

UI & LAYOUT:
- Visual-First: The actual interactive simulation is the hero. It must be as large as possible.
- Purely Interactive: Remove ALL "Explanation Panels," "Formula Summaries," or "Points of Explanation" that take up vertical/horizontal space. 
- Integrated Data: Formulas and variable meanings should only appear as tooltip hints or dynamic labels inside the control panel or canvas, NOT as static text blocks.
- One Visualization Area + One Minimal Controls Section ONLY.

INTERACTIVITY:
- Include sliders, toggles, and inputs for ALL key parameters mentioned in the explanation.
- Real-time updates with smooth requestAnimationFrame animations.
- Clear, high-contrast labels for all controls.

DESIGN:
- Dark, premium aesthetic (consistent with #0f172a / #1e293b).
- Vibrant colors for simulation elements (accent colors like #38bdf8, #818cf8).
- Minimalist, professional interface.

VALIDATION:
- Must run fully offline.
- High performance, low memory usage.
- Follow all layout priorities strictly.`

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
      }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 8192
      }
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
    