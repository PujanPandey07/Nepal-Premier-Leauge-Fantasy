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
                // fetch teammates after we know the team
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

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Player Card */}
                <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-6 text-white mb-6">
                        <h1 className="text-3xl font-bold">{player.name}</h1>
                        <p className="text-blue-100">{player.role} • {player.nationality}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Batting Style</p>
                            <p className="font-semibold">{player.batting_style}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Bowling Style</p>
                            <p className="font-semibold">{player.bowling_style}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Credit Value</p>
                            <p className="font-semibold text-blue-600">{player.credit_value}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Availability</p>
                            <p className="font-semibold">{player.is_available ? 'Available' : 'Unavailable'}</p>
                        </div>
                    </div>
                </div>

                {/* Teammates Sidebar */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold mb-4">Teammates</h2>
                    <div className="space-y-3">
                        {teammates.map(mate => (
                            <div key={mate.id} className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    {mate.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{mate.name}</p>
                                    <p className="text-xs text-gray-500">{mate.role}</p>
                                </div>
                            </div>
                        ))}
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