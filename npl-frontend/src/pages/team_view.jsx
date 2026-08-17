import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import { ROLE_LIMITS } from '../context/teamcontext'
import axiosInstance from '../utilis/axiosInstance'
import { fetchAllPages } from '../utilis/fetchAllPages'
import { fetchMatchPlayerPoints } from '../utilis/fetchMatchPlayerPoints'

const BRAND = '#38003c'

function getBuildableMatches(allMatches) {
  const now = new Date()
  const isOpen = (m) => now < new Date(m.match_date) - 30 * 60 * 1000
  const openSorted = allMatches
    .filter(isOpen)
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
  if (openSorted.length === 0) return []
  const earliestDay = new Date(openSorted[0].match_date).toDateString()
  return openSorted.filter(
    (m) => new Date(m.match_date).toDateString() === earliestDay
  )
}

export default function ViewTeam() {
  const [matchList, setMatchList] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cricketTeams, setCricketTeams] = useState({})
  const [squad, setSquad] = useState([])
  const [captainId, setCaptainId] = useState(null)
  const [viceCaptainId, setViceCaptainId] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingSquad, setLoadingSquad] = useState(false)
  const [noTeamForCurrent, setNoTeamForCurrent] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  useEffect(() => {
    Promise.all([
      fetchAllPages('/api/matches/?page_size=20'),
      fetchAllPages('/api/cricket-teams/?page_size=20'),
    ])
      .then(([allMatches, teamListData]) => {
        const teamMap = {}
        teamListData.forEach((t) => {
          teamMap[t.id] = t.name
        })
        setCricketTeams(teamMap)
        setMatchList(getBuildableMatches(allMatches))
        setLoadingList(false)
      })
      .catch((err) => {
        console.error('Error loading matches:', err)
        setLoadingList(false)
      })
  }, [])

  useEffect(() => {
    if (matchList.length === 0) return
    const currentMatch = matchList[currentIndex]
    if (!currentMatch) return

    setLoadingSquad(true)
    setNoTeamForCurrent(false)

    axiosInstance
      .get('/api/fantasy-teams/')
      .then((res) => {
        const fantasyTeams = res.data.results || res.data
        const existing = fantasyTeams.find(
          (t) => (t.match?.id || t.match) === currentMatch.id
        )

        if (!existing) {
          setNoTeamForCurrent(true)
          setSquad([])
          setLoadingSquad(false)
          return
        }

        setTeamName(existing.name)

        return Promise.all([
          fetchAllPages('/api/fantasy-team-players/?page_size=20'),
          fetchMatchPlayerPoints(currentMatch.id),
        ]).then(([allRows, pointsByPlayer]) => {
          const rows = allRows.filter(
            (r) => (r.fantasy_team?.id || r.fantasy_team) === existing.id
          )

          return Promise.all(
            rows.map((row) =>
              axiosInstance.get(`/api/players/${row.player}/`).then((pRes) => ({
                ...pRes.data,
                credit_value: Number(pRes.data.credit_value),
                _isCaptain: row.is_captain,
                _isViceCaptain: row.is_vice_captain,
                points_earned:
                  pointsByPlayer[row.player] ?? row.points_earned ?? 0,
              }))
            )
          )
        })
      })
      .then((players) => {
        if (!players) return
        setSquad(players)
        const cap = players.find((p) => p._isCaptain)
        const vc = players.find((p) => p._isViceCaptain)
        setCaptainId(cap ? cap.id : null)
        setViceCaptainId(vc ? vc.id : null)
        setLoadingSquad(false)
      })
      .catch((err) => {
        console.error('Error loading team for match:', err)
        setLoadingSquad(false)
      })
  }, [matchList, currentIndex])

  const currentMatch = matchList[currentIndex] || null
  const isDeadlinePassed = currentMatch
    ? new Date() > new Date(currentMatch.match_date) - 30 * 60 * 1000
    : false

  const totalPoints = squad.reduce((sum, p) => {
    const multiplier =
      p.id === captainId ? 2 : p.id === viceCaptainId ? 1.5 : 1
    return sum + Number(p.points_earned || 0) * multiplier
  }, 0)

  if (loadingList) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex h-[60vh] items-center justify-center p-4">
          <div className="flex items-center gap-3 text-slate-500 font-medium text-sm sm:text-base">
            <div className="h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-2 border-purple-900 border-t-transparent" />
            Loading match fixtures...
          </div>
        </div>
      </div>
    )
  }

  if (matchList.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-16 sm:py-20 text-center">
          <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-purple-100 text-purple-900 mb-4 font-bold text-xl">
            🏏
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">No Open Matches</h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            There are currently no upcoming fixtures accepting squad modifications.
          </p>
          <Link
            to="/matches"
            className="mt-6 inline-block rounded-xl bg-purple-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-900 transition-colors"
          >
            Explore Match Schedule
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <Navbar />

      {/* Header Bar */}
      <div
        className="px-4 sm:px-6 py-4 sm:py-6 shadow-md border-b border-white/10"
        style={{ background: `linear-gradient(135deg, ${BRAND}, #1a0020)` }}
      >
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-md bg-white/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {currentMatch
                ? `${cricketTeams[currentMatch.home_team] || 'TBD'} vs ${
                    cricketTeams[currentMatch.away_team] || 'TBD'
                  }`
                : 'Match Preview'}
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white truncate">
              {noTeamForCurrent ? 'Squad Unset' : teamName || 'My XI'}
            </h1>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 rounded-xl sm:rounded-2xl bg-black/30 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 border border-white/10 w-full sm:w-fit">
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Squad Size
              </p>
              <p className="text-base sm:text-lg font-black text-amber-300">
                {squad.length} <span className="text-xs font-normal text-gray-400">/ 11</span>
              </p>
            </div>
            <div className="h-7 sm:h-8 w-px bg-white/10" />
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Total Points
              </p>
              <p className="text-base sm:text-lg font-black text-emerald-400">
                {totalPoints.toFixed(1)}{' '}
                <span className="text-[10px] sm:text-xs font-normal text-emerald-300">pts</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Double Header Tabs */}
      {matchList.length > 1 && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2">
          <div className="mx-auto max-w-5xl flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
              Today:
            </span>
            {matchList.map((m, i) => (
              <button
                key={m.id}
                onClick={() => {
                  setCurrentIndex(i)
                  setSelectedPlayer(null)
                }}
                className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  i === currentIndex
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                {cricketTeams[m.home_team] || 'TBD'} vs{' '}
                {cricketTeams[m.away_team] || 'TBD'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pitch Area */}
      <div className="mx-auto max-w-5xl px-2 sm:px-4 py-4 sm:py-8">
        {loadingSquad ? (
          <div className="flex h-64 sm:h-96 items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400 text-xs sm:text-sm font-medium">
              <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              Retrieving squad details...
            </div>
          </div>
        ) : noTeamForCurrent ? (
          <div className="mx-4 max-w-md sm:mx-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 text-center shadow-xl backdrop-blur-sm">
            <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-slate-800 text-amber-400 mb-3 text-base sm:text-lg font-bold">
              !
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">No Squad Submitted</h3>
            <p className="mt-1 text-xs text-slate-400">
              You haven't built a team for this match yet.
            </p>
            {currentMatch && (
              <Link
                to={`/build-team/${currentMatch.id}`}
                className="mt-5 inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-emerald-400 transition-colors"
              >
                Build Team Now
              </Link>
            )}
          </div>
        ) : (
          <div>
            <div
              className="relative rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-10 shadow-2xl overflow-hidden border border-emerald-500/20"
              style={{
                background:
                  'repeating-linear-gradient(180deg, #15803d 0px, #15803d 36px, #166534 36px, #166534 72px)',
              }}
            >
              {/* Pitch Boundaries */}
              <div
                className="pointer-events-none absolute border border-white/20 sm:border-2 rounded-[50%]"
                style={{ top: '1.5%', left: '2%', width: '96%', height: '97%' }}
              />
              <div
                className="pointer-events-none absolute bg-amber-100/15 border border-amber-200/20 rounded-sm left-1/2 -translate-x-1/2"
                style={{ top: '10%', height: '80%', width: '50px' }}
              />

              <div className="relative z-10 space-y-6 sm:space-y-8">
                {Object.keys(ROLE_LIMITS).map((role) => {
                  const playersInRole = squad.filter((p) => p.role === role)
                  if (playersInRole.length === 0) return null

                  return (
                    <div key={role} className="text-center">
                      <span className="inline-block rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold tracking-widest text-emerald-300 border border-white/10 uppercase mb-3 sm:mb-4 shadow-sm">
                        {role}
                      </span>

                      <div className="flex flex-wrap justify-center gap-2 sm:gap-6 md:gap-10">
                        {playersInRole.map((player) => {
                          const isCap = player.id === captainId
                          const isVc = player.id === viceCaptainId
                          const basePoints = Number(player.points_earned || 0)
                          const multiplier = isCap ? 2 : isVc ? 1.5 : 1
                          const calcPoints = basePoints * multiplier

                          return (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => setSelectedPlayer(player)}
                              className="group flex flex-col items-center w-[72px] sm:w-24 md:w-28 transition-transform hover:scale-105 focus:outline-none"
                            >
                              <div className="relative">
                                <div className="flex h-11 w-11 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-slate-900 border sm:border-2 border-white/30 text-white font-black text-sm sm:text-lg md:text-xl shadow-lg group-hover:border-emerald-400 transition-colors">
                                  {player.name ? player.name.charAt(0) : '?'}
                                </div>

                                {isCap && (
                                  <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-[9px] sm:text-[10px] md:text-[11px] shadow-md border border-slate-950">
                                    C
                                  </span>
                                )}
                                {isVc && (
                                  <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 items-center justify-center rounded-full bg-sky-400 text-slate-950 font-black text-[9px] sm:text-[10px] md:text-[11px] shadow-md border border-slate-950">
                                    VC
                                  </span>
                                )}
                              </div>

                              <div className="mt-1.5 w-full rounded bg-slate-950/90 backdrop-blur-md px-1 py-0.5 sm:px-2 sm:py-1 text-center border border-white/10 shadow-md">
                                <p className="truncate text-[10px] sm:text-xs font-bold text-white">
                                  {player.name}
                                </p>
                              </div>

                              <div className="mt-1 rounded-full bg-slate-900/90 px-2 py-0.5 border border-white/10">
                                <p className="text-[9px] sm:text-[10px] font-bold text-amber-300 whitespace-nowrap">
                                  {basePoints > 0
                                    ? `${calcPoints.toFixed(1)} pts`
                                    : `${player.credit_value || 0} Cr`}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {!isDeadlinePassed && currentMatch && (
              <div className="mt-6 sm:mt-8 flex justify-center">
                <Link
                  to={`/build-team/${currentMatch.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg hover:bg-amber-300 transition-transform hover:scale-105"
                >
                  ✏️ Edit Squad
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Responsive Player Info Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="w-full max-w-xs sm:max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 sm:pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {selectedPlayer.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  {selectedPlayer.role} • {cricketTeams[selectedPlayer.team] || 'Squad Member'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="my-4 sm:my-5 space-y-2 sm:space-y-2.5">
              <div className="flex justify-between items-center rounded-xl bg-slate-800/70 p-2.5 sm:p-3 text-xs">
                <span className="text-slate-400">Credit Value</span>
                <span className="font-bold text-amber-300 font-mono">
                  {selectedPlayer.credit_value || 0} Cr
                </span>
              </div>

              <div className="flex justify-between items-center rounded-xl bg-slate-800/70 p-2.5 sm:p-3 text-xs">
                <span className="text-slate-400">Squad Role</span>
                <span className="font-bold text-white">
                  {selectedPlayer.id === captainId
                    ? 'Captain (2×)'
                    : selectedPlayer.id === viceCaptainId
                    ? 'Vice-Captain (1.5×)'
                    : 'Standard'}
                </span>
              </div>

              {Number(selectedPlayer.points_earned) > 0 ? (
                <div className="flex justify-between items-center rounded-xl bg-emerald-950/60 p-3 border border-emerald-500/30 text-xs">
                  <span className="font-bold text-emerald-300">Total Points</span>
                  <span className="font-black text-emerald-400 text-sm font-mono">
                    {(
                      Number(selectedPlayer.points_earned) *
                      (selectedPlayer.id === captainId ? 2 : selectedPlayer.id === viceCaptainId ? 1.5 : 1)
                    ).toFixed(1)}{' '}
                    pts
                  </span>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-800/40 p-3 text-center text-[11px] sm:text-xs text-slate-400 border border-slate-800 leading-relaxed">
                  ⏳ Upcoming Match — Points calculation starts when play begins.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedPlayer(null)}
              className="w-full rounded-xl bg-slate-800 py-2 sm:py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}