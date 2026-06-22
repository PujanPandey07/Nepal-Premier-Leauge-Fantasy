import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

function PlayersDetail() {
    const { id } = useParams()
    const [player, setPlayer] = useState(null)
    const [teammates, setTeammates] = useState([])

    useEffect(() => {
        axios.get(`http://localhost:8000/api/players/${id}/`)
            .then(res => {
                setPlayer(res.data)
                axios.get('http://localhost:8000/api/players/')
                    .then(allRes => {
                        const others = allRes.data.filter(
                            p => p.team === res.data.team && p.id !== res.data.id
                        )
                        setTeammates(others)
                    })
            })
            .catch(error => console.error('Error fetching player details:', error))
    }, [id])

    if (!player) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    const initials = player.name.split(' ').map(n => n[0]).join('')

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Left column - main info */}
                <div className="md:col-span-2">
                    {/* Banner */}
                    <div className="bg-blue-600 rounded-xl p-6 flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 font-semibold text-2xl">
                            {initials}
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-white">{player.name}</p>
                            <p className="text-blue-100 text-sm mt-1">{player.role} · {player.nationality}</p>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Batting style</p>
                                <p className="text-base font-semibold">{player.batting_style}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Bowling style</p>
                                <p className="text-base font-semibold">{player.bowling_style}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Credit value</p>
                                <p className="text-base font-semibold text-blue-600">{player.credit_value}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Availability</p>
                                <p className={`text-base font-semibold ${player.is_available ? 'text-green-600' : 'text-red-600'}`}>
                                    {player.is_available ? 'Available' : 'Unavailable'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column - teammates */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="font-semibold mb-3">Teammates</p>
                    <div className="space-y-1">
                        {teammates.map(mate => {
                            const mateInitials = mate.name.split(' ').map(n => n[0]).join('')
                            return (
                                <div key={mate.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
                                        {mateInitials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{mate.name}</p>
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