// ViewTeam.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { ROLE_LIMITS } from '../context/TeamContext'
import Navbar from '../components/navbar'

function ViewTeam() {
  const [match, setMatch] = useState(null)
  const [squad, setSquad] = useState([])
  const [captainId, setCaptainId] = useState(null)
  const [viceCaptainId, setViceCaptainId] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [cricketTeams, setCricketTeams] = useState({})
  const [loading, setLoading] = useState(true)
  const [noTeam, setNoTeam] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    const headers = { Authorization: `Bearer ${token}` }

    // Step 1: find the closest match with an open deadline —
    // same rule as BuildTeamRedirect so both pages agree on "current match"
    Promise.all([
      axios.get('http://localhost:8000/api/matches/'),
      axios.get('http://localhost:8000/api/cricket-teams/'),
    ])
      .then(([matchesRes, teamsRes]) => {
        const allMatches = matchesRes.data.results || matchesRes.data
        const teamList = teamsRes.data.results || teamsRes.data

        // Build id -> name map for the header
        const teamMap = {}
        teamList.forEach(t => { teamMap[t.id] = t.name })
        setCricketTeams(teamMap)

        const now = new Date()
        const eligible = allMatches.filter(m =>
          now < new Date(m.match_date) - 30 * 60 * 1000
        )

        if (eligible.length === 0) {
          // No open match — nothing to show
          setNoTeam(true)
          setLoading(false)
          return
        }

        const closest = eligible.reduce((soonest, current) =>
          new Date(current.match_date) < new Date(soonest.match_date) ? current : soonest
        )
        setMatch(closest)

        // Step 2: check if the user has a saved fantasy team for this match
        return axios.get('http://localhost:8000/api/fantasy-teams/', { headers })
          .then(res => {
            const fantasyTeams = res.data.results || res.data
            const existing = fantasyTeams.find(t => t.match === closest.id)

            if (!existing) {
              setNoTeam(true)
              setLoading(false)
              return
            }

            setTeamName(existing.name)

            // Step 3: load the 11 players for this team
            return axios.get('http://localhost:8000/api/fantasy-team-players/', { headers })
              .then(res2 => {
                const allRows = res2.data.results || res2.data
                const rows = allRows.filter(r => r.fantasy_team === existing.id)

                return Promise.all(
                  rows.map(row =>
                    axios.get(`http://localhost:8000/api/players/${row.player}/`)
                      .then(pRes => ({
                        ...pRes.data,
                        credit_value: Number(pRes.data.credit_value),
                        _isCaptain: row.is_captain,
                        _isViceCaptain: row.is_vice_captain,
                        points_earned: row.points_earned,
                      }))
                  )
                )
              })
              .then(players => {
                setSquad(players)
                const cap = players.find(p => p._isCaptain)
                const vc = players.find(p => p._isViceCaptain)
                if (cap) setCaptainId(cap.id)
                if (vc) setViceCaptainId(vc.id)
                setLoading(false)
              })
          })
      })
      .catch(err => {
        console.error('Error loading view team:', err)
        setLoading(false)
      })
  }, [])

  const isDeadlinePassed = match
    ? new Date() > new Date(match.match_date) - 30 * 60 * 1000
    : false

  const totalPoints = squad.reduce((sum, p) => sum + (p.points_earned || 0), 0)

  if (loading) return <p className="p-8">Loading...</p>

  if (noTeam) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center mt-20">
        <p className="text-gray-600 text-lg">No saved team found for the current match.</p>
        <Link
          to="/matches"
          className="mt-4 text-blue-600 underline"
        >
          Go to matches to build your team
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <div>
          {/* Show which match this team is for */}
          <p className="text-xs text-gray-400">
            {match
              ? `${cricketTeams[match.home_team] || '...'} vs ${cricketTeams[match.away_team] || '...'}`
              : ''}
          </p>
          <p className="text-lg font-bold">{teamName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Points</p>
          <p className="text-lg font-bold">{totalPoints}</p>
        </div>
      </div>

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

          {/* Edit team button — only if deadline hasn't passed */}
          {!isDeadlinePassed && match && (
            <div className="text-center mt-8">
              <Link
                to={`/build-team/${match.id}`}
                className="inline-block bg-yellow-500 text-white px-6 py-2 rounded font-semibold"
              >
                Edit Team
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewTeam