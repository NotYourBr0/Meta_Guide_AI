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

  if (!data) return <div>Loading...</div>

  return (
    <div>
      <h2 className="text-2xl mb-6">Super Admin Controls</h2>

      <h3 className="text-xl mt-4">Users</h3>
      {data.users.map(u => (
        <div key={u._id}>{u.email}</div>
      ))}

      <h3 className="text-xl mt-6">Subjects</h3>
      {data.subjects.map(s => (
  <div key={s._id} className="border p-3 mb-2">
    {editingSubject?._id === s._id ? (
      <>
        <input
          value={editingSubject.name}
          onChange={e =>
            setEditingSubject({ ...editingSubject, name: e.target.value })
          }
        />

        <select
          value={editingSubject.level}
          onChange={e =>
            setEditingSubject({ ...editingSubject, level: e.target.value })
          }
        >
          <option value="school">School</option>
          <option value="university">University</option>
        </select>

        <button onClick={updateSubject}>Save</button>
        <button onClick={() => setEditingSubject(null)}>Cancel</button>
      </>
    ) : (
      <div className="flex justify-between">
        <span>{s.name} ({s.level})</span>
        <div className="flex gap-2">
          <button onClick={() => setEditingSubject(s)}>Edit</button>
          <button onClick={() => deleteSubject(s._id)}>Delete</button>
        </div>
      </div>
    )}
  </div>
))}


      <h3 className="text-xl mt-6">Topics</h3>
      {data.topics.map(t => (
  <div key={t._id} className="border p-3 mb-2">
    {editingTopic?._id === t._id ? (
      <>
        <input
          value={editingTopic.name}
          onChange={e =>
            setEditingTopic({ ...editingTopic, name: e.target.value })
          }
        />

        <select
          value={editingTopic.level}
          onChange={e =>
            setEditingTopic({ ...editingTopic, level: e.target.value })
          }
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <button onClick={updateTopic}>Save</button>
        <button onClick={() => setEditingTopic(null)}>Cancel</button>
      </>
    ) : (
      <div className="flex justify-between">
        <span>{t.name} ({t.level})</span>
        <div className="flex gap-2">
          <button onClick={() => setEditingTopic(t)}>Edit</button>
          <button onClick={() => deleteTopic(t._id)}>Delete</button>
        </div>
      </div>
    )}
  </div>
))}

    </div>
  )
}

export default AdminDashboard
