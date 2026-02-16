import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import AddSubjectModal from "../components/ui/AddSubjectModal"
import { getSubjects, createSubject } from "../services/api"

const Subjects = () => {
  const navigate = useNavigate()
const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filterLevel, setFilterLevel] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchSubjects = async () => {
      const data = await getSubjects()
      setSubjects(data)
      setLoading(false)
    }
    fetchSubjects()
  }, [])

  const handleAddSubject = async ({ name, level }) => {
    setError(null)
    setSubmitting(true)
    
    try {
      const newSubject = await createSubject({ name, level })
      setSubjects(prev => [newSubject, ...prev])
      setShowModal(false)
    } catch (err) {
      setError(err.message || "Failed to create subject")
      console.error("Error creating subject:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const matchesLevel =
        filterLevel === "all" || subject.level === filterLevel

      const matchesSearch =
        subject.name.toLowerCase().includes(search.toLowerCase()) ||
        subject.createdBy?.name.toLowerCase().includes(search.toLowerCase())

      return matchesLevel && matchesSearch
    })
  }, [subjects, filterLevel, search])

  if (loading) return <div>Loading...</div>

  return (
    <div>
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
          Add Subject
        </button>

        <div className="flex gap-3">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="border p-2 dark:bg-gray-800"
          >
            <option value="all">All Levels</option>
            <option value="school">School</option>
            <option value="university">University</option>
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
        {filteredSubjects.map(subject => (
          <div
            key={subject._id}
            onClick={() =>
              navigate(`/subjects/${subject._id}`, { state: subject })
            }
            className="border p-4 rounded hover:border-primary cursor-pointer"
          >
            <div className="text-sm text-accent mb-2">
              {subject.createdBy?.name || "Unknown"}
            </div>
            <h3 className="text-lg">{subject.name}</h3>
            <p className="text-sm opacity-70 mt-1">
              {subject.level}
            </p>
          </div>
        ))}
      </div>

      {showModal && (
        <AddSubjectModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddSubject}
          submitting={submitting}
        />
      )}
    </div>
  )
}

export default Subjects
