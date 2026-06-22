import { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { TeamContext, ROLE_LIMITS } from '../context/TeamContext'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'

function Players({ showAddButton = false }) {
    const [players, setPlayers] = useState([])
    const { addPlayer, selectedPlayers } = useContext(TeamContext)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const roleFilter = searchParams.get('role')

    // New: controlled inputs. Each input's value lives in state, and
    // typing into the input calls setSearchTerm/setMinPrice/setMaxPrice,
    // which updates state, which re-renders the input with the new value.
    const [searchTerm, setSearchTerm] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')

    useEffect(() => {
        // URLSearchParams builds a query string for us safely
        const params = new URLSearchParams()
        if (roleFilter) params.append('role', roleFilter)
        if (searchTerm) params.append('search', searchTerm)
        if (minPrice) params.append('min_credit_value', minPrice)
        if (maxPrice) params.append('max_credit_value', maxPrice)

        axios.get(`http://localhost:8000/api/players/?${params.toString()}`)
            .then(res => {
                const normalized = res.data.map(p => ({ ...p, credit_value: Number(p.credit_value) }))
                setPlayers(normalized)
            })
            .catch(error => console.error('Error fetching players:', error))
    }, [roleFilter, searchTerm, minPrice, maxPrice])
    // ^ This array tells React: "re-run this effect whenever any of these
    // four values change." Before, it was [] (run once). Now, typing in
    // the search box updates searchTerm -> triggers this effect -> refetches.

    const handleAddPlayer = (player) => {
        const result = addPlayer(player)
        if (result.success) {
            const newCount = selectedPlayers.filter(p => p.role === player.role).length + 1
            if (newCount >= ROLE_LIMITS[player.role]) {
                navigate('/build-team')
            }
        } else {
            console.warn(result.error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-6">NPL Players</h1>
            {showAddButton && (
                <Link to="/build-team" className="inline-block mb-4 text-blue-600 hover:underline">
                    ← Back to team
                </Link>
            )}
            <p className="mb-4 text-sm text-gray-600">Selected: {selectedPlayers.length}</p>

            {/* New: the filter inputs */}
            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                />
                <input
                    type="number"
                    placeholder="Min credits"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 w-32"
                />
                <input
                    type="number"
                    placeholder="Max credits"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 w-32"
                />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="grid grid-cols-5 bg-gray-800 text-white text-sm font-semibold p-4">
                    <span>Player</span>
                    <span>Role</span>
                    <span>Batting</span>
                    <span>Bowling</span>
                    <span>Credits</span>
                </div>

                {players.map(player => {
                    const isSelected = selectedPlayers.some(p => p.id === player.id)

                    return (
                        <div
                            key={player.id}
                            className={`border-b border-gray-200 ${isSelected ? 'bg-green-50' : ''}`}
                        >
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
                                isSelected ? (
                                    <span className="inline-block bg-green-600 text-white text-sm py-1 px-3 rounded m-2">
                                        ✓ Added
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleAddPlayer(player)}
                                        className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded m-2"
                                    >
                                        Add to Team
                                    </button>
                                )
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Players