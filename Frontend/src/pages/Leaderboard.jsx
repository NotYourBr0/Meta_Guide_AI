import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { getGlobalLeaderboard } from "../services/api"

const rankLabel = (rank) => {
  if (rank === 1) return "1st"
  if (rank === 2) return "2nd"
  if (rank === 3) return "3rd"
  return `${rank}th`
}

const RANK_COLORS = {
  1: {
    badge: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30",
    bar: "from-amber-500 to-yellow-400",
  },
  2: {
    badge: "bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-500/30",
    bar: "from-slate-400 to-slate-300",
  },
  3: {
    badge: "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30",
    bar: "from-orange-500 to-amber-400",
  },
}

const Avatar = ({ name, size = "md" }) => {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const sz = size === "lg" ? "w-12 h-12 text-base" : "w-8 h-8 text-xs"
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-white/5 animate-pulse">
    <div className="w-6 h-4 rounded bg-gray-200 dark:bg-white/8 flex-shrink-0" />
    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/8 flex-shrink-0" />
    <div className="flex-1 h-4 rounded bg-gray-200 dark:bg-white/8" />
    <div className="w-20 h-4 rounded bg-gray-200 dark:bg-white/8" />
  </div>
)

const Leaderboard = () => {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const intervalRef = useRef(null)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const result = await getGlobalLeaderboard()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message || "Failed to load leaderboard.")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(() => fetchData(true), 15000)
    const handleLiveUpdate = () => fetchData(true)
    window.addEventListener("leaderboard-updated", handleLiveUpdate)
    return () => {
      clearInterval(intervalRef.current)
      window.removeEventListener("leaderboard-updated", handleLiveUpdate)
    }
  }, [fetchData])

  const topScore = data[0]?.totalScore || 1
  const myEntry = user ? data.find((e) => e.userId === user._id?.toString()) : null

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-6 pb-4 border-b border-gray-200 dark:border-white/8">
        <div className="max-w-2xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Global rankings by total high score</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {myEntry && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-sm">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">#{myEntry.rank}</span>
                <span className="text-gray-500 dark:text-gray-400">{myEntry.totalScore.toLocaleString()} pts</span>
              </div>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-400 dark:text-gray-700 tabular-nums">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          {/* Error */}
          {error && (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4 text-sm">{error}</p>
              <button
                onClick={() => fetchData()}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && data.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-900 dark:text-white font-medium mb-1">No scores yet</p>
              <p className="text-sm text-gray-500">Complete a test to appear on the leaderboard.</p>
            </div>
          )}

          {/* Table */}
          {!error && (data.length > 0 || loading) && (
            <div className="rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden bg-white dark:bg-gray-900/50">
              {/* Column headers */}
              <div className="grid grid-cols-[40px_1fr_auto] sm:grid-cols-[40px_1fr_auto_auto] gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-white/8 text-xs text-gray-400 dark:text-gray-600 font-semibold uppercase tracking-wider">
                <span>#</span>
                <span>Player</span>
                <span className="text-right">Score</span>
                <span className="hidden sm:block text-right">Topics</span>
              </div>

              {/* Rows */}
              <div>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : data.map((entry) => {
                      const isMe = user && entry.userId === user._id?.toString()
                      const barPct = Math.max(4, Math.round((entry.totalScore / topScore) * 100))
                      const rankColors = RANK_COLORS[entry.rank]
                      return (
                        <div
                          key={entry.userId}
                          className={`grid grid-cols-[40px_1fr_auto] sm:grid-cols-[40px_1fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors ${
                            isMe
                              ? "bg-indigo-50 dark:bg-indigo-500/8"
                              : "hover:bg-gray-50 dark:hover:bg-white/2"
                          }`}
                        >
                          {/* Rank */}
                          <div className="flex-shrink-0">
                            {rankColors ? (
                              <span className={`inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-md border ${rankColors.badge}`}>
                                {rankLabel(entry.rank)}
                              </span>
                            ) : (
                              <span className="text-sm font-mono text-gray-400 dark:text-gray-600">{entry.rank}</span>
                            )}
                          </div>

                          {/* Player */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={entry.name} />
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${isMe ? "text-indigo-600 dark:text-indigo-300" : "text-gray-800 dark:text-gray-200"}`}>
                                {entry.name}
                                {isMe && <span className="ml-1.5 text-xs text-indigo-400 dark:text-indigo-500 font-normal">(you)</span>}
                              </p>
                              {/* Progress bar */}
                              <div className="mt-1 h-1 w-full max-w-[120px] rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                                <div
                                  className={`h-1 rounded-full bg-gradient-to-r ${rankColors?.bar ?? "from-indigo-500 to-violet-500"} transition-all duration-700`}
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{entry.totalScore.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-600 ml-1">pts</span>
                          </div>

                          {/* Topics — hidden on mobile */}
                          <div className="hidden sm:block text-right flex-shrink-0">
                            <span className="text-sm text-gray-500 tabular-nums">{entry.topicsAttempted}</span>
                          </div>
                        </div>
                      )
                    })}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 dark:text-gray-700 mt-5 pb-2">
            Refreshes every 15s · Only personal bests count
          </p>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
