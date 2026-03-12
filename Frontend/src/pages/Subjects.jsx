import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import AddSubjectModal from "../components/ui/AddSubjectModal"
import { SEMESTER_OPTIONS } from "../constants/rtu"
import { getSubjects, createSubject } from "../services/api"

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

  const handleAddSubject = async ({ name, university, branch }) => {
    setError(null)
    setSubmitting(true)
    
    try {
      const newSubject = await createSubject({ name, university, branch })
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
        `${subject.courseCode || ""}`.toLowerCase().includes(search.toLowerCase()) ||
        `${subject.branch || ""}`.toLowerCase().includes(search.toLowerCase())

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
      
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <button
          onClick={() => setShowModal(true)}
          disabled={!user}
          className={`px-4 py-2 rounded ${user ? "bg-primary text-white" : "bg-gray-400 cursor-not-allowed"}`}
        >
          {t("subjects.addSubject")}
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
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
            {SEMESTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredSubjects.map(subject => (
          <div
            key={subject._id}
            onClick={() =>
              navigate(`/subjects/${subject._id}`, { state: subject })
            }
            className="cursor-pointer rounded-2xl border p-4 transition hover:border-primary"
          >
            <div className="mb-3 text-sm text-accent">
              {subject.createdBy?.name || t("subjects.unknown")}
            </div>

            <h3 className="text-lg font-semibold">{subject.name}</h3>
            <p className="mt-2 text-sm opacity-70">
              {(subject.university || "RTU")} | {subject.branch || "Unknown Branch"}
            </p>
            <p className="mt-1 text-sm opacity-70">Semester {subject.semester || "?"}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {subject.courseCode && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {subject.courseCode}
                </span>
              )}
            </div>
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
