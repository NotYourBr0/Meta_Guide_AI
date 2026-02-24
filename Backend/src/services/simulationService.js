import fetch from "node-fetch"

export const generateSimulationFromAI = async ({
  topicName,
  explanation
}) => {

  const prompt = `System Role: Act as an expert Full-Stack Developer and Educational Simulation Designer. Your goal is to create a complete, high-performance, single-file HTML5 simulation.

Topic: ${topicName}
Reference Logic: ${explanation}

CORE ARCHITECTURAL RULES:

Output Format: Return ONLY valid, complete HTML. Start with <!DOCTYPE html> and end with </html>. Do not include markdown wrappers, conversational filler, or code blocks.

Zero-Dependency Policy: Use only Vanilla JS and the Canvas API. No external libraries, no CDNs (including Tailwind), and no network requests. All styling must be in internal <style> tags.

Math Kernel: Implement a dedicated calculation engine based strictly on the provided Reference Logic. Separate the physics/logic updates from the requestAnimationFrame render loop.

LAYOUT & RESPONSIVENESS (Strict Implementation):

Desktop (Min-width: 1024px): * Main Viewport (Left): 75% width. This is the "Hero" area for the <canvas>.

Control Panel (Right): 25% width. Fixed-width sidebar to prevent content squishing.

Mobile (Below 1024px): * Vertical stack. Viewport on top (60% height), Control Panel on bottom (40% height, scrollable).

Container: width: 100vw; height: 100vh; overflow: hidden; to ensure a "web app" feel.

UI & VISUAL AESTHETICS:

Theme: Premium Dark Mode.

Background: #0a0a0c | Surface/Cards: #151518 | Accent: #6366f1 (Indigo) or #38bdf8 (Sky).

Interface: Use a minimalist "Glassmorphism" design for overlays. Use monospace fonts (JetBrains Mono or Courier New) for real-time numerical readouts.

Visual-First: Eliminate all static "Text Explanations." The simulation must explain itself through interaction. Use dynamic labels, tooltips, and a "Live Analytics" HUD overlaying the canvas.

INTERACTIVE FEATURES:

Dynamic Controls: Range sliders for ALL variables in the logic.

Real-time Feedback: Sliders must include live value displays. Include "Toggle Switches" for different modes/theories mentioned in the explanation.

Viewport Control: If the topic is spatial, include sliders for Camera Zoom, Rotation, and Pitch to manipulate the Canvas view.

Analytics Card: A small, high-contrast data table within the Control Panel showing real-time outputs of the formulas.

PERFORMANCE VALIDATION:

Must run 100% offline.

Optimized for 60fps rendering with low CPU overhead.

The code must be production-ready, clean, and fully commented internally.`

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
    