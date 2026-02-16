import { useState, useEffect, useMemo } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import AddTopicModal from "../components/ui/AddTopicModal"
import { getTopicsBySubject, createTopic } from "../services/api"

const Topics = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const subject = location.state
  const { user } = useAuth()
  
  const [topics, setTopics] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filterLevel, setFilterLevel] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchTopics = async () => {
      const data = await getTopicsBySubject(id)
      setTopics(data)
      setLoading(false)
    }
    fetchTopics()
  }, [id])

  const handleAddTopic = async ({ name, level }) => {
    setError(null)
    setSubmitting(true)
    
    try {
      const newTopic = await createTopic({
        subjectId: id,
        name,
        level
      })
      setTopics(prev => [newTopic, ...prev])
      setShowModal(false)
    } catch (err) {
      setError(err.message || "Failed to create topic")
      console.error("Error creating topic:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const matchesLevel =
        filterLevel === "all" || topic.level === filterLevel

      const matchesSearch =
        topic.name.toLowerCase().includes(search.toLowerCase()) ||
        topic.createdBy?.name.toLowerCase().includes(search.toLowerCase())

      return matchesLevel && matchesSearch
    })
  }, [topics, filterLevel, search])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2 className="text-xl mb-4">{subject?.name}</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowModal(true)}
          disabled={!user}

className={`px-4 py-2 rounded ${ user ? "bg-primary text-white" : "bg-gray-400 cursor-not-allowed"   }     `}
          >
          Add Topic
        </button>

        <div className="flex gap-3">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="border p-2 dark:bg-gray-800"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <input
            type="text"
            placeholder="Search by name or creator"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 dark:bg-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredTopics.map(topic => (
          <div
            key={topic._id}
            onClick={() =>
              navigate(`/topics/${topic._id}`, { state: topic })
            }
            className="border p-4 rounded hover:border-primary cursor-pointer"
          >
            <div className="text-sm text-accent mb-2">
              {topic.createdBy?.name || "Unknown"}
            </div>
            <h3 className="text-lg">{topic.name}</h3>
            <p className="text-sm opacity-70 mt-1">
              {topic.level}
            </p>
          </div>
        ))}
      </div>

      {showModal && (
        <AddTopicModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddTopic}
          submitting={submitting}
        />
      )}
    </div>
  )
}

export default Topics
