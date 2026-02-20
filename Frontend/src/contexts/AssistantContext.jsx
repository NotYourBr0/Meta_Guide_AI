import { createContext, useContext, useState } from 'react'

const AssistantContext = createContext(null)

export const AssistantProvider = ({ children }) => {
  // Current topic/subject context that the assistant knows about
  const [topicContext, setTopicContext] = useState({
    topicName: null,
    topicLevel: null,
    subjectName: null,
  })

  const updateTopicContext = (ctx) => {
    setTopicContext(prev => ({ ...prev, ...ctx }))
  }

  const clearTopicContext = () => {
    setTopicContext({ topicName: null, topicLevel: null, subjectName: null })
  }

  return (
    <AssistantContext.Provider value={{ topicContext, updateTopicContext, clearTopicContext }}>
      {children}
    </AssistantContext.Provider>
  )
}

export const useAssistant = () => {
  const ctx = useContext(AssistantContext)
  if (!ctx) throw new Error('useAssistant must be used inside AssistantProvider')
  return ctx
}
