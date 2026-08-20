import { useParams, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'
import { useAuth } from '../context/AuthContext'

function LeagueDetails() {
    const { leagueId } = useParams()
    const { userId } = useAuth()

    const [league, setLeague] = useState(null)
    const [members, setMembers] = useState([])
    const [isMember, setIsMember] = useState(false)
    const [isCreator, setIsCreator] = useState(false)
    const [inviteCode, setInviteCode] = useState('')
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)

    const fetchAll = useCallback(async () => {
        try {
            const [leagueRes, membersRes] = await Promise.all([
                axiosInstance.get(`/api/leagues/${leagueId}/`),
                axiosInstance.get(`/api/league-members/?league=${leagueId}`).catch(() => ({ data: { results: [] } }))
            ])

            const leagueData = leagueRes.data
            setLeague(leagueData)

            const memberList = membersRes.data.results || membersRes.data || []
            setMembers(memberList)

            if (userId) {
                setIsCreator(leagueData.created_by === userId)
                setIsMember(memberList.some(m => m.user === userId))
            }
        } catch (err) {
            console.error('Error fetching league details:', err)
            setError('Failed to load league details.')
        }
    }, [leagueId, userId])

    useEffect(() => {
        setLoading(true)
        fetchAll().finally(() => setLoading(false))
    }, [fetchAll])

    const handleJoin = async () => {
        setJoining(true)
        setError(null)
        setSuccess(null)

        try {
            await axiosInstance.post('/api/leagues/join/', {
                league_id: leagueId,
                ...(league?.is_public ? {} : { invite_code: inviteCode })
            })
            setSuccess('Successfully joined the league!')
            setIsMember(true)
            await fetchAll()
        } catch (err) {
            setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to join league')
        } finally {
            setJoining(false)
        }
    }

    const handleCopyCode = () => {
        if (league?.invite_code) {
            navigator.clipboard.writeText(league.invite_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const getInitials = (str) => {
        if (!str) return '?'
        return str
            .trim()
            .split(/\s+/)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400 font-medium animate-pulse">Loading league details...</p>
            </div>
        )
    }

    if (!league) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                    <p className="text-gray-500 text-lg">League not found.</p>
                    <Link to="/leagues" className="text-purple-600 hover:underline mt-4 inline-block text-sm">
                        ← Back to Leagues
                    </Link>
                </div>
            </div>
        )
    }

    const isFull = league.member_count >= league.max_members
    const isOpen = league.status === 'open'
    const sortedMembers = [...members].sort((a, b) => {
        if (a.ranking && b.ranking) return a.ranking - b.ranking
        return (b.points || 0) - (a.points || 0)
    })

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />

            <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-800">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <Link to="/leagues" className="text-purple-200 hover:text-white text-sm transition-colors">
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
                                <span className="capitalize">{league.status}</span>
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

                {isCreator && !league.is_public && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <p className="text-xs text-amber-800 font-medium uppercase tracking-wider">Your invite code</p>
                            <p className="font-mono text-xl font-bold text-amber-900 tracking-widest mt-0.5">
                                {league.invite_code}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCopyCode}
                                className="bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                            >
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                            <p className="text-xs text-amber-700 max-w-[160px] text-right hidden sm:block">
                                Share this with people you want to invite
                            </p>
                        </div>
                    </div>
                )}

                {!isMember && !isCreator && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
                        {!isOpen ? (
                            <p className="text-gray-500 text-sm">This league is no longer open for joining.</p>
                        ) : isFull ? (
                            <p className="text-red-500 text-sm">This league is full.</p>
                        ) : league.is_public ? (
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="bg-purple-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-50 transition-colors"
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
                                    className="border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                    onClick={handleJoin}
                                    disabled={joining || !inviteCode.trim()}
                                    className="bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-purple-800 disabled:opacity-50 transition-colors"
                                >
                                    {joining ? 'Joining...' : 'Join with Code'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
                                <th className="text-left px-4 py-3 w-12">Rank</th>
                                <th className="text-left px-4 py-3">Manager</th>
                                <th className="text-right px-4 py-3 w-24">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMembers.map((member, index) => {
                                const name = member.user_name || 'Unknown'
                                const teamName = member.team_name || ''
                                const displayName = teamName || name
                                const rank = member.ranking || index + 1
                                const isTopThree = rank <= 3

                                return (
                                    <tr
                                        key={member.id || index}
                                        className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
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
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-800 flex-shrink-0">
                                                    {getInitials(displayName)}
                                                </div>
                                                <div>
                                                    <div className={`font-semibold ${isTopThree ? 'text-gray-900' : 'text-gray-800'}`}>
                                                        {displayName}
                                                    </div>
                                                    {teamName && <div className="text-xs text-gray-500">{name}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            {member.points ?? 0}
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

                <div className="mt-4 space-y-1">
                    {isMember && (
                        <p className="text-green-600 font-medium text-sm">✓ You are a member of this league</p>
                    )}
                    {isCreator && (
                        <p className="text-gray-500 text-sm">You created this league</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LeagueDetails