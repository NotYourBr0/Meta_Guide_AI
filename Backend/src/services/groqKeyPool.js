import fetch from "node-fetch"

const groqPoolState = new Map()

const getPoolState = (envVarName) => {
  if (!groqPoolState.has(envVarName)) {
    groqPoolState.set(envVarName, {
      cursor: 0,
      activeLoads: new Map()
    })
  }

  return groqPoolState.get(envVarName)
}

const parseGroqApiKeys = (rawValue = "") =>
  Array.from(
    new Set(
      rawValue
        .split(/[,\r\n]+/)
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )

const getGroqApiKeys = (envVarName) => {
  const keys = parseGroqApiKeys(process.env[envVarName] || "")

  if (!keys.length) {
    throw new Error(`${envVarName} is not configured on the server`)
  }

  const poolState = getPoolState(envVarName)

  keys.forEach((key) => {
    if (!poolState.activeLoads.has(key)) {
      poolState.activeLoads.set(key, 0)
    }
  })

  Array.from(poolState.activeLoads.keys()).forEach((key) => {
    if (!keys.includes(key)) {
      poolState.activeLoads.delete(key)
    }
  })

  return keys
}

const acquireGroqApiKey = (envVarName, excludedKeys = new Set()) => {
  const poolState = getPoolState(envVarName)
  const keys = getGroqApiKeys(envVarName).filter((key) => !excludedKeys.has(key))

  if (!keys.length) {
    return null
  }

  let selectedKey = keys[0]
  let selectedLoad = Number.POSITIVE_INFINITY
  let selectedOffset = 0

  for (let offset = 0; offset < keys.length; offset += 1) {
    const key = keys[(poolState.cursor + offset) % keys.length]
    const activeLoad = poolState.activeLoads.get(key) || 0

    if (activeLoad < selectedLoad) {
      selectedKey = key
      selectedLoad = activeLoad
      selectedOffset = offset
    }
  }

  poolState.cursor = (poolState.cursor + selectedOffset + 1) % keys.length
  poolState.activeLoads.set(selectedKey, (poolState.activeLoads.get(selectedKey) || 0) + 1)

  return {
    key: selectedKey,
    release: () => {
      poolState.activeLoads.set(
        selectedKey,
        Math.max((poolState.activeLoads.get(selectedKey) || 1) - 1, 0)
      )
    }
  }
}

const isGroqKeyFailoverError = (status, bodyText = "") => {
  const normalizedBody = bodyText.toLowerCase()

  return (
    status === 401 ||
    status === 403 ||
    status === 429 ||
    status === 503 ||
    normalizedBody.includes("rate limit") ||
    normalizedBody.includes("quota") ||
    normalizedBody.includes("too many requests") ||
    normalizedBody.includes("invalid api key") ||
    normalizedBody.includes("authentication") ||
    normalizedBody.includes("expired") ||
    normalizedBody.includes("resource_exhausted")
  )
}

const extractRetryAfterMs = (bodyText = "") => {
  const secondsMatch = bodyText.match(/try again in\s+([0-9.]+)s/i)
  if (!secondsMatch) {
    return 0
  }

  return Math.ceil(Number(secondsMatch[1]) * 1000)
}

const wait = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })

const extractGroqMessageText = (responseBody = {}) => {
  const content = responseBody.choices?.[0]?.message?.content

  if (typeof content === "string") {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text || "")
      .join("")
      .trim()
  }

  return ""
}

export const generateGroqTextWithFailover = async ({
  envVarName,
  model,
  maxTokens,
  temperature,
  topP,
  systemPrompt,
  userPrompt,
  timeoutMs = 0,
  timeoutMessage = "AI request timed out"
}) => {
  const totalKeys = getGroqApiKeys(envVarName).length
  let lastError = null
  let rateLimitRetryCount = 0

  while (rateLimitRetryCount <= 4) {
    const exhaustedKeys = new Set()
    let longestRetryAfterMs = 0

    while (exhaustedKeys.size < totalKeys) {
      const lease = acquireGroqApiKey(envVarName, exhaustedKeys)

      if (!lease) {
        break
      }

      const { key, release } = lease

      try {
        const controller = new AbortController()
        const timeoutId = timeoutMs > 0
          ? setTimeout(() => controller.abort(), timeoutMs)
          : null
        let response

        try {
          response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${key}`
            },
            signal: controller.signal,
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userPrompt
                }
              ],
              temperature,
              top_p: topP,
              max_tokens: maxTokens
            })
          })
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
        }

        const responseText = await response.text()

        if (!response.ok) {
          const error = new Error(`AI API Error: ${response.status} - ${responseText}`)
          error.isFailoverError = isGroqKeyFailoverError(response.status, responseText)
          error.retryAfterMs = extractRetryAfterMs(responseText)
          throw error
        }

        const responseBody = JSON.parse(responseText)
        const generatedText = extractGroqMessageText(responseBody)

        if (!generatedText) {
          throw new Error("No content generated from AI")
        }

        return generatedText
      } catch (error) {
        if (error.name === "AbortError") {
          const timeoutError = new Error(timeoutMessage)
          timeoutError.isFailoverError = false
          lastError = timeoutError
          throw timeoutError
        }

        lastError = error

        if (error.isFailoverError) {
          exhaustedKeys.add(key)
          longestRetryAfterMs = Math.max(longestRetryAfterMs, error.retryAfterMs || 0)
          continue
        }

        throw error
      } finally {
        release()
      }
    }

    if (!lastError?.isFailoverError || longestRetryAfterMs <= 0) {
      break
    }

    rateLimitRetryCount += 1
    await wait(longestRetryAfterMs + 500)
  }

  if (lastError) {
    throw lastError
  }

  throw new Error(`No usable API key is available in ${envVarName}`)
}
