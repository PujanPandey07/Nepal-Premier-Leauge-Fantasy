
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROLE_LIMITS } from '../context/teamcontext'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'
import { fetchAllPages } from '../utilis/fetchAllPages'
import { fetchMatchPlayerPoints } from '../utilis/fetchMatchPlayerPoints'

function getBuildableMatches(allMatches) {
  const now = new Date()
  const isOpen = (m) => now < new Date(m.match_date) - 30 * 60 * 1000
  const openSorted = allMatches.filter(isOpen).sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
  if (openSorted.length === 0) return []
  const earliestDay = new Date(openSorted[0].match_date).toDateString()
  return openSorted.filter(m => new Date(m.match_date).toDateString() === earliestDay)
}

function ViewTeam() {
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

  // Layer 1: figure out every currently-buildable match
  useEffect(() => {
    Promise.all([
      fetchAllPages('/api/matches/?page_size=20'),
      fetchAllPages('/api/cricket-teams/?page_size=20'),
    ])
      .then(([allMatches, teamListData]) => {
        const teamMap = {}
        teamListData.forEach(t => { teamMap[t.id] = t.name })
        setCricketTeams(teamMap)
        setMatchList(getBuildableMatches(allMatches))
        setLoadingList(false)
      })
      .catch(err => {
        console.error('Error loading matches:', err)
        setLoadingList(false)
      })
  }, [])

  // Layer 2: load the saved team for whichever match tab is currently selected
  useEffect(() => {
    if (matchList.length === 0) return
    const currentMatch = matchList[currentIndex]
    if (!currentMatch) return

    setLoadingSquad(true)
    setNoTeamForCurrent(false)

    axiosInstance.get('/api/fantasy-teams/')
      .then(res => {
        const fantasyTeams = res.data.results || res.data
        const existing = fantasyTeams.find(t => (t.match?.id || t.match) === currentMatch.id)
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
        ])
          .then(([allRows, pointsByPlayer]) => {
            const rows = allRows.filter(r => (r.fantasy_team?.id || r.fantasy_team) === existing.id)

            return Promise.all(
              rows.map(row =>
                axiosInstance.get(`/api/players/${row.player}/`)
                  .then(pRes => ({
                    ...pRes.data,
                    credit_value: Number(pRes.data.credit_value),
                    _isCaptain: row.is_captain,
                    _isViceCaptain: row.is_vice_captain,
                    points_earned: pointsByPlayer[row.player] ?? row.points_earned ?? 0,
                  }))
              )
            )
          })
          .then(players => {
            setSquad(players)
            const cap = players.find(p => p._isCaptain)
            const vc = players.find(p => p._isViceCaptain)
            setCaptainId(cap ? cap.id : null)
            setViceCaptainId(vc ? vc.id : null)
            setLoadingSquad(false)
          })
      })
      .catch(err => {
        console.error('Error loading team for match:', err)
        setLoadingSquad(false)
      })
  }, [matchList, currentIndex])

  const currentMatch = matchList[currentIndex] || null
  const isDeadlinePassed = currentMatch
    ? new Date() > new Date(currentMatch.match_date) - 30 * 60 * 1000
    : false
  const totalPoints = squad.reduce((sum, p) => {
    const multiplier = p.id === captainId ? 2 : p.id === viceCaptainId ? 1.5 : 1
    return sum + (Number(p.points_earned || 0) * multiplier)
  }, 0)

  if (loadingList) return <p className="p-8">Loading...</p>

  if (matchList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center mt-20">
          <p className="text-gray-600 text-lg">No open match right now.</p>
          <Link to="/matches" className="mt-4 text-blue-600 underline">Go to matches</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">
            {currentMatch
              ? `${cricketTeams[currentMatch.home_team] || '...'} vs ${cricketTeams[currentMatch.away_team] || '...'}`
              : ''}
          </p>
          <p className="text-lg font-bold">{noTeamForCurrent ? 'No team yet' : teamName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Points</p>
          <p className="text-lg font-bold">{totalPoints}</p>
        </div>
      </div>

      {/* Only appears on double-header days — lets you switch between the two open matches */}
      {matchList.length > 1 && (
        <div className="flex justify-center gap-2 bg-slate-800 text-white text-sm py-2">
          {matchList.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setCurrentIndex(i)}
              className={`px-3 py-1 rounded ${i === currentIndex ? 'bg-yellow-500 text-slate-900 font-semibold' : 'bg-slate-700'}`}
            >
              {cricketTeams[m.home_team] || '...'} vs {cricketTeams[m.away_team] || '...'}
            </button>
          ))}
        </div>
      )}

      {loadingSquad ? (
        <p className="text-center mt-8">Loading...</p>
      ) : noTeamForCurrent ? (
        <div className="flex flex-col items-center justify-center mt-20">
          <p className="text-gray-600 text-lg">No saved team for this match yet.</p>
          {currentMatch && (
            <Link to={`/build-team/${currentMatch.id}`} className="mt-4 text-blue-600 underline">
              Build your team
            </Link>
          )}
        </div>
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
                          <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg">
                            {player.name.charAt(0)}
                          </div>
                          {player.id === captainId && (
                            <span className="absolute -top-1 -right-1 bg-white text-yellow-600 border border-yellow-600 rounded-full w-5 h-5 text-[10px] font-bold flex items-center justify-center">
                              C
                            </span>
                          )}
                          {player.id === viceCaptainId && (
                            <span className="absolute -top-1 -right-1 bg-white text-blue-600 border border-blue-600 rounded-full w-5 h-5 text-[10px] font-bold flex items-center justify-center">
                              VC
                            </span>
                          )}
                        </div>
                        <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded mt-1 truncate w-full text-center">
                          {player.name}
                        </div>
                        <p className="text-white text-xs mt-1">{player.points_earned || 0} pts</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {!isDeadlinePassed && currentMatch && (
              <div className="text-center mt-8">
                <Link
                  to={`/build-team/${currentMatch.id}`}
                  className="inline-block bg-yellow-500 text-white px-6 py-2 rounded font-semibold"
                >
                  Edit Team
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewTeam