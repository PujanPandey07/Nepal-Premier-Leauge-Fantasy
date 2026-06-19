import { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { TeamContext } from '../context/TeamContext'
import { Link, useSearchParams } from 'react-router-dom'

function Players({ showAddButton = false }) {
    const [players, setPlayers] = useState([])
    const { addPlayer, selectedPlayers } = useContext(TeamContext)
    const [searchParams] = useSearchParams()
    const roleFilter = searchParams.get('role')
    const displayedPlayers = roleFilter ? players.filter(p => p.role === roleFilter) : players

    useEffect(() => {
        axios.get('http://localhost:8000/api/players/')
            .then(res => setPlayers(res.data))
            .catch(error => console.error('Error fetching players:', error))
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-6">NPL Players</h1>
            <p className="mb-4 text-sm text-gray-600">Selected: {selectedPlayers.length}</p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="grid grid-cols-5 bg-gray-800 text-white text-sm font-semibold p-4">
                    <span>Player</span>
                    <span>Role</span>
                    <span>Batting</span>
                    <span>Bowling</span>
                    <span>Credits</span>
                </div>

                {displayedPlayers.map(player => (
                    <div key={player.id} className="border-b border-gray-200">
                        <Link
                            to={`/players/${player.id}`}
                            className="grid grid-cols-5 items-center p-4 hover:bg-gray-50"
                        >
                            <span className="font-medium">{player.name}</span>
                            <span className="text-gray-600">{player.role}</span>
                            <span className="text-gray-600">{player.batting_style}</span>
                            <span className="text-gray-600">{player.bowling_style}</span>
                            <span className="text-blue-600 font-bold">{player.credit_value}</span>
                        </Link>
                        {showAddButton && (
                            <button
                                onClick={() => addPlayer(player)}
                                className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded m-2"
                            >
                                Add to Team
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Players