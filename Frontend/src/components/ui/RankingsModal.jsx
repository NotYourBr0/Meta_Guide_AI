import { useState, useEffect, useCallback } from "react"
import { getTopicLeaderboard } from "../../services/api"
import { useAuth } from "../../context/AuthContext"

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" }
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
    if (!silent) setLoading(true)
    else setIsRefreshing(true)
    try {
      const data = await getTopicLeaderboard(topic._id)
      setLeaderboard(data)
      setLastUpdated(new Date())
    } catch (err) {
      // silently fail on auto-refresh
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [topic._id])

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard(false)
  }, [fetchLeaderboard])

  // Auto-poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchLeaderboard(true), 10000)
    return () => clearInterval(interval)
  }, [fetchLeaderboard])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const formatTime = (date) => {
    if (!date) return ""
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b dark:border-gray-700 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🏆</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  Rankings
                </h2>
                {/* Live indicator */}
                <div className="flex items-center gap-1.5 ml-1">
                  <span className={`w-2 h-2 rounded-full bg-green-500 ${isRefreshing ? "animate-ping" : "animate-pulse"}`} />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{topic.name}</p>
              {lastUpdated && (
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                  Updated {formatTime(lastUpdated)} · refreshes every 10s
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 120px)" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading rankings...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
              <span className="text-4xl">📭</span>
              <p className="font-medium">No scores yet</p>
              <p className="text-sm">Be the first to take this test!</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {leaderboard.map((entry) => {
                const isCurrentUser = user && entry.userId === user._id?.toString()
                const rankColor = RANK_COLORS[entry.rank] || ""
                const isTopThree = entry.rank <= 3

                return (
                  <div
                    key={entry.userId}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                      ${isTopThree
                        ? `bg-gradient-to-r ${rankColor}`
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50"
                      }
                      ${isCurrentUser ? "ring-2 ring-primary/50" : ""}
                    `}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center flex-shrink-0">
                      {isTopThree ? (
                        <span className="text-xl">{MEDAL[entry.rank]}</span>
                      ) : (
                        <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0
                      ${isCurrentUser
                        ? "bg-gradient-to-br from-primary to-primary/60"
                        : "bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800"
                      }`}
                    >
                      {entry.avatar
                        ? <img src={entry.avatar} alt={entry.name} className="w-full h-full rounded-full object-cover" />
                        : entry.name[0]?.toUpperCase()
                      }
                    </div>

                    {/* Name + attempts */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-semibold truncate ${isCurrentUser ? "text-primary" : "text-gray-900 dark:text-white"}`}>
                          {entry.name}
                          {isCurrentUser && <span className="ml-1 text-xs font-normal text-primary/70">(you)</span>}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {entry.attemptCount} attempt{entry.attemptCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${isTopThree ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {entry.highScore}<span className="text-xs font-normal text-gray-400">/{entry.maxScore}</span>
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all ${
                              entry.percent >= 80 ? "bg-green-500" :
                              entry.percent >= 50 ? "bg-yellow-500" : "bg-red-400"
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
