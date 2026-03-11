import { useState } from "react"

const AddSubjectModal = ({ onClose, onAdd, submitting = false }) => {
  const [name, setName] = useState("")
  const [university, setUniversity] = useState("RTU")
  const [semester, setSemester] = useState("1")

  const handleSubmit = () => {
    if (!name.trim() || submitting) return
    onAdd({
      name,
      university,
      semester: Number(semester)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-darkbg p-6 rounded w-80">
        <h2 className="text-lg mb-4">Add Subject</h2>

        <input
          type="text"
          placeholder="Subject name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 mb-3 dark:bg-gray-800"
        />

        <select
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="w-full border p-2 mb-4 dark:bg-gray-800"
        >
          <option value="RTU">RTU</option>
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="w-full border p-2 mb-4 dark:bg-gray-800"
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

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-3 py-1 bg-primary text-white rounded ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddSubjectModal
