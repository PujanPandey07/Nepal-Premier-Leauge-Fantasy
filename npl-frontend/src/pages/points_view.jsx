// ViewPoints.jsx
import { useState, useEffect } from 'react'
import { ROLE_LIMITS } from '../context/teamcontext'
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

  // Layer 1: lightweight list of all past teams
  useEffect(() => {
    Promise.all([
      fetchAllPages('/api/fantasy-teams/?page_size=20'),
      fetchAllPages('/api/matches/?page_size=20'),
      fetchAllPages('/api/cricket-teams/?page_size=20'),
    ])
      .then(([fantasyTeams, matches, cricketTeams]) => {
        const teamName = (id) => {
          const t = cricketTeams.find(ct => ct.id === id)
          return t ? t.name : 'Unknown'
        }

        const combined = fantasyTeams.map(ft => {
          const match = matches.find(m => m.id === ft.match)
          if (!match) return null

          return {
            fantasyTeamId: ft.id,
            matchId: match.id,
            matchDate: match.match_date,
            totalPoints: ft.total_points || 0,
            label: `${teamName(match.home_team)} vs ${teamName(match.away_team)}`,
          }
        }).filter(Boolean)

        combined.sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate))
        setTeamList(combined)
      })
      .catch(error => {
        console.error('Error loading team list:', error)
        setError('Failed to load points history')
      })
      .finally(() => setLoadingList(false))
  }, [])

  // Layer 2: fetch the 11-player squad for the currently selected team
  useEffect(() => {
    if (teamList.length === 0) return
    const currentTeam = teamList[currentIndex]
    if (!currentTeam) return

    setLoadingSquad(true)

    Promise.all([
      fetchAllPages('/api/fantasy-team-players/?page_size=20'),
      fetchMatchPlayerPoints(currentTeam.matchId),
    ])
      .then(([allRows, pointsByPlayer]) => {
       const rows = allRows.filter(r => (r.fantasy_team?.id || r.fantasy_team) === currentTeam.fantasyTeamId)

        return Promise.all(
          rows.map(row =>
            // axiosInstance already attaches the Bearer token via interceptor
            axiosInstance.get(`/api/players/${row.player}/`)
              .then(pRes => ({
                ...pRes.data,
                _isCaptain: row.is_captain,
                _isViceCaptain: row.is_vice_captain,
                points_earned: pointsByPlayer[row.player] ?? row.points_earned ?? 0,
              }))
          )
        )
      })
      .then(players => setSquad(players))
      .catch(err => console.error('Error loading squad for match:', err))
      .finally(() => setLoadingSquad(false))
  }, [teamList, currentIndex])

  const isLatest = currentIndex === 0
  const isOldest = currentIndex === teamList.length - 1
  const goNewer = () => setCurrentIndex(i => Math.max(i - 1, 0))
  const goOlder = () => setCurrentIndex(i => Math.min(i + 1, teamList.length - 1))

  if (loadingList) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (teamList.length === 0) return <p>No fantasy teams yet.</p>

  const currentTeam = teamList[currentIndex]
  const currentTeamPoints = squad.reduce((sum, player) => {
    const multiplier = player._isCaptain ? 2 : player._isViceCaptain ? 1.5 : 1
    return sum + (Number(player.points_earned || 0) * multiplier)
  }, 0)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <p className="text-lg font-bold">{currentTeam.label}</p>
          <p className="text-xs text-gray-400">
            Season Total: {teamList.reduce((sum, t) => sum + t.totalPoints, 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Match Points</p>
          <p className="text-lg font-bold">{currentTeamPoints}</p>
        </div>
      </div>

      <div className="flex justify-between px-6 py-2 bg-slate-800 text-white text-sm">
        <button onClick={goNewer} disabled={isLatest} className="disabled:opacity-30">← Newer</button>
        <button onClick={goOlder} disabled={isOldest} className="disabled:opacity-30">Older →</button>
      </div>

      {loadingSquad ? (
        <p className="text-center mt-8">Loading squad...</p>
      ) : (
        <div
          className="relative p-8 overflow-hidden w-full min-h-screen"
          style={{
            background: 'repeating-linear-gradient(180deg, #15803d 0px, #15803d 40px, #166534 40px, #166534 80px)'
          }}
        >
          <div
            className="absolute border-2 border-white/30 rounded-[50%]"
            style={{ top: '3%', left: '5%', width: '90%', height: '95%' }}
          />
          <div
            className="absolute bg-yellow-100/20 left-1/2 -translate-x-1/2"
            style={{ top: '8%', height: '40%', width: '60px' }}
          />

          <div className="relative z-10">
            {Object.entries(ROLE_LIMITS).map(([role]) => {
              const playersInRole = squad.filter(p => p.role === role)
              return (
                <div key={role} className="mb-10">
                  <h2 className="text-white text-center text-sm font-semibold tracking-wide uppercase mb-4">
                    {role}
                  </h2>
                  <div className="flex justify-center gap-16 flex-wrap">
                    {playersInRole.map(player => (
                      <div key={player.id} className="flex flex-col items-center w-24">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-white shadow-lg flex flex-col items-center justify-center text-gray-700 font-bold overflow-hidden">
                            <span className="text-xl leading-none">{player.name.charAt(0)}</span>
                            <span className="mt-1 w-full bg-slate-900/90 text-[10px] font-black leading-4 text-white text-center">
                              {player.points_earned || 0} pts
                            </span>
                          </div>
                          {player._isCaptain && (
                            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black border border-yellow-500 rounded-full w-5 h-5 text-[10px] font-black flex items-center justify-center shadow">C</span>
                          )}
                          {player._isViceCaptain && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white border border-blue-600 rounded-full w-5 h-5 text-[10px] font-black flex items-center justify-center shadow">VC</span>
                          )}
                        </div>
                        <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded mt-2 truncate w-full text-center">
                          {player.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}