import { useEffect, useState, useContext, useCallback } from 'react'
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/navbar'
import { TeamContext, ROLE_LIMITS } from '../context/teamcontext'
import axiosInstance from '../utilis/axiosInstance'

export default function Players({ showAddButton = false }) {
  const context = useContext(TeamContext)
  const addPlayer = context?.addPlayer
  const selectedPlayers = context?.selectedPlayers || []
  const match = context?.match || null

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { matchId } = useParams()
  const roleFilter = searchParams.get('role')

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [cricketTeams, setCricketTeams] = useState({})

  // Fetch teams lookup mapping
  useEffect(() => {
    let isMounted = true
    axiosInstance
      .get('/cricket-teams/') // Adjusted path if axiosInstance baseURL already includes /api
      .then((res) => {
        if (!isMounted) return
        const list = Array.isArray(res.data) ? res.data : res.data?.results || []
        const map = {}
        list.forEach((t) => {
          if (t.id) map[t.id] = t.name
        })
        setCricketTeams(map)
      })
      .catch((err) => console.error('Error fetching cricket teams:', err))

    return () => {
      isMounted = false
    }
  }, [])

  // Unified player fetch helper
  const fetchPlayers = useCallback((endpoint = '/players/', queryParams = null) => {
    setLoading(true)
    setError(null)

    let url = endpoint
    if (queryParams && queryParams.toString()) {
      url = `${endpoint}?${queryParams.toString()}`
    }

    axiosInstance
      .get(url)
      .then((res) => {
        const rawList = Array.isArray(res.data) ? res.data : res.data?.results || []
        const normalized = rawList.map((p) => ({
          ...p,
          credit_value: Number(p.credit_value) || 0,
        }))
        setPlayers(normalized)
        setNextPage(res.data?.next || null)
        setPrevPage(res.data?.previous || null)
      })
      .catch((err) => {
        console.error('Error fetching players:', err)
        setError('Failed to load players list. Please verify server connection.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Debounced filter effect with context checks
  useEffect(() => {
    // If add button is active but match data isn't loaded yet, clear loading state and wait
    if (showAddButton && !match) {
      setLoading(false)
      return
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (roleFilter) params.append('role', roleFilter)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (minPrice) params.append('min_credit_value', minPrice)
      if (maxPrice) params.append('max_credit_value', maxPrice)

      if (showAddButton && match) {
        // Safely extract team IDs whether they are objects or raw UUID strings
        const homeId = typeof match.home_team === 'object' ? match.home_team?.id : match.home_team
        const awayId = typeof match.away_team === 'object' ? match.away_team?.id : match.away_team

        if (homeId && awayId) {
          params.append('teams', `${homeId},${awayId}`)
        }
      }

      fetchPlayers('/players/', params)
    }, 300)

    return () => clearTimeout(timer)
  }, [roleFilter, searchTerm, minPrice, maxPrice, match, showAddButton, fetchPlayers])

  const handleAddPlayer = async (player) => {
    if (!addPlayer) return
    const result = await addPlayer(player)
    if (result?.success) {
      const newCount = selectedPlayers.filter((p) => p.role === player.role).length + 1
      if (ROLE_LIMITS?.[player.role] && newCount >= ROLE_LIMITS[player.role]) {
        navigate(`/build-team/${matchId}`)
      }
    } else if (result?.error) {
      alert(result.error)
    }
  }

  // Parse DRF full pagination URLs
  const handlePagination = (fullUrl) => {
    if (!fullUrl) return
    try {
      const parsedUrl = new URL(fullUrl)
      let path = parsedUrl.pathname + parsedUrl.search
      // Clean leading /api if axiosInstance baseURL already includes /api
      if (path.startsWith('/api/')) {
        path = path.replace('/api', '')
      }
      fetchPlayers(path)
    } catch {
      fetchPlayers(fullUrl)
    }
  }

  const getTeamName = (player) => {
    if (typeof player.team === 'object' && player.team?.name) return player.team.name
    if (cricketTeams[player.team]) return cricketTeams[player.team]
    return player.team_name || player.team || '—'
  }

  const gridColsClass = showAddButton
    ? 'grid-cols-1 sm:grid-cols-7'
    : 'grid-cols-1 sm:grid-cols-6'

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Navbar />

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NPL Players</h1>
            {showAddButton && (
              <Link
                to={`/build-team/${matchId}`}
                className="mt-1 inline-block text-sm font-medium text-indigo-600 hover:underline"
              >
                ← Back to Team Selection
              </Link>
            )}
          </div>
          {showAddButton && (
            <div className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-900">
              Selected Players: {selectedPlayers.length} / 11
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Min credits"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max credits"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Players List Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className={`hidden sm:grid ${gridColsClass} bg-gray-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white`}>
            <span>Player</span>
            <span>Team</span>
            <span>Role</span>
            <span>Batting</span>
            <span>Bowling</span>
            <span>Credits</span>
            {showAddButton && <span className="text-right">Action</span>}
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No players found matching your criteria.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {players.map((player) => {
                const isSelected = selectedPlayers.some((p) => p.id === player.id)
                return (
                  <div
                    key={player.id}
                    className={`grid ${gridColsClass} items-center px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <Link
                      to={`/players/${player.id}`}
                      className="font-semibold text-indigo-900 hover:underline"
                    >
                      {player.name}
                    </Link>
                    <span className="text-gray-600">{getTeamName(player)}</span>
                    <span className="text-gray-600">{player.role}</span>
                    <span className="text-gray-600">{player.batting_style || '—'}</span>
                    <span className="text-gray-600">{player.bowling_style || '—'}</span>
                    <span className="font-bold text-indigo-700">{player.credit_value} Cr</span>

                    {showAddButton && (
                      <div className="text-right mt-2 sm:mt-0">
                        {isSelected ? (
                          <span className="inline-block rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
                            ✓ Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddPlayer(player)}
                            className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                          >
                            Add to Team
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <button
            disabled={!prevPage || loading}
            onClick={() => handlePagination(prevPage)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={!nextPage || loading}
            onClick={() => handlePagination(nextPage)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}