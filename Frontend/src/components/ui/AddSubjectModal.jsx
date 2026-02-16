import { useState } from "react"

const AddSubjectModal = ({ onClose, onAdd, submitting = false }) => {
  const [name, setName] = useState("")
  const [level, setLevel] = useState("school")

  const handleSubmit = () => {
    if (!name.trim() || submitting) return
    onAdd({ name, level })
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
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full border p-2 mb-4 dark:bg-gray-800"
        >
          <option value="school">School Level</option>
          <option value="university">University Level</option>
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
