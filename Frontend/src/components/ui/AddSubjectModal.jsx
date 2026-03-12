import { useState } from "react"
import { RTU_BRANCH_OPTIONS } from "../../constants/rtu"

const AddSubjectModal = ({ onClose, onAdd, submitting = false }) => {
  const [name, setName] = useState("")
  const [university, setUniversity] = useState("RTU")
  const [branch, setBranch] = useState("Computer Science & Engineering")

  const handleSubmit = () => {
    if (!name.trim() || submitting) return
    onAdd({
      name,
      university,
      branch
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-darkbg">
        <h2 className="mb-4 text-lg font-semibold">Add Subject</h2>

        <input
          type="text"
          placeholder="Subject name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-3 w-full rounded-lg border p-2.5 dark:bg-gray-800"
        />

        <select
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="mb-3 w-full rounded-lg border p-2.5 dark:bg-gray-800"
        >
          <option value="RTU">RTU</option>
        </select>

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="mb-3 w-full rounded-lg border p-2.5 dark:bg-gray-800"
        >
          {RTU_BRANCH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Semester will be identified automatically from the matched RTU syllabus.
        </div>

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
