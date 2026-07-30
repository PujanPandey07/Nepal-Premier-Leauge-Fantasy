import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

function PlayersDetail() {
    const { id } = useParams()
    const [player, setPlayer] = useState(null)
    const [teammates, setTeammates] = useState([])
    const [seasonStats, setSeasonStats] = useState(null)

    useEffect(() => {
        axiosInstance.get(`/api/players/${id}/`)
            .then(res => {
                setPlayer(res.data)
                axiosInstance.get('/api/players/')
                    .then(allRes => {
                        const others = allRes.data.results.filter(
                            p => p.team === res.data.team && p.id !== res.data.id
                        )
                        setTeammates(others)
                    })
            })
            .catch(error => console.error('Error fetching player details:', error))

        axiosInstance.get(`/api/players/${id}/season-stats/`)
            .then(res => setSeasonStats(res.data))
            .catch(error => console.error('Error fetching season stats:', error))
    }, [id])

    if (!player) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </div>
        )
    }

    const initials = player.name.split(' ').map(n => n[0]).join('')

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />

            {/* Hero banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-800">
                <div className="max-w-5xl mx-auto px-6 py-10 flex items-center gap-8">
                    <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-indigo-900 font-bold text-4xl shrink-0 shadow-lg">
                        {initials}
                    </div>
                    <div>
                        <p className="uppercase text-indigo-200 text-xs font-semibold tracking-wider mb-1">
                            {player.role}
                        </p>
                        <h1 className="text-4xl font-extrabold text-white leading-tight">
                            {player.name}
                        </h1>
                        <p className="text-indigo-200 text-sm mt-2">{player.nationality}</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            player.is_available
                                ? 'bg-green-500/20 text-green-300 border border-green-400/40'
                                : 'bg-red-500/20 text-red-300 border border-red-400/40'
                        }`}>
                            {player.is_available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Season stat strip — now real match data, not just profile fields */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-4 divide-x divide-gray-200">
                    <div className="text-center px-4">
                        <p className="text-3xl font-extrabold text-gray-900">
                            {seasonStats ? seasonStats.matches_played : '–'}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Matches</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-3xl font-extrabold text-gray-900">
                            {seasonStats ? seasonStats.total_runs : '–'}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Runs</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-3xl font-extrabold text-gray-900">
                            {seasonStats ? seasonStats.total_wickets : '–'}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Wickets</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-3xl font-extrabold text-indigo-700">
                            {seasonStats ? seasonStats.total_fantasy_points : '–'}
                        </p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Fantasy Pts</p>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Overview</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Role</p>
                            <p className="text-base font-semibold text-gray-900">{player.role}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Nationality</p>
                            <p className="text-base font-semibold text-gray-900">{player.nationality}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Batting Style</p>
                            <p className="text-base font-semibold text-gray-900">{player.batting_style}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Bowling Style</p>
                            <p className="text-base font-semibold text-gray-900">{player.bowling_style}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Credit Value</p>
                            <p className="text-base font-semibold text-blue-600">{player.credit_value}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="font-bold text-gray-900 mb-3">Squad</p>
                    <div className="space-y-1">
                        {teammates.map(mate => {
                            const mateInitials = mate.name.split(' ').map(n => n[0]).join('')
                            return (
                                <div key={mate.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-bold text-indigo-800">
                                        {mateInitials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{mate.name}</p>
                                        <p className="text-xs text-gray-500">{mate.role}</p>
                                    </div>
                                </div>
                            )
                        })}
                        {teammates.length === 0 && (
                            <p className="text-sm text-gray-400">No teammates found</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default PlayersDetail