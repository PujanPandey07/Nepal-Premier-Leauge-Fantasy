import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

const BRAND = '#38003c'

export default function Settings() {
  const [user, setUser] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [favoriteTeam, setFavoriteTeam] = useState('')
  const [favoritePlayers, setFavoritePlayers] = useState([])
  const [cricketTeams, setCricketTeams] = useState([])
  const [allPlayers, setAllPlayers] = useState([])

  // UI states
  const [playerSearch, setPlayerSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/users/me/'),
      axiosInstance.get('/api/cricket-teams/'),
      axiosInstance.get('/api/players/?page_size=1000'),
    ])
      .then(([userRes, teamsRes, playersRes]) => {
        setUser(userRes.data)
        setTeamName(userRes.data.team_name || '')
        setFavoriteTeam(userRes.data.favorite_team || '')
        setFavoritePlayers(userRes.data.favorite_players || [])

        const teams = teamsRes.data.results || teamsRes.data || []
        setCricketTeams(teams)

        const rawPlayers = playersRes.data.results || playersRes.data || []
        const players = rawPlayers.map((p) => ({
          ...p,
          credit_value: Number(p.credit_value) || 0,
        }))
        setAllPlayers(players)
      })
      .catch((err) => console.error('Error loading profile:', err))
      .finally(() => setLoading(false))
  }, [])

  const togglePlayer = (playerId) => {
    setFavoritePlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId)
      }
      if (prev.length >= 3) {
        setError('You can select a maximum of 3 favorite players.')
        return prev
      }
      setError(null)
      return [...prev, playerId]
    })
  }

  const handleSave = async () => {
    const trimmed = teamName.trim()
    if (!trimmed) {
      setError('Team name cannot be empty.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await axiosInstance.patch('/api/users/me/', {
        team_name: trimmed,
        favorite_team: favoriteTeam || null,
        favorite_players: favoritePlayers,
      })
      setUser(res.data)
      setSuccess('Settings updated successfully!')
    } catch (err) {
      const data = err.response?.data
      setError(
        data?.team_name?.[0] ||
        data?.favorite_players?.[0] ||
        'Failed to update settings. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  // 1. Sort all players by highest credit value
  const sortedPlayers = [...allPlayers].sort((a, b) => b.credit_value - a.credit_value)

  // 2. Default to top 10 highest-priced players, or search across all if query exists
  const query = playerSearch.trim().toLowerCase()
  const displayedPlayers = query
    ? sortedPlayers.filter((player) => {
        const nameMatch = player.name?.toLowerCase().includes(query)
        const roleMatch = player.role?.toLowerCase().includes(query)
        const teamMatch =
          player.team_name?.toLowerCase().includes(query) ||
          player.team?.name?.toLowerCase().includes(query)

        return nameMatch || roleMatch || teamMatch
      })
    : sortedPlayers.slice(0, 10)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="mx-auto max-w-5xl px-6 py-12 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-900 border-t-transparent" />
            Loading settings...
          </div>
        </div>
      </div>
    )
  }

  const selectedPlayerObjs = favoritePlayers
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <Navbar />

      {/* Header Banner */}
      <div
        className="px-6 py-10 text-white"
        style={{ background: `linear-gradient(135deg, ${BRAND}, #1a0020)` }}
      >
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-black">Manager Profile & Settings</h1>
          <p className="mt-1 text-xs md:text-sm text-white/80">
            Configure your team identity, favorite franchise, and marquee star picks.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Left Column: Profile & Team Identity */}
          <div className="space-y-6">

            {/* Account Details */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-950 mb-4">
                Account Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400">Full Name</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900">{user?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400">Email Address</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900 truncate">{user?.email || '—'}</p>
                </div>
              </div>
            </div>

            {/* Squad Name Setup */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
              <label htmlFor="team-name" className="block text-sm font-bold text-gray-900 mb-1">
                Fantasy Team Name
              </label>
              <p className="text-xs text-gray-500 mb-3">
                This identity represents your squad on global leaderboards and private leagues.
              </p>
              <input
                id="team-name"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={100}
                placeholder="e.g. Kathmandu XI"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Franchise Preference */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
              <label htmlFor="fav-team" className="block text-sm font-bold text-gray-900 mb-1">
                Favorite Franchise
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select your primary team allegiance in the NPL.
              </p>
              <select
                id="fav-team"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
              >
                <option value="">Select a franchise (Optional)</option>
                {cricketTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column: Favorite Star Players Selection */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-bold text-gray-900">
                  Favorite Marquee Players
                </label>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                  {favoritePlayers.length} / 3 Selected
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Pick up to 3 marquee players to highlight in your manager bio.
              </p>

              {/* Selected Players Badges */}
              {selectedPlayerObjs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  {selectedPlayerObjs.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 bg-purple-950 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
                    >
                      {p.name}
                      <button
                        type="button"
                        onClick={() => togglePlayer(p.id)}
                        className="hover:text-amber-300 font-bold ml-1"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Player Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Search player by name, role, or team..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Player List */}
              <div className="max-h-72 overflow-y-auto space-y-1 rounded-xl border border-gray-100 p-1">
                {displayedPlayers.length > 0 ? (
                  displayedPlayers.map((player) => {
                    const selected = favoritePlayers.includes(player.id)
                    const teamDisplayName = player.team_name || player.team?.name || ''

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => togglePlayer(player.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                          selected
                            ? 'bg-purple-100 text-purple-950 font-bold'
                            : 'hover:bg-gray-50 text-gray-700 font-medium'
                        }`}
                      >
                        <div className="flex flex-col items-start text-left">
                          <span className="font-semibold text-gray-900">{player.name}</span>
                          {teamDisplayName && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              {teamDisplayName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {player.role || 'Player'}
                          </span>
                          {player.credit_value > 0 && (
                            <span className="text-gray-500 font-mono text-[11px]">
                              {player.credit_value} Cr
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <p className="p-4 text-center text-xs text-gray-400">No matching players found.</p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              {error && (
                <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium border border-red-200/60">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 font-medium border border-emerald-200/60">
                  {success}
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 hover:opacity-95"
                style={{ backgroundColor: BRAND }}
              >
                {saving ? 'Updating Profile...' : 'Save Changes'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}