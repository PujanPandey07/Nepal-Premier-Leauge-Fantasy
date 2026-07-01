import { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { TeamContext, ROLE_LIMITS } from '../context/TeamContext'
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/navbar'

function Players({ showAddButton = false }) {
    const [players, setPlayers] = useState([])
    const { addPlayer, selectedPlayers, match } = useContext(TeamContext)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { matchId } = useParams()  // same matchId as TeamBuilder, used for back link + navigate
    const roleFilter = searchParams.get('role')
    const [nextPage, setNextPage] = useState(null)
    const [prevPage, setPrevPage] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')

    useEffect(() => {
        // match comes from TeamContext, which reads matchId from the URL —
        // wait for it before fetching so we can scope players to this match's teams
        if (!match) return

        const params = new URLSearchParams()
        if (roleFilter) params.append('role', roleFilter)
        if (searchTerm) params.append('search', searchTerm)
        if (minPrice) params.append('min_credit_value', minPrice)
        if (maxPrice) params.append('max_credit_value', maxPrice)
        // Only fetch players from this match's two teams
        params.append('teams', `${match.home_team},${match.away_team}`)

        axios.get(`http://localhost:8000/api/players/?${params.toString()}`)
            .then(res => {
                const normalized = res.data.results.map(p => ({ ...p, credit_value: Number(p.credit_value) }))
                setPlayers(normalized)
                setNextPage(res.data.next)
                setPrevPage(res.data.previous)
            })
            .catch(error => console.error('Error fetching players:', error))
    }, [roleFilter, searchTerm, minPrice, maxPrice, match])

    const handleAddPlayer = async (player) => {
        const result = await addPlayer(player)
        if (result.success) {
            const newCount = selectedPlayers.filter(p => p.role === player.role).length + 1
            if (newCount >= ROLE_LIMITS[player.role]) {
                // Go back to THIS match's build page, not just /build-team
                navigate(`/build-team/${matchId}`)
            }
        } else {
            alert(result.error)
        }
    }

    const goToPage = (url) => {
        if (!url) return
        axios.get(url)
            .then(res => {
                const normalized = res.data.results.map(p => ({ ...p, credit_value: Number(p.credit_value) }))
                setPlayers(normalized)
                setNextPage(res.data.next)
                setPrevPage(res.data.previous)
            })
            .catch(error => console.error('Error fetching players:', error))
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Navbar />
            <h1 className="text-2xl font-bold mb-6">NPL Players</h1>
            {showAddButton && (
                // Back link uses matchId so we return to the right match's build page
                <Link to={`/build-team/${matchId}`} className="inline-block mb-4 text-blue-600 hover:underline">
                    ← Back to team
                </Link>
            )}
            <p className="mb-4 text-sm text-gray-600">Selected: {selectedPlayers.length}</p>

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
            <div className="flex justify-between mt-4">
                <button disabled={!prevPage} onClick={() => goToPage(prevPage)}>Previous</button>
                <button disabled={!nextPage} onClick={() => goToPage(nextPage)}>Next</button>
            </div>
        </div>
    )
}

export default Players