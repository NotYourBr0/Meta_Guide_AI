import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { getGlobalLeaderboard } from "../services/api"

// ── Medal colours for rank 1 / 2 / 3 ─────────────────────────────────────────
const PODIUM_CONFIG = [
  {
    rank: 1,
    label: "1st",
    ringClass: "ring-yellow-400",
    badgeClass: "bg-yellow-400 text-yellow-900",
    cardClass: "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700/50",
    nameClass: "text-yellow-800 dark:text-yellow-300",
    avatarClass: "from-yellow-400 to-amber-500",
    size: "w-20 h-20 text-2xl",
    order: "order-2",
    mt: "",
  },
  {
    rank: 2,
    label: "2nd",
    ringClass: "ring-gray-300",
    badgeClass: "bg-gray-400 text-white",
    cardClass: "from-gray-50 to-slate-50 dark:from-gray-800/60 dark:to-slate-800/60 border-gray-200 dark:border-gray-600/50",
    nameClass: "text-gray-700 dark:text-gray-200",
    avatarClass: "from-gray-400 to-slate-500",
    size: "w-16 h-16 text-xl",
    order: "order-1",
    mt: "mt-4 sm:mt-6",
  },
  {
    rank: 3,
    label: "3rd",
    ringClass: "ring-orange-400",
    badgeClass: "bg-orange-400 text-white",
    cardClass: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-700/50",
    nameClass: "text-orange-800 dark:text-orange-300",
    avatarClass: "from-orange-400 to-red-400",
    size: "w-16 h-16 text-xl",
    order: "order-3",
    mt: "mt-4 sm:mt-8",
  },
]

// ── Avatar initials ───────────────────────────────────────────────────────────
const Avatar = ({ name, gradientClass, sizeClass }) => {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-extrabold flex-shrink-0 ${sizeClass}`}
    >
      {initials}
    </div>
  )
}

// ── Inline mini avatar for the table ─────────────────────────────────────────
const SmallAvatar = ({ name }) => {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex-1 min-w-[140px] rounded-2xl border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center gap-3 animate-pulse">
    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
)

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 w-8 rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </td>
    <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-4 py-3"><div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" /></td>
  </tr>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Leaderboard = () => {
  const { user } = useAuth()
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
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

    // Auto-refresh every 15 s in the background
    intervalRef.current = setInterval(() => fetchData(true), 15000)

    // Listen for immediate refresh events (fired by TestRunner after new high score)
    const handleLiveUpdate = () => fetchData(true)
    window.addEventListener("leaderboard-updated", handleLiveUpdate)

    return () => {
      clearInterval(intervalRef.current)
      window.removeEventListener("leaderboard-updated", handleLiveUpdate)
    }
  }, [fetchData])

  const top3    = data.slice(0, 3)
  const rest    = data.slice(3)
  const topScore = data[0]?.totalScore || 1

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700 mb-2" />
          <div className="h-4 w-72 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        {/* Podium skeleton */}
        <div className="flex items-end justify-center gap-4 mb-10">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        {/* Table skeleton */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <tbody>
              {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4 text-gray-300 dark:text-gray-600">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => fetchData()}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 mb-5">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">No scores yet</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">Complete a test to be the first on the leaderboard.</p>
      </div>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Leaderboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Ranked by total high-score across all topics
            </p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* ── Podium — Top 3 ── */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 sm:gap-5 mb-10">
          {PODIUM_CONFIG.slice(0, top3.length).map((cfg) => {
            const entry = top3[cfg.rank - 1]
            if (!entry) return null
            const isMe = user && entry.userId === user._id?.toString()
            return (
              <div
                key={cfg.rank}
                className={`flex-1 max-w-[200px] ${cfg.order} ${cfg.mt} rounded-2xl border bg-gradient-to-b ${cfg.cardClass} p-4 sm:p-5 flex flex-col items-center gap-2 transition-transform hover:-translate-y-1 ${isMe ? "ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-gray-900" : ""}`}
              >
                {/* Rank badge */}
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badgeClass}`}>
                  {cfg.label}
                </span>

                {/* Avatar */}
                <Avatar
                  name={entry.name}
                  gradientClass={cfg.avatarClass}
                  sizeClass={`${cfg.size} ring-2 ${cfg.ringClass} ring-offset-2 dark:ring-offset-gray-900`}
                />

                {/* Name */}
                <p className={`text-sm font-bold text-center leading-tight ${cfg.nameClass} ${isMe ? "underline underline-offset-2" : ""}`}>
                  {entry.name}
                  {isMe && <span className="ml-1 text-xs font-normal text-indigo-500">(you)</span>}
                </p>

                {/* Score */}
                <div className="text-center">
                  <div className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums">
                    {entry.totalScore.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">pts</div>
                </div>

                {/* Topics count */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {entry.topicsAttempted} topic{entry.topicsAttempted !== 1 ? "s" : ""}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Divider ── */}
      {rest.length > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Rankings</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
      )}

      {/* ── Rank 4+ Table ── */}
      {rest.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold w-12">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold">Player</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Score</th>
                  <th className="px-4 py-3 text-right font-semibold">Topics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {rest.map((entry) => {
                  const isMe = user && entry.userId === user._id?.toString()
                  const barWidth = Math.max(4, Math.round((entry.totalScore / topScore) * 100))
                  return (
                    <tr
                      key={entry.userId}
                      className={`transition-colors ${
                        isMe
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3 font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                        {entry.rank}
                      </td>

                      {/* Player */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <SmallAvatar name={entry.name} />
                          <div>
                            <div className={`font-semibold ${isMe ? "text-indigo-700 dark:text-indigo-300" : "text-gray-800 dark:text-gray-100"}`}>
                              {entry.name}
                              {isMe && <span className="ml-1.5 text-xs font-normal text-indigo-400">(you)</span>}
                            </div>
                            {/* Score bar */}
                            <div className="mt-1 h-1 w-24 sm:w-36 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                        {entry.totalScore.toLocaleString()}
                        <span className="text-xs font-normal text-gray-400 ml-1">pts</span>
                      </td>

                      {/* Topics */}
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                        {entry.topicsAttempted}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Footer note ── */}
      <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-600">
        Scores refresh automatically · Only personal bests count
      </p>
    </div>
  )
}

export default Leaderboard
