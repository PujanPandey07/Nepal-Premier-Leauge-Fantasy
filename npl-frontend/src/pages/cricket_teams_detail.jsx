// CricketTeamDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/navbar'

function CricketTeamDetail() {
    const { teamId } = useParams()
    const [team, setTeam] = useState(null)
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        Promise.all([
            axios.get(`http://localhost:8000/api/cricket-teams/${teamId}/`),
            axios.get(`http://localhost:8000/api/players/?team=${teamId}`),
        ])
            .then(([teamRes, playersRes]) => {
                setTeam(teamRes.data)
                setPlayers(playersRes.data.results || playersRes.data)
            })
            .catch(err => {
                console.error('Error loading team:', err)
                setError('Could not load this team')
            })
            .finally(() => setLoading(false))
    }, [teamId])

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <p className="p-8">Loading...</p>
        </div>
    )
    if (error) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <p className="p-8 text-red-500">{error}</p>
        </div>
    )
    if (!team) return null

    // Group players by role
    const roles = ['Wicket-Keeper', 'Batsman', 'All-Rounder', 'Bowler']
    const playersByRole = roles.reduce((acc, role) => {
        acc[role] = players.filter(p => p.role === role)
        return acc
    }, {})

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Navbar />
            <div className="max-w-3xl mx-auto">

                <Link to="/cricket-teams" className="text-blue-600 hover:underline text-sm">
                    ← Back to teams
                </Link>

                {/* Team banner */}
                <div className="bg-slate-900 rounded-xl p-6 flex items-center gap-5 mt-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-900 font-bold text-xl flex-shrink-0">
                        {team.short_name}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{team.name}</h1>
                        <p className="text-gray-400 text-sm mt-1">🏟 {team.home_venue}</p>
                    </div>
                </div>

                {/* Players grouped by role */}
                {roles.map(role => {
                    const rolePlayers = playersByRole[role]
                    if (rolePlayers.length === 0) return null
                    return (
                        <div key={role} className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                {role} ({rolePlayers.length})
                            </h2>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className="grid grid-cols-4 bg-gray-800 text-white text-xs font-semibold p-3">
                                    <span>Name</span>
                                    <span>Batting</span>
                                    <span>Bowling</span>
                                    <span>Credits</span>
                                </div>
                                {/* Rows */}
                                {rolePlayers.map(player => (
                                    <div
                                        key={player.id}
                                        className="grid grid-cols-4 items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                                    >
                                        <span className="font-medium text-sm">{player.name}</span>
                                        <span className="text-gray-500 text-sm">{player.batting_style}</span>
                                        <span className="text-gray-500 text-sm">{player.bowling_style}</span>
                                        <span className="text-blue-600 font-bold text-sm">{player.credit_value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {players.length === 0 && (
                    <p className="text-gray-500">No players found for this team.</p>
                )}
            </div>
        </div>
    )
}

export default CricketTeamDetail