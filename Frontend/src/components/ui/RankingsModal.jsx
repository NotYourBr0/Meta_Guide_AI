import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getTopicLeaderboard } from "../../services/api"

const RankingsModal = ({ topic, onClose }) => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTopicLeaderboard(topic._id)
      setLeaderboard(data)
      setLastUpdated(new Date())
    } catch {
      // ignore refresh failures
    } finally {
      setLoading(false)
    }
  }, [topic._id])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  useEffect(() => {
    const interval = setInterval(fetchLeaderboard, 10000)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rankings</h2>
              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{topic.name}</p>
              {lastUpdated && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 110px)" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-gray-400 dark:text-gray-500">Loading rankings...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400 dark:text-gray-500">
              <p className="font-medium">No scores yet</p>
              <p className="text-sm">Be the first to take this test.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {leaderboard.map((entry) => {
                const isCurrentUser = user && entry.userId === user._id?.toString()

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 px-5 py-4 ${isCurrentUser ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                  >
                    <div className="w-10 text-sm font-semibold text-gray-500 dark:text-gray-400">#{entry.rank}</div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        entry.name[0]?.toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${isCurrentUser ? "text-primary" : "text-gray-900 dark:text-white"}`}>
                        {entry.name}
                        {isCurrentUser && <span className="ml-1 text-xs font-normal">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.attemptCount} attempt{entry.attemptCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {entry.highScore}
                        <span className="ml-1 text-xs font-normal text-gray-400">/ {entry.maxScore}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.percent}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RankingsModal
