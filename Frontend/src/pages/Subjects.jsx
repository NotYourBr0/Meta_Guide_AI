import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import AddSubjectModal from "../components/ui/AddSubjectModal"
import { getSubjects, createSubject } from "../services/api"

const normalizeSubjectName = (value = "") =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const Subjects = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [subjects, setSubjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filterUniversity, setFilterUniversity] = useState("all")
  const [filterSemester, setFilterSemester] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState("")

  useEffect(() => {
    const fetchSubjects = async () => {
      const data = await getSubjects()
      setSubjects(data)
      setLoading(false)
    }
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (!snackbar) {
      return undefined
    }

    const timeoutId = setTimeout(() => setSnackbar(""), 3200)
    return () => clearTimeout(timeoutId)
  }, [snackbar])

  const handleAddSubject = async ({ name, university, semester }) => {
    setError(null)
    setSubmitting(true)
    
    try {
      const normalizedName = normalizeSubjectName(name)
      const duplicateExists = subjects.some((subject) =>
        (subject.university || "") === university &&
        Number(subject.semester) === Number(semester) &&
        normalizeSubjectName(subject.name) === normalizedName
      )

      if (duplicateExists) {
        setSnackbar(`That subject already exists for ${university} semester ${semester}.`)
        setSubmitting(false)
        return
      }

      const newSubject = await createSubject({ name, university, semester })
      setSubjects(prev => [newSubject, ...prev])
      setShowModal(false)
    } catch (err) {
      if ((err.message || "").toLowerCase().includes("already exists")) {
        setSnackbar(err.message)
      }
      setError(err.message || t("subjects.errorCreate"))
      console.error("Error creating subject:", err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const matchesUniversity =
        filterUniversity === "all" || (subject.university || "") === filterUniversity

      const matchesSemester =
        filterSemester === "all" || String(subject.semester) === filterSemester

      const matchesSearch =
        subject.name.toLowerCase().includes(search.toLowerCase()) ||
        (subject.createdBy?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        `${subject.university || ""}`.toLowerCase().includes(search.toLowerCase()) ||
        `${subject.courseCode || ""}`.toLowerCase().includes(search.toLowerCase())

      return matchesUniversity && matchesSemester && matchesSearch
    })
  }, [subjects, filterUniversity, filterSemester, search])

  if (loading) return <div>{t("subjects.loading")}</div>

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {snackbar && (
        <div className="fixed bottom-24 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl sm:bottom-6 sm:right-24 sm:max-w-sm dark:bg-slate-100 dark:text-slate-900">
          {snackbar}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowModal(true)}
          disabled={!user}
          className={`px-4 py-2 rounded ${user ? "bg-primary text-white" : "bg-gray-400 cursor-not-allowed"}`}
        >
          {t("subjects.addSubject")}
        </button>

        <div className="flex gap-3">
          <select
            value={filterUniversity}
            onChange={(e) => setFilterUniversity(e.target.value)}
            className="border p-2 dark:bg-gray-800"
          >
            <option value="all">All Universities</option>
            <option value="RTU">RTU</option>
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="border p-2 dark:bg-gray-800"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>

          <input
            type="text"
            placeholder={t("subjects.searchPlaceholder")}
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
              {subject.createdBy?.name || t("subjects.unknown")}
            </div>
            <h3 className="text-lg">{subject.name}</h3>
            <p className="text-sm opacity-70 mt-1">{subject.university || "RTU"} | Semester {subject.semester || "?"}</p>
            {subject.courseCode && (
              <p className="text-xs opacity-60 mt-1">{subject.courseCode}</p>
            )}
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
