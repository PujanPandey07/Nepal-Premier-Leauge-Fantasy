import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

function CricketTeamDetail() {
  const { teamId } = useParams()
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      axiosInstance.get(`/api/cricket-teams/${teamId}/`),
      axiosInstance.get(`/api/players/?team=${teamId}&page_size=50`)
    ])
      .then(([teamRes, playersRes]) => {
        setTeam(teamRes.data)
        setPlayers(playersRes.data.results || playersRes.data)
      })
      .catch(err => {
        console.error('Error loading team:', err)
        setError('Could not load team details. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [teamId])

  // Group players by role
  const roles = ['Wicket-Keeper', 'Batsman', 'All-Rounder', 'Bowler']
  const playersByRole = roles.reduce((acc, role) => {
    acc[role] = players.filter(p => p.role === role)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
          <div className="bg-slate-800 h-28 rounded-xl mb-8" />
          <div className="h-32 bg-gray-200 rounded-xl mb-4" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-block p-4 bg-red-50 text-red-600 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
          <div>
            <Link to="/cricket-teams" className="text-sm text-blue-600 hover:underline">
              ← Back to all teams
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!team) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
        {/* Breadcrumb Link */}
        <Link 
          to="/cricket-teams" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors mb-4"
        >
          ← Back to teams
        </Link>

        {/* Team Banner */}
        <div className="bg-slate-900 rounded-xl p-6 shadow-md flex items-center gap-5 mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-yellow-400 font-bold text-xl sm:text-2xl shrink-0 shadow-inner">
            {team.short_name}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{team.name}</h1>
            {team.home_venue && (
              <p className="text-gray-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                <span>🏟</span> {team.home_venue}
              </p>
            )}
          </div>
        </div>

        {/* Players Grouped By Role */}
        {roles.map(role => {
          const rolePlayers = playersByRole[role]
          if (!rolePlayers || rolePlayers.length === 0) return null

          return (
            <div key={role} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {role}
                </h2>
                <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {rolePlayers.length}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 bg-slate-800 text-white text-xs font-semibold px-4 py-3">
                  <span className="col-span-5 sm:col-span-4">Name</span>
                  <span className="col-span-3 sm:col-span-3">Batting</span>
                  <span className="col-span-2 sm:col-span-3">Bowling</span>
                  <span className="col-span-2 text-right">Credits</span>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-gray-100">
                  {rolePlayers.map(player => (
                    <div
                      key={player.id}
                      className="grid grid-cols-12 items-center px-4 py-3 text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                    >
                      <span className="col-span-5 sm:col-span-4 font-semibold text-gray-900 truncate pr-2">
                        {player.name}
                      </span>
                      <span className="col-span-3 sm:col-span-3 text-gray-500 truncate">
                        {player.batting_style || '-'}
                      </span>
                      <span className="col-span-2 sm:col-span-3 text-gray-500 truncate">
                        {player.bowling_style || '-'}
                      </span>
                      <span className="col-span-2 text-right font-bold text-blue-600">
                        {player.credit_value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {/* Fallback Empty State */}
        {players.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            No players found registered for this team.
          </div>
        )}
      </main>
    </div>
  )
}

export default CricketTeamDetail