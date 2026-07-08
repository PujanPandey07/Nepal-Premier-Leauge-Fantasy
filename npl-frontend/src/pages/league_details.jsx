// LeagueDetails.jsx
import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from '../components/navbar'
import  axiosInstance  from '../utilis/axiosInstance'

function LeagueDetails() {
    const { leagueId } = useParams()
    const [league, setLeague] = useState(null)
    const [members, setMembers] = useState([])
    const [isMember, setIsMember] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [inviteCode, setInviteCode] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [users, setUsers] = useState({})  // maps user id -> user name

    useEffect(() => {
        const token = localStorage.getItem('refreshtoken')
        if (!token) return
        const headers = { Authorization: `Bearer ${token}` }
        const currentUserId = JSON.parse(atob(token.split('.')[1])).user_id

        Promise.all([
            axiosInstance.get(`/api/leagues/${leagueId}/`, { headers }),
            axiosInstance.get(`/api/league-members/?league=${leagueId}`, { headers })
                .catch(() => ({ data: { results: [] } }))
        ])
            .then(([leagueRes, membersRes]) => {
                const leagueData = leagueRes.data
                setLeague(leagueData)

                if (leagueData.invite_code !== undefined) {
                    setIsCreator(true)
                }

                const memberList = membersRes.data.results || membersRes.data || []
                setMembers(memberList)

                const alreadyMember = memberList.some(m => m.user === currentUserId)
                setIsMember(alreadyMember)

                // Fetch user details for each member to get their names
                // UserPublicSerializer exposes id, name, profile_picture
                return Promise.all(
                    memberList.map(m =>
                        axiosInstance.get(`/api/users/${m.user}/`, { headers })
                            .then(res => ({ id: m.user, name: res.data.name }))
                            .catch(() => ({ id: m.user, name: 'Unknown' }))
                    )
                )
            })
            .then(userDetails => {
                const userMap = {}
                userDetails.forEach(u => { userMap[u.id] = u.name })
                setUsers(userMap)
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
            await axiosInstance.post(
                '/api/leagues/join/',
                {
                    league_id: leagueId,
                    ...(league.is_public ? {} : { invite_code: inviteCode })
                },
                { headers }
            )
            setSuccess('Successfully joined the league!')
            setIsMember(true)

            // Refresh both league data and members list
            const [leagueRes, membersRes] = await Promise.all([
                axiosInstance.get(`/api/leagues/${leagueId}/`, { headers }),
                axiosInstance.get(`/api/league-members/?league=${leagueId}`, { headers })
            ])
            setLeague(leagueRes.data)
            setMembers(membersRes.data.results || membersRes.data || [])
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

    // Sort members by ranking
    const sortedMembers = [...members].sort((a, b) => a.ranking - b.ranking)

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <Navbar />
            <div className="max-w-3xl mx-auto">

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Left — stats + join */}
                    <div className="md:col-span-2 space-y-4">

                        {/* Stats */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
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

                        {/* Creator: invite code */}
                        {isCreator && !league.is_public && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
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
                            {success && <p className="text-green-600 font-medium mb-3">{success}</p>}
                            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                            {isMember ? (
                                <p className="text-green-600 font-semibold">✓ You are a member of this league</p>
                            ) : isCreator ? (
                                <p className="text-gray-500 text-sm">You created this league</p>
                            ) : !isOpen ? (
                                <p className="text-gray-500 text-sm">This league is no longer open for joining</p>
                            ) : isFull ? (
                                <p className="text-red-500 text-sm">This league is full</p>
                            ) : league.is_public ? (
                                <button
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                                >
                                    {joining ? 'Joining...' : 'Join League'}
                                </button>
                            ) : (
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

                    {/* Right — members leaderboard */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <p className="font-semibold mb-3">
                            Leaderboard
                            <span className="text-xs text-gray-400 font-normal ml-2">
                                {members.length} member{members.length !== 1 ? 's' : ''}
                            </span>
                        </p>
                        <div className="space-y-1">
                            {sortedMembers.map((member, index) => {
                                const name = users[member.user] || 'Loading...'
                                const initials = name.split(' ').map(n => n[0]).join('')
                                const isFirst = index === 0 && member.points > 0
                                return (
                                    <div
                                        key={member.id}
                                        className={`flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 ${
                                            isFirst ? 'bg-yellow-50 rounded-lg px-2' : ''
                                        }`}
                                    >
                                        {/* Rank number */}
                                        <span className={`text-xs font-bold w-4 text-center ${
                                            isFirst ? 'text-yellow-600' : 'text-gray-400'
                                        }`}>
                                            {member.ranking || index + 1}
                                        </span>
                                        {/* Avatar */}
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                            {initials}
                                        </div>
                                        {/* Name + points */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{name}</p>
                                            <p className="text-xs text-gray-400">{member.points} pts</p>
                                        </div>
                                        {isFirst && (
                                            <span className="text-yellow-500 text-sm">🏆</span>
                                        )}
                                    </div>
                                )
                            })}
                            {members.length === 0 && (
                                <p className="text-sm text-gray-400">No members yet</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default LeagueDetails