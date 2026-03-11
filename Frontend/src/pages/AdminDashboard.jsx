import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const API = import.meta.env.VITE_API_BASE_URL

const normalizeSubjectName = (value = "") =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const AdminDashboard = () => {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [editingSubject, setEditingSubject] = useState(null)
  const [editingTopic, setEditingTopic] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [snackbar, setSnackbar] = useState("")

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  }

  const fetchOverview = useCallback(async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/admin/overview`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: "include"
    })

    const result = await res.json()
    if (!res.ok) {
      throw new Error(result.error || result.message || "Failed to load admin overview")
    }

    setData(result)
  }, [])

  const updateSubject = async () => {
    try {
      setActionError(null)
      const duplicateExists = data.subjects.some((subject) =>
        subject._id !== editingSubject._id &&
        (subject.university || "RTU") === (editingSubject.university || "RTU") &&
        Number(subject.semester) === Number(editingSubject.semester) &&
        normalizeSubjectName(subject.name) === normalizeSubjectName(editingSubject.name)
      )

      if (duplicateExists) {
        setSnackbar(
          `That subject already exists for ${(editingSubject.university || "RTU")} semester ${editingSubject.semester}.`
        )
        return
      }

      const res = await fetch(`${API}/api/admin/subject/${editingSubject._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          name: editingSubject.name,
          university: editingSubject.university,
          semester: Number(editingSubject.semester)
        })
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Failed to update subject")
      }
      setEditingSubject(null)
      await fetchOverview()
    } catch (error) {
      if ((error.message || "").toLowerCase().includes("already exists")) {
        setSnackbar(error.message)
      }
      setActionError(error.message)
    }
  }

  const updateTopic = async () => {
    try {
      setActionError(null)
      const res = await fetch(`${API}/api/admin/topic/${editingTopic._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          name: editingTopic.name,
          level: editingTopic.level
        })
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Failed to update topic")
      }
      setEditingTopic(null)
      await fetchOverview()
    } catch (error) {
      setActionError(error.message)
    }
  }

  useEffect(() => {
    fetchOverview().catch((error) => {
      setActionError(error.message)
    })
  }, [fetchOverview])

  useEffect(() => {
    if (!snackbar) {
      return undefined
    }

    const timeoutId = setTimeout(() => setSnackbar(""), 3200)
    return () => clearTimeout(timeoutId)
  }, [snackbar])

  const deleteSubject = async (id) => {
    try {
      setActionError(null)
      const res = await fetch(`${API}/api/admin/subject/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        credentials: "include"
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Failed to delete subject")
      }
      await fetchOverview()
    } catch (error) {
      setActionError(error.message)
    }
  }

  const deleteTopic = async (id) => {
    try {
      setActionError(null)
      const res = await fetch(`${API}/api/admin/topic/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        credentials: "include"
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || "Failed to delete topic")
      }
      await fetchOverview()
    } catch (error) {
      setActionError(error.message)
    }
  }

  if (!data) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white border-b pb-4">
        {t("admin.title")}
      </h2>

      {snackbar && (
        <div className="fixed bottom-24 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl sm:bottom-6 sm:right-24 sm:max-w-sm dark:bg-slate-100 dark:text-slate-900">
          {snackbar}
        </div>
      )}

      {actionError && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          <strong>Error:</strong> {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Users Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center justify-between flex-shrink-0">
            {t("admin.users")}
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
              {data.users.length}
            </span>
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[250px]">
            {data.users.map(u => (
              <div key={u._id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300 break-all">
                {u.email}
              </div>
            ))}
            {data.users.length === 0 && <p className="text-gray-400 italic">{t("admin.noUsers")}</p>}
          </div>
        </div>

        {/* Subjects Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center justify-between flex-shrink-0">
            {t("admin.subjects")}
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">
              {data.subjects.length}
            </span>
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[250px]">
            {data.subjects.map(s => (
              <div key={s._id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700">
                {editingSubject?._id === s._id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingSubject.name}
                      onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
                      placeholder={t("admin.subjectName")}
                    />
                    <select
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingSubject.university || "RTU"}
                      onChange={e => setEditingSubject({ ...editingSubject, university: e.target.value })}
                    >
                      <option value="RTU">RTU</option>
                    </select>
                    <select
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingSubject.semester || 1}
                      onChange={e => setEditingSubject({ ...editingSubject, semester: Number(e.target.value) })}
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Semester 3</option>
                      <option value="4">Semester 4</option>
                      <option value="5">Semester 5</option>
                      <option value="6">Semester 6</option>
                      <option value="7">Semester 7</option>
                      <option value="8">Semester 8</option>
                    </select>
                    <div className="flex gap-2 justify-end mt-2">
                      <button 
                        onClick={() => setEditingSubject(null)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {t("admin.cancel")}
                      </button>
                      <button 
                        onClick={updateSubject}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-blue-600 shadow-sm"
                      >
                        {t("admin.save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{s.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                        {(s.university || "RTU")} | Semester {s.semester || "?"}
                      </div>
                      {s.courseCode && (
                        <div className="text-xs text-gray-400 mt-1">{s.courseCode}</div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => setEditingSubject(s)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/30 transition-colors"
                        title={t("admin.edit")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteSubject(s._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/30 transition-colors"
                        title={t("admin.delete")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {data.subjects.length === 0 && <p className="text-gray-400 italic">{t("admin.noSubjects")}</p>}
          </div>
        </div>

        {/* Topics Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center justify-between flex-shrink-0">
            {t("admin.topics")}
            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-emerald-900 dark:text-emerald-300">
              {data.topics.length}
            </span>
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[250px]">
            {data.topics.map(topic => (
              <div key={topic._id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700">
                {editingTopic?._id === topic._id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingTopic.name}
                      onChange={e => setEditingTopic({ ...editingTopic, name: e.target.value })}
                      placeholder={t("admin.topicName")}
                    />
                    <select
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingTopic.level}
                      onChange={e => setEditingTopic({ ...editingTopic, level: e.target.value })}
                    >
                      <option value="beginner">{t("tests.search.levels.beginner")}</option>
                      <option value="intermediate">{t("tests.search.levels.intermediate")}</option>
                      <option value="advanced">{t("tests.search.levels.advanced")}</option>
                    </select>
                    <div className="flex gap-2 justify-end mt-2">
                      <button 
                        onClick={() => setEditingTopic(null)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {t("admin.cancel")}
                      </button>
                      <button 
                        onClick={updateTopic}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-blue-600 shadow-sm"
                      >
                        {t("admin.save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{topic.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{topic.level}</div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => setEditingTopic(topic)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/30 transition-colors"
                        title={t("admin.edit")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteTopic(topic._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/30 transition-colors"
                        title={t("admin.delete")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {data.topics.length === 0 && <p className="text-gray-400 italic">{t("admin.noTopics")}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
