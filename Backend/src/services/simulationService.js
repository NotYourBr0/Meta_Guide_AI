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

Return ONLY valid, complete HTML.

Do NOT add explanations outside the simulation.

Do NOT add markdown.

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

No external fonts or assets.

SCREEN & RESPONSIVENESS:

Optimize layout for laptops and desktops.

Minimum width: 1000px.

Not required to support mobile phones.

Prevent layout collapse on small screens.

Show a centered warning message on screens below 900px width.

UI & LAYOUT:

Use Flexbox or Grid.

Fixed simulation panel.

Dedicated control panel.

Stable layout with no jumping.

INTERACTIVITY:

Include multiple sliders, toggles, and inputs.

All parameters update in real time.

Visual feedback for every change.

Smooth transitions.

No page reload.

EXPLANATION INSIDE SIMULATION:

Include an integrated explanation panel.

Show formulas and variable meanings.

Highlight active values live.

Sync explanations with user input.

No external text outside the UI.

PERFORMANCE:

Use requestAnimationFrame for animation.

Avoid unnecessary DOM updates.

Optimize calculations.

Keep memory usage low.

DESIGN:

Clean, professional interface.

High contrast.

Readable typography.

Consistent spacing.

No visual clutter.

CONTENT RULES:

Include ONLY:

Simulation canvas/visual area

Control panel

Explanation panel

No:

Headers

Credits

Footer

Ads

Placeholder text

STRUCTURE REQUIREMENT:

One main container

One visualization area

One controls section

One explanation section

VALIDATION:

Must run fully offline.

Must pass HTML validation.

No unused code.

No dead variables.

No dead functions.

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
    