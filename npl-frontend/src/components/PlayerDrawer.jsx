import { useEffect, useState, useContext } from 'react'
import { TeamContext } from '../context/teamcontext'
import axiosInstance from '../utilis/axiosInstance'

// Helper function to map verbose database roles into fantasy categories
const getFantasyRole = (rawRole = '') => {
  const r = rawRole.toLowerCase()
  if (r.includes('keeper') || r.includes('wk')) return 'WK'
  if (r.includes('all') || r.includes('rounder') || r.includes('ar')) return 'AR'
  if (r.includes('bowl') || r.includes('bow')) return 'BOW'
  return 'BAT'
}

export default function PlayerDrawer({ role, onClose, onSelectPlayer }) {
  const { match, selectedPlayers, addPlayer } = useContext(TeamContext)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)

  // Close drawer on pressing Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Fetch all players for the match teams (without sending exact role string to Django)
  useEffect(() => {
    if (!match) return
    setLoading(true)

    const controller = new AbortController()
    const params = new URLSearchParams()
    
    if (match.home_team && match.away_team) {
      params.append('teams', `${match.home_team},${match.away_team}`)
    }
    if (searchTerm.trim()) params.append('search', searchTerm.trim())

    axiosInstance
      .get(`/api/players/?${params.toString()}`, { signal: controller.signal })
      .then((res) => {
        const list = res.data.results || res.data
        setPlayers(list.map((p) => ({ ...p, credit_value: Number(p.credit_value) })))
      })
      .catch((err) => {
        if (err.name !== 'CanceledError') {
          console.error('Error fetching players for drawer:', err)
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [match, searchTerm])

  const handleAdd = async (player) => {
    setErrorMessage(null)
    const result = await addPlayer(player)
    if (!result.success) {
      setErrorMessage(result.error)
      setTimeout(() => setErrorMessage(null), 3500)
    }
  }

  // Filter fetched players by normalized role client-side
  const filteredPlayers = players.filter(
    (player) => getFantasyRole(player.role) === role
  )

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-100">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-slate-900 text-white">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                Select Position
              </span>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {role || 'Players'}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Inline Error Toast */}
          {errorMessage && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-xs text-red-700 font-medium flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-800 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <input
                type="text"
                placeholder="Search player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all bg-white shadow-xs"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs sm:text-sm">🔍</span>
            </div>
          </div>

          {/* Player List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 sm:p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-slate-200 rounded" />
                      <div className="h-2.5 w-20 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                </div>
              ))
            ) : filteredPlayers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 text-xs sm:text-sm font-medium">No players found for {role}.</p>
                <p className="text-gray-400 text-[11px] mt-1">Try adjusting your search term.</p>
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.some((p) => p.id === player.id)
                const initials = player.name
                  ? player.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : ''

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-gray-50/80 transition-colors gap-3"
                  >
                    {/* Player Info */}
                    <button
                      onClick={() => onSelectPlayer(player.id)}
                      className="text-left flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-extrabold text-xs shrink-0 group-hover:border-purple-300 group-hover:bg-purple-50 group-hover:text-purple-700 transition-colors">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                          {player.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                          <span className="font-semibold text-purple-700">{player.credit_value} Cr</span>
                          <span>·</span>
                          <span className="truncate bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                            {player.role}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200">
                          <span>✓</span> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAdd(player)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs active:scale-95 transition-all"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}