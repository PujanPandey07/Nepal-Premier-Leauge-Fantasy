import { useState, useEffect } from 'react'
import { ROLE_LIMITS, getFantasyRole } from '../context/teamcontext'
import axiosInstance from '../utilis/axiosInstance'
import { fetchAllPages } from '../utilis/fetchAllPages'
import { fetchMatchPlayerPoints } from '../utilis/fetchMatchPlayerPoints'
import Navbar from '../components/navbar'

export default function ViewPoints() {
  const [teamList, setTeamList] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [squad, setSquad] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingSquad, setLoadingSquad] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  // Layer 1: Fetch metadata for fantasy teams, matches, and cricket teams
  useEffect(() => {
    let isMounted = true
    setLoadingList(true)

    Promise.all([
      fetchAllPages('/api/fantasy-teams/?page_size=20'),
      fetchAllPages('/api/matches/?page_size=20'),
      fetchAllPages('/api/cricket-teams/?page_size=20'),
    ])
      .then(([fantasyTeams, matches, cricketTeams]) => {
        if (!isMounted) return

        const teamNameMap = new Map(cricketTeams.map((ct) => [ct.id, ct.name]))

        const combined = fantasyTeams
          .map((ft) => {
            const match = matches.find((m) => m.id === ft.match)
            if (!match) return null

            const homeName = teamNameMap.get(match.home_team) || 'Unknown'
            const awayName = teamNameMap.get(match.away_team) || 'Unknown'

            return {
              fantasyTeamId: ft.id,
              matchId: match.id,
              matchDate: match.match_date,
              totalPoints: ft.total_points || 0,
              label: `${homeName} vs ${awayName}`,
            }
          })
          .filter(Boolean)

        combined.sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate))
        setTeamList(combined)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Error loading team list:', err)
        setError('Failed to load points history')
      })
      .finally(() => {
        if (isMounted) setLoadingList(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Layer 2: Fetch 11-player squad details for the selected fantasy team
  useEffect(() => {
    if (teamList.length === 0) return
    const currentTeam = teamList[currentIndex]
    if (!currentTeam) return

    let isMounted = true
    setLoadingSquad(true)

    Promise.all([
      fetchAllPages('/api/fantasy-team-players/?page_size=20'),
      fetchMatchPlayerPoints(currentTeam.matchId),
    ])
      .then(async ([allRows, pointsByPlayer]) => {
        if (!isMounted) return

        const rows = allRows.filter(
          (r) => (r.fantasy_team?.id || r.fantasy_team) === currentTeam.fantasyTeamId
        )

        const playerRequests = rows.map((row) =>
          axiosInstance.get(`/api/players/${row.player}/`).then((pRes) => {
            const basePoints = Number(pointsByPlayer[row.player] ?? row.points_earned ?? 0)
            const multiplier = row.is_captain ? 2 : row.is_vice_captain ? 1.5 : 1

            return {
              ...pRes.data,
              _isCaptain: row.is_captain,
              _isViceCaptain: row.is_vice_captain,
              base_points: basePoints,
              multiplier,
              effective_points: basePoints * multiplier,
            }
          })
        )

        const players = await Promise.all(playerRequests)
        if (isMounted) {
          setSquad(players)
        }
      })
      .catch((err) => {
        if (isMounted) console.error('Error loading squad for match:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingSquad(false)
      })

    return () => {
      isMounted = false
    }
  }, [teamList, currentIndex])

  // Close breakdown modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPlayer(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isLatest = currentIndex === 0
  const isOldest = currentIndex === teamList.length - 1
  const goNewer = () => setCurrentIndex((i) => Math.max(i - 1, 0))
  const goOlder = () => setCurrentIndex((i) => Math.min(i + 1, teamList.length - 1))

  if (loadingList) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <div className="p-8 text-center text-gray-400">Loading points history...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <div className="p-8 text-center text-red-400">{error}</div>
      </div>
    )
  }

  if (teamList.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <Navbar />
        <div className="p-8 text-center text-gray-400">No fantasy teams found.</div>
      </div>
    )
  }

  const currentTeam = teamList[currentIndex]
  const currentTeamMatchPoints = squad.reduce((sum, p) => sum + (p.effective_points || 0), 0)
  const seasonTotalPoints = teamList.reduce((sum, t) => sum + t.totalPoints, 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-6 py-3.5">
        <div>
          <p className="text-base sm:text-lg font-bold truncate max-w-[200px] sm:max-w-xs">{currentTeam.label}</p>
          <p className="text-xs text-gray-400">Season Total: {seasonTotalPoints} pts</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">Match Points</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">{currentTeamMatchPoints.toFixed(1)}</p>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center border-b border-slate-800 bg-slate-900/60 px-4 sm:px-6 py-2 text-xs sm:text-sm">
        <button
          onClick={goNewer}
          disabled={isLatest}
          className="rounded px-2.5 py-1 font-medium hover:bg-slate-800 disabled:opacity-30 transition-colors"
        >
          ← Newer Match
        </button>
        <span className="text-[11px] text-gray-400">
          {currentIndex + 1} of {teamList.length}
        </span>
        <button
          onClick={goOlder}
          disabled={isOldest}
          className="rounded px-2.5 py-1 font-medium hover:bg-slate-800 disabled:opacity-30 transition-colors"
        >
          Older Match →
        </button>
      </div>

      {/* Pitch Layout */}
      {loadingSquad ? (
        <div className="p-12 text-center text-gray-400 animate-pulse">Loading squad details...</div>
      ) : (
        <div
          className="relative min-h-[85vh] w-full overflow-hidden p-4 sm:p-8"
          style={{
            background:
              'repeating-linear-gradient(180deg, #15803d 0px, #15803d 40px, #166534 40px, #166534 80px)',
          }}
        >
          {/* Ground Marking Overlay */}
          <div
            className="pointer-events-none absolute border-2 border-white/20 rounded-[50%]"
            style={{ top: '2%', left: '4%', width: '92%', height: '96%' }}
          />
          {/* Pitch Strip */}
          <div
            className="pointer-events-none absolute bg-amber-100/15 left-1/2 -translate-x-1/2 rounded"
            style={{ top: '10%', height: '80%', width: '70px' }}
          />

          <div className="relative z-10 max-w-5xl mx-auto space-y-6 sm:space-y-8">
            {Object.keys(ROLE_LIMITS).map((role) => {
              // Normalize p.role so it matches key in ROLE_LIMITS
              const playersInRole = squad.filter((p) => getFantasyRole(p.role) === role)
              if (playersInRole.length === 0) return null

              return (
                <div key={role} className="flex flex-col items-center">
                  <h2 className="mb-3 rounded bg-slate-900/80 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-300 backdrop-blur-sm border border-emerald-500/20">
                    {role}
                  </h2>
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-10">
                    {playersInRole.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayer(player)}
                        className="flex flex-col items-center w-20 sm:w-24 group cursor-pointer focus:outline-none transition-transform hover:scale-105 active:scale-95"
                      >
                        <div className="relative">
                          {/* Player Avatar */}
                          <div className="flex h-14 w-14 sm:h-16 sm:w-16 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 text-slate-800 shadow-xl group-hover:border-emerald-400 transition-colors">
                            <span className="text-lg sm:text-xl font-extrabold leading-none">
                              {player.name ? player.name.charAt(0) : '?'}
                            </span>
                            <span className="mt-0.5 sm:mt-1 w-full bg-slate-900 text-center text-[9px] sm:text-[10px] font-bold leading-3 sm:leading-4 text-emerald-400">
                              {player.effective_points.toFixed(1)} pts
                            </span>
                          </div>

                          {/* Captain / Vice Captain Badges */}
                          {player._isCaptain && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-amber-400 border border-amber-500 text-[9px] sm:text-[10px] font-black text-slate-950 shadow">
                              2x
                            </span>
                          )}
                          {player._isViceCaptain && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-sky-500 border border-sky-600 text-[9px] sm:text-[10px] font-black text-white shadow">
                              1.5x
                            </span>
                          )}
                        </div>

                        {/* Player Name Tag */}
                        <div className="mt-1.5 w-full rounded bg-slate-900/90 px-1.5 py-0.5 sm:py-1 text-center text-[10px] sm:text-xs font-semibold text-white shadow truncate backdrop-blur-sm group-hover:bg-purple-900 transition-colors">
                          {player.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Player Points Breakdown Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl relative text-white animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 border border-purple-400">
                {selectedPlayer.name ? selectedPlayer.name.charAt(0) : '?'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  {selectedPlayer.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                    {selectedPlayer.role}
                  </span>
                  {selectedPlayer._isCaptain && (
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                      Captain (2x)
                    </span>
                  )}
                  {selectedPlayer._isViceCaptain && (
                    <span className="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.5 rounded border border-sky-400/30">
                      Vice Captain (1.5x)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Point Calculation Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Base Performance Points</span>
                <span className="font-mono font-bold text-slate-200">{selectedPlayer.base_points} pts</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Role Multiplier</span>
                <span className="font-mono font-bold text-purple-400">
                  {selectedPlayer.multiplier}x
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm font-bold">
                <span className="text-slate-200">Total Match Points</span>
                <span className="font-mono text-emerald-400 text-base">
                  {selectedPlayer.effective_points.toFixed(1)} pts
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlayer(null)}
              className="mt-5 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}