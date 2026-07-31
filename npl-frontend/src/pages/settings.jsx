// pages/Settings.jsx
import { useEffect, useState } from 'react'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

export default function Settings() {
    const [user, setUser] = useState(null)
    const [teamName, setTeamName] = useState('')
    const [favoriteTeam, setFavoriteTeam] = useState('')
    const [favoritePlayers, setFavoritePlayers] = useState([])
    const [cricketTeams, setCricketTeams] = useState([])
    const [allPlayers, setAllPlayers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    useEffect(() => {
        Promise.all([
            axiosInstance.get('/api/users/me/'),
            axiosInstance.get('/api/cricket-teams/'),
            axiosInstance.get('/api/players/'),
        ])
            .then(([userRes, teamsRes, playersRes]) => {
                setUser(userRes.data)
                setTeamName(userRes.data.team_name || '')
                setFavoriteTeam(userRes.data.favorite_team || '')
                setFavoritePlayers(userRes.data.favorite_players || [])
                setCricketTeams(teamsRes.data.results || teamsRes.data)
                setAllPlayers(playersRes.data.results || playersRes.data)
            })
            .catch(err => console.error('Error loading profile:', err))
            .finally(() => setLoading(false))
    }, [])

    const togglePlayer = (playerId) => {
        setFavoritePlayers(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId)
            }
            if (prev.length >= 3) {
                setError('You can only pick up to 3 favorite players.')
                return prev
            }
            setError(null)
            return [...prev, playerId]
        })
    }

    const handleSave = async () => {
        const trimmed = teamName.trim()
        if (!trimmed) {
            setError('Team name cannot be empty.')
            return
        }
        setSaving(true)
        setError(null)
        setSuccess(null)
        try {
            const res = await axiosInstance.patch('/api/users/me/', {
                team_name: trimmed,
                favorite_team: favoriteTeam || null,
                favorite_players: favoritePlayers,
            })
            setUser(res.data)
            setSuccess('Settings updated.')
        } catch (err) {
            const data = err.response?.data
            setError(
                data?.team_name?.[0] ||
                data?.favorite_players?.[0] ||
                'Failed to update settings.'
            )
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <p className="p-8 text-gray-400">Loading...</p>
            </div>
        )
    }

    // Players filtered to the favorite team, if one's picked — makes
    // the list manageable instead of scrolling through every player.
    // team ids are UUID strings, so compare directly — no Number() conversion.
    const playerPool = favoriteTeam
        ? allPlayers.filter(p => p.team === favoriteTeam)
        : allPlayers

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left column: account info + team name */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <p className="text-xs text-gray-500 mb-1">Email</p>
                            <p className="text-base text-gray-900 mb-4">{user.email}</p>
                            <p className="text-xs text-gray-500 mb-1">Name</p>
                            <p className="text-base text-gray-900">{user.name}</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-1">
                                Team Name
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                Used across every match and league this season.
                            </p>
                            <input
                                type="text"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                maxLength={100}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-1">
                                Favorite Team
                            </label>
                            <select
                                value={favoriteTeam}
                                onChange={e => {
                                    setFavoriteTeam(e.target.value)
                                    setFavoritePlayers([]) // reset picks if team changes
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">No favorite team</option>
                                {cricketTeams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Right column: favorite players + save */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                            Favorite Players
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Pick up to 3 ({favoritePlayers.length}/3 selected)
                        </p>
                        <div className="max-h-[28rem] overflow-y-auto space-y-1 mb-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {playerPool.map(player => {
                                const selected = favoritePlayers.includes(player.id)
                                return (
                                    <button
                                        key={player.id}
                                        type="button"
                                        onClick={() => togglePlayer(player.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                                            selected
                                                ? 'bg-purple-100 text-purple-900 font-semibold'
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <span>{player.name}</span>
                                        <span className="text-xs text-gray-400">{player.role}</span>
                                    </button>
                                )
                            })}
                            {playerPool.length === 0 && (
                                <p className="text-sm text-gray-400 px-3 py-2 col-span-2">No players found.</p>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                        {success && <p className="text-green-600 text-xs mb-2">{success}</p>}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-50 mt-3"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}