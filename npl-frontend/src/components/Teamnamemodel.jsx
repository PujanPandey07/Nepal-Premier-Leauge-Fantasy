// components/TeamNameModal.jsx
import { useState } from 'react'
import axiosInstance from '../utilis/axiosInstance'

export default function TeamNameModal({ onSaved }) {
    const [teamName, setTeamName] = useState('')
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        const trimmed = teamName.trim()
        if (!trimmed) {
            setError('Please enter a team name.')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const res = await axiosInstance.patch('/api/users/me/', {
                team_name: trimmed
            })
            onSaved(res.data.team_name)
        } catch (err) {
            setError(err.response?.data?.team_name?.[0] || 'Failed to save team name.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Name your team</h2>
                <p className="text-sm text-gray-500 mb-4">
                    This name will represent you across every match and league this season.
                    You can change it later in Settings.
                </p>

                <input
                    type="text"
                    autoFocus
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="e.g. Kathmandu Titans"
                    maxLength={100}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-50 mt-2"
                >
                    {saving ? 'Saving...' : 'Save Team Name'}
                </button>
            </div>
        </div>
    )
}