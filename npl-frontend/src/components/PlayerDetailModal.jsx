import { useEffect, useState } from 'react'
import axiosInstance from '../utilis/axiosInstance'

export default function PlayerDetailModal({ playerId, onClose }) {
  const [player, setPlayer] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) return

    setLoading(true)
    setPlayer(null)
    setSeasonStats(null)

    // Parallel fetch for player details and season stats
    const fetchPlayerData = async () => {
      try {
        const [playerRes, statsRes] = await Promise.allSettled([
          axiosInstance.get(`/api/players/${playerId}/`),
          axiosInstance.get(`/api/players/${playerId}/season-stats/`),
        ])

        if (playerRes.status === 'fulfilled') {
          setPlayer(playerRes.value.data)
        }
        if (statsRes.status === 'fulfilled') {
          setSeasonStats(statsRes.value.data)
        }
      } catch (err) {
        console.error('Error loading player modal details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerData()
  }, [playerId])

  // Close modal when pressing the Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!playerId) return null

  // Safely extract up to 2 initials for avatar fallback
  const initials = player?.name
    ? player.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white font-semibold text-sm transition-colors"
        >
          ✕
        </button>

        {loading ? (
          /* Skeleton Loader State */
          <div className="p-5 sm:p-6 space-y-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 bg-slate-200 rounded" />
                <div className="h-5 w-36 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        ) : player ? (
          <div className="overflow-y-auto">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-5 sm:px-6 py-5 sm:py-6 flex items-center gap-4 relative">
              {player.image ? (
                <img
                  src={player.image}
                  alt={player.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/20 shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-lg sm:text-xl shrink-0 shadow-sm">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1 pr-6">
                <span className="inline-block uppercase text-indigo-300 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/20 mb-1">
                  {player.role || 'Player'}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight truncate">
                  {player.name}
                </h2>
                <p className="text-indigo-200 text-xs mt-0.5 font-medium truncate">
                  {player.nationality || 'N/A'}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-slate-50/50">
              <div className="text-center py-3 sm:py-3.5 px-1">
                <p className="text-sm sm:text-lg font-extrabold text-slate-900">
                  {seasonStats?.matches_played ?? '–'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  Matches
                </p>
              </div>
              <div className="text-center py-3 sm:py-3.5 px-1">
                <p className="text-sm sm:text-lg font-extrabold text-slate-900">
                  {seasonStats?.total_runs ?? '–'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  Runs
                </p>
              </div>
              <div className="text-center py-3 sm:py-3.5 px-1">
                <p className="text-sm sm:text-lg font-extrabold text-slate-900">
                  {seasonStats?.total_wickets ?? '–'}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  Wickets
                </p>
              </div>
              <div className="text-center py-3 sm:py-3.5 px-1">
                <p className="text-sm sm:text-lg font-extrabold text-purple-700">
                  {seasonStats?.total_fantasy_points ?? '–'}
                </p>
                <p className="text-[10px] text-purple-600/80 font-bold uppercase tracking-wider mt-0.5">
                  Pts
                </p>
              </div>
            </div>

            {/* Detailed Player Metadata */}
            <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <p className="text-[11px] font-medium text-gray-500 mb-0.5">Batting Style</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                  {player.batting_style || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <p className="text-[11px] font-medium text-gray-500 mb-0.5">Bowling Style</p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                  {player.bowling_style || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <p className="text-[11px] font-medium text-gray-500 mb-0.5">Credit Value</p>
                <p className="text-xs sm:text-sm font-bold text-purple-700">
                  {player.credit_value ? `${player.credit_value} Cr` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <p className="text-[11px] font-medium text-gray-500 mb-0.5">Status</p>
                <p className={`text-xs sm:text-sm font-bold ${player.is_available ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {player.is_available ? 'Available' : 'Unavailable'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-xs sm:text-sm">
            Failed to load player details.
          </div>
        )}
      </div>
    </div>
  )
}