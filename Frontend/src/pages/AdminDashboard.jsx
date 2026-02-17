import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"

const API = import.meta.env.VITE_API_BASE_URL

const AdminDashboard = () => {
  const { user } = useAuth()
  const [data, setData] = useState(null)
const [editingSubject, setEditingSubject] = useState(null)
const [editingTopic, setEditingTopic] = useState(null)

const updateSubject = async () => {
  const token = localStorage.getItem('token')
  await fetch(`${API}/api/admin/subject/${editingSubject._id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    credentials: "include",
    body: JSON.stringify({
      name: editingSubject.name,
      level: editingSubject.level
    })
  })

  window.location.reload()
}

const updateTopic = async () => {
  const token = localStorage.getItem('token')
  await fetch(`${API}/api/admin/topic/${editingTopic._id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    credentials: "include",
    body: JSON.stringify({
      name: editingTopic.name,
      level: editingTopic.level
    })
  })

  window.location.reload()
}

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/api/admin/overview`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      })
      const result = await res.json()
      setData(result)
    }
    fetchData()
  }, [])

  const deleteSubject = async (id) => {
    const token = localStorage.getItem('token')
    await fetch(`${API}/api/admin/subject/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: "include"
    })
    window.location.reload()
  }

  const deleteTopic = async (id) => {
    const token = localStorage.getItem('token')
    await fetch(`${API}/api/admin/topic/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: "include"
    })
    window.location.reload()
  }

  if (!data) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white border-b pb-4">
        Admin Dashboard
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Users Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center justify-between">
            Users 
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
              {data.users.length}
            </span>
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {data.users.map(u => (
              <div key={u._id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300 break-all">
                {u.email}
              </div>
            ))}
            {data.users.length === 0 && <p className="text-gray-400 italic">No users found.</p>}
          </div>
        </div>

        {/* Subjects Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center justify-between">
            Subjects
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">
              {data.subjects.length}
            </span>
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {data.subjects.map(s => (
              <div key={s._id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700">
                {editingSubject?._id === s._id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingSubject.name}
                      onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
                      placeholder="Subject Name"
                    />
                    <select
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingSubject.level}
                      onChange={e => setEditingSubject({ ...editingSubject, level: e.target.value })}
                    >
                      <option value="school">School</option>
                      <option value="university">University</option>
                    </select>
                    <div className="flex gap-2 justify-end mt-2">
                       <button 
                        onClick={() => setEditingSubject(null)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={updateSubject}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-blue-600 shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{s.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{s.level}</div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => setEditingSubject(s)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/30 transition-colors"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteSubject(s._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/30 transition-colors"
                        title="Delete"
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
            {data.subjects.length === 0 && <p className="text-gray-400 italic">No subjects found.</p>}
          </div>
        </div>

        {/* Topics Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
           <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center justify-between">
            Topics
            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-emerald-900 dark:text-emerald-300">
              {data.topics.length}
            </span>
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {data.topics.map(t => (
              <div key={t._id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-slate-700">
                {editingTopic?._id === t._id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingTopic.name}
                      onChange={e => setEditingTopic({ ...editingTopic, name: e.target.value })}
                      placeholder="Topic Name"
                    />
                    <select
                      className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                      value={editingTopic.level}
                      onChange={e => setEditingTopic({ ...editingTopic, level: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                     <div className="flex gap-2 justify-end mt-2">
                       <button 
                        onClick={() => setEditingTopic(null)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={updateTopic}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-blue-600 shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{t.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">{t.level}</div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => setEditingTopic(t)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/30 transition-colors"
                        title="Edit"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteTopic(t._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/30 transition-colors"
                        title="Delete"
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
            {data.topics.length === 0 && <p className="text-gray-400 italic">No topics found.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
