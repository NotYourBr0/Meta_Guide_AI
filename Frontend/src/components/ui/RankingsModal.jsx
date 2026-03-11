import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getTopicLeaderboard } from "../../services/api"

const RANK_COLORS = {
  1: "from-yellow-400/20 to-yellow-500/5 border-yellow-400/40",
  2: "from-gray-300/20 to-gray-400/5 border-gray-300/40",
  3: "from-orange-400/20 to-orange-500/5 border-orange-400/40"
}

const RankingsModal = ({ topic, onClose }) => {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchLeaderboard = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const data = await getTopicLeaderboard(topic._id)
      setLeaderboard(data)
      setLastUpdated(new Date())
    } catch {
      // ignore refresh failures
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [topic._id])

  useEffect(() => {
    fetchLeaderboard(false)
  }, [fetchLeaderboard])

  useEffect(() => {
    const interval = setInterval(() => fetchLeaderboard(true), 10000)
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

  const formatTime = (date) => {
    if (!date) {
      return ""
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b bg-gradient-to-r from-primary/10 to-transparent px-5 pb-4 pt-5 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">Rankings</h2>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full bg-green-500 ${isRefreshing ? "animate-ping" : "animate-pulse"}`} />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
                </div>
              </div>
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">{topic.name}</p>
              {lastUpdated && (
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-600">
                  Updated {formatTime(lastUpdated)} | refreshes every 10s
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              x
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 120px)" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-gray-400">Loading rankings...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
              <p className="font-medium">No scores yet</p>
              <p className="text-sm">Be the first to take this test.</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {leaderboard.map((entry) => {
                const isCurrentUser = user && entry.userId === user._id?.toString()
                const rankColor = RANK_COLORS[entry.rank] || ""
                const isTopThree = entry.rank <= 3

                return (
                  <div
                    key={entry.userId}
                    className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                      isTopThree
                        ? `bg-gradient-to-r ${rankColor}`
                        : "border-gray-100 bg-gray-50 dark:border-gray-700/50 dark:bg-gray-800/50"
                    } ${isCurrentUser ? "ring-2 ring-primary/50" : ""}`}
                  >
                    <div className="w-9 flex-shrink-0 text-center">
                      <span className={`text-sm font-bold ${isTopThree ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                        #{entry.rank}
                      </span>
                    </div>

                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                        isCurrentUser
                          ? "bg-gradient-to-br from-primary to-primary/60"
                          : "bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800"
                      }`}
                    >
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        entry.name[0]?.toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${isCurrentUser ? "text-primary" : "text-gray-900 dark:text-white"}`}>
                        {entry.name}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs font-normal text-primary/70">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {entry.attemptCount} attempt{entry.attemptCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className={`text-sm font-bold ${isTopThree ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {entry.highScore}
                        <span className="text-xs font-normal text-gray-400">/{entry.maxScore}</span>
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        <div className="h-1 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-1 rounded-full ${
                              entry.percent >= 80 ? "bg-green-500" : entry.percent >= 50 ? "bg-yellow-500" : "bg-red-400"
                            }`}
                            style={{ width: `${entry.percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{entry.percent}%</span>
                      </div>
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
