import express from 'express'
import fetch from 'node-fetch'

const router = express.Router()

/**
 * POST /api/assistant/chat
 * Body: { messages: [{role, content}], topicName, topicLevel, subjectName }
 * Streams the Gemini response as Server-Sent Events (text/event-stream).
 */
router.post('/chat', async (req, res) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_ASSISTANT_API_KEY
    const GEMINI_MODEL = 'gemini-3-flash-preview'
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`

    const { messages = [], topicName, topicLevel, subjectName } = req.body

    // Build context-aware system instruction
    const contextParts = []
    if (subjectName) contextParts.push(`Subject: "${subjectName}"`)
    if (topicName)   contextParts.push(`Topic: "${topicName}"`)
    if (topicLevel)  contextParts.push(`Difficulty level: ${topicLevel}`)

    const contextLine = contextParts.length
      ? `The user is currently studying — ${contextParts.join(', ')}.`
      : 'The user is browsing the MetaGuide AI learning platform.'

    const difficultyGuidance =
      topicLevel === 'beginner'
        ? 'Use super simple language, everyday analogies, and avoid jargon. Think "explain to a 10-year-old" energy.'
        : topicLevel === 'intermediate'
        ? 'Use clear language with some technical terms, but always back them up with a quick example.'
        : topicLevel === 'advanced'
        ? 'You can go deep and technical, but still keep it engaging and use real-world examples.'
        : 'Adapt your explanation depth based on what the user seems to need.'

    const systemInstruction = `You are the MetaGuide AI Assistant — basically the user's smartest, chillest best friend who happens to know everything about everything.

${contextLine}

Your vibe:
- Talk like a real friend texting, not a textbook or a corporate bot
- Be funny, relatable, and occasionally drop a meme-worthy analogy
- No buttering, no "Great question!", no "Certainly!" — just get to the point
- Use emojis sparingly but naturally (like a friend would)
- Keep answers concise unless the user clearly wants depth
- Always give at least one concrete example when explaining concepts
- If you don't know something, just say so honestly

Explanation style for this topic:
${difficultyGuidance}

Format your responses cleanly:
- Use **bold** for key terms
- Use bullet points or numbered lists when listing things
- Use \`code blocks\` for any code
- Keep paragraphs short (2-3 lines max)

Remember: you're their study buddy, not their professor. Make learning fun!`

    // Convert messages to Gemini format (skip system messages, map roles)
    const geminiContents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

    // Gemini requires alternating user/model turns — ensure last message is user
    if (geminiContents.length === 0 || geminiContents[geminiContents.length - 1].role === 'model') {
      geminiContents.push({ role: 'user', parts: [{ text: 'Hello' }] })
    }

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.65,
        topP: 0.9,
        maxOutputTokens: 768
      }
    }

    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini API error:', errText)
      return res.status(502).json({ error: 'AI service error', details: errText })
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    // Pipe Gemini SSE → client SSE
    const body = geminiResponse.body
    let buffer = ''

    body.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      const lines = buffer.split('\n')
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw || raw === '[DONE]') continue

        try {
          const parsed = JSON.parse(raw)
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`)
          }
        } catch {
          // incomplete JSON chunk — ignore
        }
      }
    })

    body.on('end', () => {
      // Flush remaining buffer
      if (buffer.startsWith('data: ')) {
        const raw = buffer.slice(6).trim()
        if (raw && raw !== '[DONE]') {
          try {
            const parsed = JSON.parse(raw)
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`)
            }
          } catch { /* ignore */ }
        }
      }
      res.write('data: [DONE]\n\n')
      res.end()
    })

    body.on('error', (err) => {
      console.error('Gemini stream error:', err)
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
      res.end()
    })

    req.on('close', () => {
      body.destroy()
    })

  } catch (err) {
    console.error('Gemini assistant route error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: err.message })
    }
  }
})

export default router
