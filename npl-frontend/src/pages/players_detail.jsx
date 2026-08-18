import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

export default function PlayersDetail() {
  const { id } = useParams()
  const [player, setPlayer] = useState(null)
  const [teammates, setTeammates] = useState([])
  const [seasonStats, setSeasonStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cricketTeams, setCricketTeams] = useState({})

  // Fetch team names mapping
  useEffect(() => {
    axiosInstance
      .get('/api/cricket-teams/')
      .then((res) => {
        const list = res.data.results || res.data || []
        const map = {}
        list.forEach((t) => {
          map[t.id] = t.name
        })
        setCricketTeams(map)
      })
      .catch((err) => console.error('Error fetching teams map:', err))
  }, [])

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchPlayerData = async () => {
      try {
        // Fetch player profile and season stats concurrently
        const [playerRes, statsRes] = await Promise.allSettled([
          axiosInstance.get(`/api/players/${id}/`),
          axiosInstance.get(`/api/players/${id}/season-stats/`),
        ])

        if (!isMounted) return

        if (playerRes.status === 'fulfilled') {
          const playerData = playerRes.value.data
          setPlayer(playerData)

          // Fetch squad mates if team context exists
          if (playerData?.team) {
            try {
              const teamId =
                typeof playerData.team === 'object'
                  ? playerData.team.id
                  : playerData.team

              // Fetch with team query param and page_size=100 so pagination doesn't cut off teammates
              const allRes = await axiosInstance.get(
                `/api/players/?team=${teamId}&page_size=100`
              )
              if (!isMounted) return

              const rawList = Array.isArray(allRes.data)
                ? allRes.data
                : allRes.data?.results || []

              const others = rawList.filter((p) => {
                const pTeamId = typeof p.team === 'object' ? p.team.id : p.team
                return (
                  String(pTeamId) === String(teamId) &&
                  String(p.id) !== String(id)
                )
              })
              setTeammates(others)
            } catch (err) {
              console.error('Error fetching teammates:', err)
            }
          }
        } else {
          throw new Error('Player not found')
        }

        if (statsRes.status === 'fulfilled') {
          setSeasonStats(statsRes.value.data)
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Error loading player details:', err)
        setError(
          'Could not load player profile. The player may not exist or is unavailable.'
        )
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPlayerData()

    return () => {
      isMounted = false
    }
  }, [id])

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)
  }

  // Helper to safely extract team name
  const getTeamName = (teamField) => {
    if (!teamField) return ''
    if (typeof teamField === 'object' && teamField.name) return teamField.name
    return cricketTeams[teamField] || player?.team_name || ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        {/* Skeleton Hero */}
        <div className="bg-slate-900 py-10">
          <div className="mx-auto flex max-w-5xl items-center gap-8 px-6">
            <div className="h-32 w-32 shrink-0 animate-pulse rounded-full bg-slate-700" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
              <div className="h-9 w-64 animate-pulse rounded bg-slate-700" />
              <div className="h-4 w-32 animate-pulse rounded bg-slate-700" />
            </div>
          </div>
        </div>
        {/* Skeleton Stats */}
        <div className="border-b border-gray-200 bg-white py-6">
          <div className="mx-auto grid max-w-5xl grid-cols-4 divide-x divide-gray-200 px-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center px-4">
                <div className="h-8 w-12 animate-pulse rounded bg-gray-200" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link
            to="/players"
            className="text-sm font-medium text-indigo-700 hover:underline"
          >
            ← Back to Players
          </Link>
          <div className="mt-6 rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-red-600">
              {error || 'Player not found.'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Please check the player ID or select another player from the roster.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const initials = getInitials(player.name)
  const teamName = getTeamName(player.team)

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-800">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-10 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-white text-4xl font-extrabold text-indigo-900 shadow-lg">
            {initials}
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <Link
                to="/players"
                className="text-xs font-semibold text-indigo-200 hover:underline"
              >
                ← Players
              </Link>
              <span className="text-indigo-400">•</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                {player.role || 'Player'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white leading-tight sm:text-4xl">
              {player.name}
            </h1>
            <p className="mt-1 text-sm text-indigo-200">
              {player.nationality || 'Nepal'}{' '}
              {teamName && `| ${teamName}`}
            </p>
          </div>
          <div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                player.is_available
                  ? 'border border-green-400/40 bg-green-500/20 text-green-300'
                  : 'border border-red-400/40 bg-red-500/20 text-red-300'
              }`}
            >
              {player.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* Season stat strip */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y-0 divide-gray-200 px-6 py-6 sm:grid-cols-4">
          <div className="px-4 text-center">
            <p className="text-3xl font-extrabold text-gray-900">
              {seasonStats?.matches_played ?? '–'}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
              Matches
            </p>
          </div>
          <div className="px-4 text-center">
            <p className="text-3xl font-extrabold text-gray-900">
              {seasonStats?.total_runs ?? '–'}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
              Runs
            </p>
          </div>
          <div className="px-4 text-center">
            <p className="text-3xl font-extrabold text-gray-900">
              {seasonStats?.total_wickets ?? '–'}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
              Wickets
            </p>
          </div>
          <div className="px-4 text-center">
            <p className="text-3xl font-extrabold text-indigo-700">
              {seasonStats?.total_fantasy_points ?? '–'}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
              Fantasy Pts
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-8 md:grid-cols-3">
        {/* Overview */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:col-span-2 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Overview</h2>
          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <p className="mb-1 text-xs text-gray-500">Role</p>
              <p className="text-base font-semibold text-gray-900">
                {player.role || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Team</p>
              <p className="text-base font-semibold text-gray-900">
                {teamName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Nationality</p>
              <p className="text-base font-semibold text-gray-900">
                {player.nationality || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Batting Style</p>
              <p className="text-base font-semibold text-gray-900">
                {player.batting_style || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Bowling Style</p>
              <p className="text-base font-semibold text-gray-900">
                {player.bowling_style || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-500">Credit Value</p>
              <p className="text-base font-bold text-indigo-600">
                {player.credit_value ?? 'N/A'} Cr
              </p>
            </div>
          </div>
        </div>

        {/* Squad / Teammates sidebar */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-3 font-bold text-gray-900">Squad Teammates</p>
          <div className="space-y-1">
            {teammates.map((mate) => {
              const mateInitials = getInitials(mate.name)
              return (
                <Link
                  key={mate.id}
                  to={`/players/${mate.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-800">
                    {mateInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {mate.name}
                    </p>
                    <p className="text-xs text-gray-500">{mate.role}</p>
                  </div>
                </Link>
              )
            })}
            {teammates.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">
                No teammates found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}