const API_BASE = import.meta.env.VITE_API_BASE_URL

/**
 * Centralized fetch wrapper that automatically adds Authorization headers
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
const authFetch = async (url, options = {}) => {
  // Validate URL before attempting fetch
  if (!url || url.includes('undefined') || url.includes('null')) {
    throw new Error(`Invalid URL: ${url}. Check that VITE_API_BASE_URL is set in .env file.`)
  }

  const token = localStorage.getItem('token')
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include"
  })

  // Check for errors and throw with meaningful messages
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
    throw new Error(errorMessage)
  }

  return response
}

// ============= Subject APIs =============

export const getSubjects = async () => {
  const res = await authFetch(`${API_BASE}/api/subjects`, {
    method: "GET"
  })
  return res.json()
}

export const createSubject = async (data) => {
  const res = await authFetch(`${API_BASE}/api/subjects`, {
    method: "POST",
    body: JSON.stringify(data)
  })
  return res.json()
}

// ============= Topic APIs =============

export const getTopicsBySubject = async (subjectId) => {
  const res = await authFetch(`${API_BASE}/api/topics/${subjectId}`, {
    method: "GET"
  })
  return res.json()
}

export const getTopicById = async (topicId) => {
  const res = await authFetch(`${API_BASE}/api/topics/single/${topicId}`, {
    method: "GET"
  })
  return res.json()
}

export const createTopic = async (data) => {
  const res = await authFetch(`${API_BASE}/api/topics`, {
    method: "POST",
    body: JSON.stringify(data)
  })
  return res.json()
}

export const likeTopic = async (topicId) => {
  const res = await authFetch(`${API_BASE}/api/topics/${topicId}/like`, {
    method: "POST"
  })
  return res.json()
}

export const unlikeTopic = async (topicId) => {
  const res = await authFetch(`${API_BASE}/api/topics/${topicId}/like`, {
    method: "DELETE"
  })
  return res.json()
}

// ============= Explanation APIs =============

export const generateExplanation = async (topicId, language) => {
  const res = await authFetch(
    `${API_BASE}/api/explanation/generate/${topicId}`,
    {
      method: "POST",
      body: JSON.stringify({ language })
    }
  )
  return res.json()
}

// ============= Simulation APIs =============

export const generateSimulation = async (topicId, htmlContent) => {
  const res = await authFetch(`${API_BASE}/api/simulation/generate`, {
    method: "POST",
    body: JSON.stringify({
      topicId,
      htmlContent
    })
  })
  return res.json()
}

export const generateSimulationAI = async (topicId) => {
  const res = await authFetch(
    `${API_BASE}/api/simulation/generate-ai/${topicId}`,
    { 
      method: "POST"
    }
  )
  return res.json()
}

// ============= Test APIs =============

export const getAllTests = async () => {
  const res = await authFetch(`${API_BASE}/api/tests`, {
    method: "GET"
  })
  return res.json()
}

export const generateTest = async (topicId) => {
  const res = await authFetch(`${API_BASE}/api/tests/generate-bank/${topicId}`, {
    method: "POST"
  })
  return res.json()
}

export const submitTestScore = async (topicId, score, maxScore) => {
  const res = await authFetch(`${API_BASE}/api/tests/score/${topicId}`, {
    method: "POST",
    body: JSON.stringify({ score, maxScore })
  })
  return res.json()
}

export const getTestHighScore = async (topicId) => {
  const res = await authFetch(`${API_BASE}/api/tests/highscore/${topicId}`, {
    method: "GET"
  })
  return res.json()
}

export const getTopicLeaderboard = async (topicId) => {
  const res = await authFetch(`${API_BASE}/api/tests/leaderboard/${topicId}`, {
    method: "GET"
  })
  return res.json()
}

export const getGlobalLeaderboard = async () => {
  const res = await authFetch(`${API_BASE}/api/tests/global-leaderboard`, {
    method: "GET"
  })
  return res.json()
}

// Fetch randomly selected questions from the question bank
export const getTestQuestions = async (topicId) => {
  const res = await authFetch(`${API_BASE}/api/tests/questions/${topicId}`, {
    method: "GET"
  })
  return res.json()
}

// Trigger generation of 50-question bank for a topic
export const generateQuestionBank = async (topicId) => {
  const res = await authFetch(`${API_BASE}/api/tests/generate-bank/${topicId}`, {
    method: "POST"
  })
  return res.json()
}
