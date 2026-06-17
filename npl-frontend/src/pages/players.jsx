import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function Players() {
    const [players, setPlayers] = useState([])

    useEffect(() => {
        axios.get('http://localhost:8000/api/players/')
            .then(res => setPlayers(res.data))
            .catch(error => console.error('Error fetching players:', error))
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-6">NPL Players</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="grid grid-cols-5 bg-gray-800 text-white text-sm font-semibold p-4">
                    <span>Player</span>
                    <span>Role</span>
                    <span>Batting</span>
                    <span>Bowling</span>
                    <span>Credits</span>
                </div>

                {players.map(player => (
                    <Link
                        to={`/players/${player.id}`}
                        key={player.id}
                        className="grid grid-cols-5 items-center p-4 border-b border-gray-200 hover:bg-gray-50"
                    >
                        <span className="font-medium">{player.name}</span>
                        <span className="text-gray-600">{player.role}</span>
                        <span className="text-gray-600">{player.batting_style}</span>
                        <span className="text-gray-600">{player.bowling_style}</span>
                        <span className="text-blue-600 font-bold">{player.credit_value}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default Players