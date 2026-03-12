import fetch from "node-fetch"

export const generateSimulationFromAI = async ({
  subjectName,
  subjectBranch,
  subjectUniversity,
  subjectSemester,
  subjectCode,
  syllabusContext,
  topicName,
  topicLevel,
  explanation
}) => {
  const trimmedExplanation = explanation ? explanation.slice(0, 7000) : ""
  const trimmedSyllabusContext = syllabusContext ? syllabusContext.slice(0, 4000) : ""

  const prompt = `You are an expert educational simulation engineer. Build a serious, polished, single-file HTML5 simulation for one topic.

Subject: ${subjectName || "Unknown"}
Branch: ${subjectBranch || "Unknown"}
University: ${subjectUniversity || "Unknown"}
Semester: ${subjectSemester || "Unknown"}
Course Code: ${subjectCode || "Unknown"}
Topic: ${topicName}
Difficulty: ${topicLevel || "advanced"}

SYLLABUS CONTEXT:
${trimmedSyllabusContext || "No syllabus context provided."}

REFERENCE EXPLANATION:
${trimmedExplanation}

GOAL:
- Create one focused interactive simulation that teaches the core mechanism of "${topicName}".
- Stay faithful to the provided explanation and syllabus context.
- Do not generate a generic science-fair dashboard or random decorative widgets.
- Every control, formula, output, unit, and label must be traceable to the explanation or syllabus context.
- Do not introduce unknown variables, unexplained constants, fictional measurements, or outside concepts.

OUTPUT RULES:
- Return ONLY complete HTML.
- Start with <!DOCTYPE html> and end with </html>.
- No markdown fences, no commentary, no explanations outside the HTML.
- Include a proper <meta name="viewport" content="width=device-width, initial-scale=1"> tag.

TECHNICAL RULES:
- Use only HTML, CSS, and vanilla JavaScript.
- No external libraries, no CDNs, no network requests, no iframes inside the simulation.
- Keep all CSS in a <style> tag and all JS in a <script> tag.
- The code must run fully offline.

LAYOUT RULES:
- The page must fit entirely inside the viewport with no horizontal overflow.
- Use a root app shell that fills the viewport and uses CSS grid or flex.
- On desktop, use a two-column layout:
  1. Simulation stage / canvas area
  2. Compact control panel
- On tablet and mobile, stack vertically with the simulation first and the control panel below.
- The control panel must remain readable and scroll independently if needed.
- Never let controls overlap the canvas content.
- Never position panels off-screen.
- Avoid oversized headers, huge margins, or fixed elements that cover content.

RESPONSIVENESS RULES:
- Use responsive CSS with breakpoints for <= 1024px and <= 640px.
- Support touch devices.
- All controls must remain visible and tappable on mobile.
- The simulation stage must resize with the viewport.
- Canvas, SVG, charts, and labels must scale within their containers.
- No clipped labels, no cut-off panels, no hidden critical controls.

INTERACTION RULES:
- Include only the controls that actually matter to understanding the topic.
- Prefer 2 to 5 meaningful controls, not a cluttered wall of sliders.
- Show live numeric values beside controls.
- Include a reset button.
- Add clear labels for inputs and outputs.
- If the topic benefits from animation, provide play/pause support.

VISUAL RULES:
- Use a clean professional interface, not neon gimmicks.
- Use restrained modern colors with strong contrast.
- Prioritize clarity over decoration.
- Use concise instructional text only where necessary.
- Keep the interface academic and product-quality.

SIMULATION QUALITY RULES:
- The simulation must reflect the actual topic logic from the reference explanation.
- Restrict the simulation scope to the matched syllabus coverage for this subject.
- Separate model/update logic from rendering logic.
- If formulas are involved, show the currently computed outputs.
- If motion or geometry is involved, animate it smoothly and keep it stable at different sizes.
- If the topic is conceptual, build an interactive visualization instead of a static text page.
- If the topic includes experiments or lab-style observations in the syllabus, prefer a controlled experiment-style simulation.

ROBUSTNESS RULES:
- Include CSS reset for box-sizing.
- Prevent horizontal scrolling.
- Ensure the page works inside an iframe.
- Use ResizeObserver or window resize handling so the simulation redraws correctly.
- Do not rely on absolute positioning unless strictly necessary and bounded by containers.
- Keep the total HTML size reasonable and the code maintainable.

FINAL CHECK BEFORE OUTPUT:
- Verify the HTML is complete.
- Verify it is responsive.
- Verify nothing overlaps or gets cut off on mobile or desktop.
- Verify the simulation can be understood and used without layout breakage.
- Verify every displayed value and concept is defined by the explanation or syllabus context.
- Return only the final HTML.`

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
        temperature: 0.3,
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
    
