import { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { TeamContext, ROLE_LIMITS } from '../context/teamcontext'
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

function Players({ showAddButton = false }) {
    const [players, setPlayers] = useState([])
    const context = useContext(TeamContext)
    const addPlayer = context?.addPlayer
    const selectedPlayers = context?.selectedPlayers || []
    const match = context?.match || null
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { matchId } = useParams()
    const roleFilter = searchParams.get('role')
    const [nextPage, setNextPage] = useState(null)
    const [prevPage, setPrevPage] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')
    const [cricketTeams, setCricketTeams] = useState({})

    useEffect(() => {
        axiosInstance.get('/api/cricket-teams/')
            .then(res => {
                const list = res.data.results || res.data
                const map = {}
                list.forEach(t => { map[t.id] = t.name })
                setCricketTeams(map)
            })
            .catch(error => console.error('Error fetching teams:', error))
    }, [])

    useEffect(() => {
        // In team-building mode (showAddButton=true): wait for match to load
        // so we can scope players to that match's two teams only.
        // In general players page (showAddButton=false): skip the guard
        // and fetch all players with no team filter.
        if (showAddButton && !match) return

        const params = new URLSearchParams()
        if (roleFilter) params.append('role', roleFilter)
        if (searchTerm) params.append('search', searchTerm)
        if (minPrice) params.append('min_credit_value', minPrice)
        if (maxPrice) params.append('max_credit_value', maxPrice)
        // Only filter by match teams when in team-building mode
        if (showAddButton && match) {
            params.append('teams', `${match.home_team},${match.away_team}`)
        }

        axiosInstance.get(`/api/players/?${params.toString()}`)
            .then(res => {
                const normalized = res.data.results.map(p => ({ ...p, credit_value: Number(p.credit_value) }))
                setPlayers(normalized)
                setNextPage(res.data.next)
                setPrevPage(res.data.previous)
            })
            .catch(error => console.error('Error fetching players:', error))
    }, [roleFilter, searchTerm, minPrice, maxPrice, match, showAddButton])

    const handleAddPlayer = async (player) => {
        const result = await addPlayer(player)
        if (result.success) {
            const newCount = selectedPlayers.filter(p => p.role === player.role).length + 1
            if (newCount >= ROLE_LIMITS[player.role]) {
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:px-8 md:py-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">NPL Players</h1>
                {showAddButton && (
                    <Link to={`/build-team/${matchId}`} className="inline-block mb-4 text-blue-600 hover:underline text-sm font-medium">
                        ← Back to team
                    </Link>
                )}
                <p className="mb-4 text-sm text-gray-600">Selected: {selectedPlayers.length}</p>

                {/* Filter Controls (Responsive Flex) */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Search by name"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-500 flex-1 min-w-[200px]"
                    />
                    <input
                        type="number"
                        placeholder="Min credits"
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-500 w-full sm:w-32"
                    />
                    <input
                        type="number"
                        placeholder="Max credits"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-500 w-full sm:w-32"
                    />
                </div>

                {/* Table Container (Horizontal scroll on mobile viewports) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[650px]">
                            <div className="grid grid-cols-6 bg-gray-800 text-white text-xs font-semibold uppercase tracking-wider p-4">
                                <span>Player</span>
                                <span>Team</span>
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
                                        className={`border-b border-gray-200 flex items-center justify-between ${isSelected ? 'bg-green-50' : ''}`}
                                    >
                                        <Link
                                            to={`/players/${player.id}`}
                                            className="grid grid-cols-6 items-center p-4 flex-1 hover:bg-gray-50 transition-colors text-sm"
                                        >
                                            <span className="font-medium text-gray-900 truncate pr-2">{player.name}</span>
                                            <span className="text-gray-600 truncate">{cricketTeams[player.team] || '...'}</span>
                                            <span className="text-gray-600 capitalize">{player.role}</span>
                                            <span className="text-gray-600 truncate">{player.batting_style || '—'}</span>
                                            <span className="text-gray-600 truncate">{player.bowling_style || '—'}</span>
                                            <span className="text-blue-600 font-bold">{player.credit_value}</span>
                                        </Link>
                                        {showAddButton && (
                                            <div className="pr-4 shrink-0">
                                                {isSelected ? (
                                                    <span className="inline-block bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded">
                                                        ✓ Added
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddPlayer(player)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1.5 px-3 rounded transition-colors"
                                                    >
                                                        Add to Team
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                    <button
                        disabled={!prevPage}
                        onClick={() => goToPage(prevPage)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        disabled={!nextPage}
                        onClick={() => goToPage(nextPage)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </main>
        </div>
    )
}

export default Players