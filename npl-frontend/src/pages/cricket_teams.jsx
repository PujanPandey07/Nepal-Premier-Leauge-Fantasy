import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

function CricketTeams() {
    const [teams, setTeams] = useState([])
    const [nextPage, setNextPage] = useState(null)
    const [prevPage, setPrevPage] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axiosInstance.get('/api/cricket-teams/')
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
        axiosInstance.get(url)
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
            <div className="flex h-[60vh] items-center justify-center p-4">
                <div className="flex items-center gap-3 text-slate-500 font-medium text-xs sm:text-sm">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    Loading NPL teams...
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">NPL Cricket Teams</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Explore franchises and squads participating in the league</p>
                    </div>
                </div>

                {teams.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
                        <p className="text-gray-500 text-xs sm:text-sm">No teams found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                        {teams.map(team => (
                            <Link
                                key={team.id}
                                to={`/cricket-teams/${team.id}`}
                                className="group block bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                            >
                                {/* Team initials avatar and title */}
                                <div className="flex items-center gap-3.5 mb-4">
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0 group-hover:bg-purple-600 transition-colors shadow-sm">
                                        {team.short_name}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                                            {team.name}
                                        </p>
                                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 font-semibold text-[10px] sm:text-xs rounded-md mt-0.5">
                                            {team.short_name}
                                        </span>
                                    </div>
                                </div>

                                {/* Venue Details */}
                                <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                                    <span className="text-base leading-none">🏟</span>
                                    <span className="truncate">{team.home_venue || 'N/A'}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6 sm:mt-8 gap-2">
                    <button
                        disabled={!prevPage}
                        onClick={() => goToPage(prevPage)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                    >
                        ← Previous
                    </button>
                    <button
                        disabled={!nextPage}
                        onClick={() => goToPage(nextPage)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all"
                    >
                        Next →
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CricketTeams