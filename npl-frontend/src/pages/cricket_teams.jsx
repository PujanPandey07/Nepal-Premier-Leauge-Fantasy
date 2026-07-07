// CricketTeams.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'

function CricketTeams() {
    const [teams, setTeams] = useState([])
    const [nextPage, setNextPage] = useState(null)
    const [prevPage, setPrevPage] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get('http://localhost:8000/api/cricket-teams/')
            .then(res => {
                setTeams(res.data.results || res.data)
                setNextPage(res.data.next)
                setPrevPage(res.data.previous)
            })
            .catch(error => console.error('Error fetching teams:', error))
            .finally(() => setLoading(false))
    }, [])

    const goToPage = (url) => {
        if (!url) return
        axios.get(url)
            .then(res => {
                setTeams(res.data.results || res.data)
                setNextPage(res.data.next)
                setPrevPage(res.data.previous)
            })
            .catch(error => console.error('Error fetching teams:', error))
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <p className="p-8">Loading...</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <Navbar />
            <h1 className="text-2xl font-bold mb-6">NPL Cricket Teams</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.length === 0 ? (
                    <p className="text-gray-500">No teams found.</p>
                ) : (
                    teams.map(team => (
                        <Link
                            key={team.id}
                            to={`/cricket-teams/${team.id}`}
                            className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                        >
                            {/* Team initials avatar */}
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {team.short_name}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{team.name}</p>
                                    <p className="text-sm text-gray-500">{team.short_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>🏟</span>
                                <span>{team.home_venue}</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            <div className="flex justify-between mt-6">
                <button
                    disabled={!prevPage}
                    onClick={() => goToPage(prevPage)}
                    className="disabled:opacity-30"
                >
                    Previous
                </button>
                <button
                    disabled={!nextPage}
                    onClick={() => goToPage(nextPage)}
                    className="disabled:opacity-30"
                >
                    Next
                </button>
            </div>
        </div>
    )
}

export default CricketTeams