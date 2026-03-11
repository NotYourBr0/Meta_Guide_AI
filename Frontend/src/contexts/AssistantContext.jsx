import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AssistantContext = createContext(null)

export const AssistantProvider = ({ children }) => {
  // Current topic/subject context that the assistant knows about
  const [topicContext, setTopicContext] = useState({
    topicName: null,
    topicLevel: null,
    subjectName: null,
    topicExplanation: null,
  })

  const updateTopicContext = useCallback((ctx) => {
    setTopicContext(prev => ({ ...prev, ...ctx }))
  }, [])

  const clearTopicContext = useCallback(() => {
    setTopicContext({
      topicName: null,
      topicLevel: null,
      subjectName: null,
      topicExplanation: null
    })
  }, [])

  const value = useMemo(
    () => ({ topicContext, updateTopicContext, clearTopicContext }),
    [topicContext, updateTopicContext, clearTopicContext]
  )

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export const useAssistant = () => {
  const ctx = useContext(AssistantContext)
  if (!ctx) throw new Error('useAssistant must be used inside AssistantProvider')
  return ctx
}
