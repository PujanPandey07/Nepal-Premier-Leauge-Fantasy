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
            setError(
                err.response?.data?.team_name?.[0] ||
                err.response?.data?.detail ||
                'Failed to save team name. Please try again.'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header Icon & Title */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg shrink-0">
                        🏆
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Name Your Team</h2>
                        <span className="text-[10px] font-bold tracking-wider text-purple-600 uppercase">
                            Fantasy Squad Setup
                        </span>
                    </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-500 mb-4 leading-relaxed">
                    This name will represent you across every match and league this season. You can change it later in Settings.
                </p>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 text-xs text-red-600 font-medium flex items-center gap-2">
                        <span>⚠️</span>
                        <span className="flex-1">{error}</span>
                    </div>
                )}

                {/* Input Container */}
                <div className="mb-4">
                    <input
                        type="text"
                        autoFocus
                        value={teamName}
                        onChange={e => {
                            setTeamName(e.target.value)
                            if (error) setError(null)
                        }}
                        onKeyDown={e => e.key === 'Enter' && !saving && handleSave()}
                        placeholder="e.g. Kathmandu Titans"
                        maxLength={100}
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-xs"
                    />
                    <div className="flex justify-between items-center mt-1.5 px-1">
                        <p className="text-[10px] text-gray-400">Max 100 characters</p>
                        <p className="text-[10px] text-gray-400 font-mono">{teamName.length}/100</p>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || !teamName.trim()}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        'Save Team Name'
                    )}
                </button>
            </div>
        </div>
    )
}