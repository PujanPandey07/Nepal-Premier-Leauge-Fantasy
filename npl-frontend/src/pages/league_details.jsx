// LeagueDetails.jsx
import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

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
    const [users, setUsers] = useState({})

    const getCurrentUserId = () => {
        const token = localStorage.getItem('access')
        if (!token) return null
        try {
            return JSON.parse(atob(token.split('.')[1])).user_id
        } catch {
            return null
        }
    }

    const fetchAll = () => {
        const currentUserId = getCurrentUserId()

        return Promise.all([
            axiosInstance.get(`/api/leagues/${leagueId}/`),
            axiosInstance.get(`/api/league-members/?league=${leagueId}`)
                .catch(() => ({ data: { results: [] } }))
        ])
            .then(([leagueRes, membersRes]) => {
                const leagueData = leagueRes.data
                setLeague(leagueData)
                setIsCreator(leagueData.invite_code !== undefined)

                const memberList = membersRes.data.results || membersRes.data || []
                setMembers(memberList)
                setIsMember(memberList.some(m => m.user === currentUserId))

                return Promise.all(
                    memberList.map(m =>
                        axiosInstance.get(`/api/users/${m.user}/`)
                            .then(res => ({ id: m.user, name: res.data.name, team_name: res.data.team_name }))
                            .catch(() => ({ id: m.user, name: 'Unknown', team_name: '' }))
                    )
                )
            })
            .then(userDetails => {
                const userMap = {}
                userDetails.forEach(u => { userMap[u.id] = { name: u.name, team_name: u.team_name } })
                setUsers(userMap)
            })
    }

    useEffect(() => {
        fetchAll()
            .catch(error => console.error('Error fetching league details:', error))
            .finally(() => setLoading(false))
    }, [leagueId])

    const handleJoin = async () => {
        setJoining(true)
        setError(null)

        try {
            await axiosInstance.post('/api/leagues/join/', {
                league_id: leagueId,
                ...(league.is_public ? {} : { invite_code: inviteCode })
            })
            setSuccess('Successfully joined the league!')
            setIsMember(true)
            await fetchAll()
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to join league')
        } finally {
            setJoining(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </div>
        )
    }
    if (!league) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">League not found.</p>
            </div>
        )
    }

    const isFull = league.member_count >= league.max_members
    const isOpen = league.status === 'open'
    // Order members by points descending so leaderboard shows highest points first
    const sortedMembers = [...members].sort((a, b) => (b.points || 0) - (a.points || 0))

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />

            {/* Header — dark FPL-style bar, league identity + quick meta */}
            <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-800">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <Link to="/leagues" className="text-purple-200 hover:text-white text-sm">
                        ← Back to leagues
                    </Link>
                    <div className="flex items-end justify-between mt-3 flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-white">{league.name}</h1>
                            <p className="text-purple-200 text-sm mt-1">
                                {league.member_count}/{league.max_members} members ·{' '}
                                <span className={league.is_public ? 'text-green-300' : 'text-amber-300'}>
                                    {league.is_public ? 'Public' : 'Private'}
                                </span>
                                {' · '}
                                {league.status}
                            </p>
                        </div>
                        {league.prize_pool > 0 && (
                            <div className="text-right">
                                <p className="text-purple-200 text-xs uppercase tracking-wide">Prize Pool</p>
                                <p className="text-2xl font-bold text-white">{league.prize_pool}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-6">

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                        {error}
                    </div>
                )}

                {/* Creator invite code */}
                {isCreator && !league.is_public && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-800 font-medium">Your invite code</p>
                            <p className="font-mono text-lg font-bold text-amber-900 tracking-widest">
                                {league.invite_code}
                            </p>
                        </div>
                        <p className="text-xs text-amber-700 max-w-[160px] text-right">
                            Share this with people you want to invite
                        </p>
                    </div>
                )}

                {/* Join action bar — only shown when relevant, not competing with the table */}
                {!isMember && !isCreator && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                        {!isOpen ? (
                            <p className="text-gray-500 text-sm">This league is no longer open for joining</p>
                        ) : isFull ? (
                            <p className="text-red-500 text-sm">This league is full</p>
                        ) : league.is_public ? (
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="bg-purple-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-50"
                            >
                                {joining ? 'Joining...' : 'Join League'}
                            </button>
                        ) : (
                            <div className="flex gap-3 items-center flex-wrap">
                                <input
                                    type="text"
                                    placeholder="Invite code"
                                    value={inviteCode}
                                    onChange={e => setInviteCode(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-2 flex-1 min-w-[160px]"
                                />
                                <button
                                    onClick={handleJoin}
                                    disabled={joining || !inviteCode}
                                    className="bg-purple-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-50"
                                >
                                    {joining ? 'Joining...' : 'Join with Code'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Leaderboard — the centerpiece, FPL-style dense table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                <th className="text-left px-4 py-3 w-12">Rank</th>
                                <th className="text-left px-4 py-3">Manager</th>
                                <th className="text-right px-4 py-3 w-24">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMembers.map((member, index) => {
                                const userObj = users[member.user] || { name: 'Loading...', team_name: '' }
                                const name = userObj.name
                                const teamName = userObj.team_name || ''
                                const initials = (name || teamName).split(' ').map(n => n[0]).join('')
                                const rank = member.ranking || index + 1
                                const isTopThree = rank <= 3

                                return (
                                    <tr
                                        key={member.id}
                                        className="border-t border-gray-100 hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                rank === 1 ? 'bg-yellow-400 text-yellow-900'
                                                : rank === 2 ? 'bg-gray-300 text-gray-700'
                                                : rank === 3 ? 'bg-amber-600 text-amber-50'
                                                : 'text-gray-400'
                                            }`}>
                                                {rank}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-xs font-bold text-purple-800 flex-shrink-0">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <div className={`font-semibold ${isTopThree ? 'text-gray-900' : 'text-gray-800'}`}>
                                                        {teamName || name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{teamName ? name : ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            {member.points}
                                        </td>
                                    </tr>
                                )
                            })}
                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">
                                        No members yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {isMember && (
                    <p className="text-green-600 font-medium text-sm mt-3">✓ You are a member of this league</p>
                )}
                {isCreator && (
                    <p className="text-gray-500 text-sm mt-3">You created this league</p>
                )}
            </div>
        </div>
    )
}

export default LeagueDetails