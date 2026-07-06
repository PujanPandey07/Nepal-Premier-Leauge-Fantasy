// LeagueDetails.jsx
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from '../components/navbar'

function LeagueDetails() {
    const { leagueId } = useParams()
    const navigate = useNavigate()
    const [league, setLeague] = useState(null)
    const [isMember, setIsMember] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [inviteCode, setInviteCode] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return
        const headers = { Authorization: `Bearer ${token}` }

        Promise.all([
            axios.get(`http://localhost:8000/api/leagues/${leagueId}/`, { headers }),
            // Check if user is already a member by fetching their league memberships
            axios.get(`http://localhost:8000/api/league-members/?league=${leagueId}`, { headers })
                .catch(() => ({ data: { results: [] } }))
        ])
            .then(([leagueRes, membersRes]) => {
                const leagueData = leagueRes.data
                setLeague(leagueData)

                // If invite_code is present in response, this user is the creator
                if (leagueData.invite_code !== undefined) {
                    setIsCreator(true)
                }

                // Check if current user is in the members list
                const members = membersRes.data.results || membersRes.data || []
                // We need current user's id to check membership
                const currentUserId = JSON.parse(atob(token.split('.')[1])).user_id
                const alreadyMember = members.some(m => m.user === currentUserId)
                setIsMember(alreadyMember)
            })
            .catch(error => console.error('Error fetching league details:', error))
            .finally(() => setLoading(false))
    }, [leagueId])

    const handleJoin = async () => {
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }
        setJoining(true)
        setError(null)

        try {
            await axios.post(
                'http://localhost:8000/api/leagues/join/',
                {
                    league_id: leagueId,
                    // Only send invite_code for private leagues
                    ...(league.is_public ? {} : { invite_code: inviteCode })
                },
                { headers }
            )
            setSuccess('Successfully joined the league!')
            setIsMember(true)
            // Refresh league data to update member_count
            const leagueRes = await axios.get(
                `http://localhost:8000/api/leagues/${leagueId}/`, { headers }
            )
            setLeague(leagueRes.data)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to join league')
        } finally {
            setJoining(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    if (!league) return <div className="min-h-screen flex items-center justify-center">League not found.</div>

    const initials = league.name.split(' ').map(n => n[0]).join('')
    const isFull = league.member_count >= league.max_members
    const isOpen = league.status === 'open'

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Navbar />
            <div className="max-w-xl mx-auto">

                <Link to="/leagues" className="text-blue-600 hover:underline text-sm">
                    ← Back to leagues
                </Link>

                {/* Banner */}
                <div className="bg-blue-600 rounded-xl p-6 flex items-center gap-4 mt-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 font-semibold text-2xl">
                        {initials}
                    </div>
                    <div>
                        <p className="text-2xl font-semibold text-white">{league.name}</p>
                        <p className="text-blue-200 text-sm mt-1">
                            {league.member_count}/{league.max_members} members
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <p className="text-base font-semibold">{league.status}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Entry Fee</p>
                            <p className="text-base font-semibold">{league.entry_fee}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Prize Pool</p>
                            <p className="text-base font-semibold">{league.prize_pool}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">Type</p>
                            <p className={`text-base font-semibold ${league.is_public ? 'text-green-600' : 'text-red-600'}`}>
                                {league.is_public ? 'Public' : 'Private'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Creator: show invite code */}
                {isCreator && !league.is_public && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                        <p className="text-sm text-yellow-800 font-medium mb-1">Your invite code</p>
                        <p className="font-mono text-lg font-bold text-yellow-900 tracking-widest">
                            {league.invite_code}
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                            Share this with people you want to invite
                        </p>
                    </div>
                )}

                {/* Join section */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    {success && (
                        <p className="text-green-600 font-medium mb-3">{success}</p>
                    )}
                    {error && (
                        <p className="text-red-500 text-sm mb-3">{error}</p>
                    )}

                    {isMember ? (
                        <p className="text-green-600 font-semibold">✓ You are a member of this league</p>
                    ) : isCreator ? (
                        <p className="text-gray-500 text-sm">You created this league</p>
                    ) : !isOpen ? (
                        <p className="text-gray-500 text-sm">This league is no longer open for joining</p>
                    ) : isFull ? (
                        <p className="text-red-500 text-sm">This league is full</p>
                    ) : league.is_public ? (
                        // Public league — one click join
                        <button
                            onClick={handleJoin}
                            disabled={joining}
                            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                            {joining ? 'Joining...' : 'Join League'}
                        </button>
                    ) : (
                        // Private league — invite code input
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Enter invite code to join</p>
                            <input
                                type="text"
                                placeholder="Invite code"
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full mb-3"
                            />
                            <button
                                onClick={handleJoin}
                                disabled={joining || !inviteCode}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                                {joining ? 'Joining...' : 'Join with Code'}
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default LeagueDetails