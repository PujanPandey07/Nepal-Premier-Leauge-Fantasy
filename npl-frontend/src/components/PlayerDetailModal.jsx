// components/PlayerDetailModal.jsx
import { useEffect, useState } from 'react'
import axiosInstance from '../utilis/axiosInstance'

export default function PlayerDetailModal({ playerId, onClose }) {
  const [player, setPlayer] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)

  useEffect(() => {
    if (!playerId) return
    setPlayer(null)
    setSeasonStats(null)
    axiosInstance.get(`/api/players/${playerId}/`)
      .then(res => setPlayer(res.data))
      .catch(err => console.error('Error fetching player:', err))

    axiosInstance.get(`/api/players/${playerId}/season-stats/`)
      .then(res => setSeasonStats(res.data))
      .catch(err => console.error('Error fetching season stats:', err))
  }, [playerId])

  if (!playerId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {!player ? (
          <p className="text-center text-gray-400 py-10">Loading...</p>
        ) : (
          <>
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-800 px-6 py-5 flex items-center gap-4 relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-white/70 hover:text-white text-xl leading-none"
              >
                ×
              </button>
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-indigo-900 font-bold text-xl shrink-0">
                {player.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="uppercase text-indigo-200 text-xs font-semibold tracking-wider">{player.role}</p>
                <h2 className="text-xl font-bold text-white leading-tight">{player.name}</h2>
                <p className="text-indigo-200 text-xs mt-1">{player.nationality}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
              <div className="text-center py-3">
                <p className="text-lg font-extrabold text-gray-900">{seasonStats ? seasonStats.matches_played : '–'}</p>
                <p className="text-[10px] text-gray-500 uppercase mt-0.5">Matches</p>
              </div>
              <div className="text-center py-3">
                <p className="text-lg font-extrabold text-gray-900">{seasonStats ? seasonStats.total_runs : '–'}</p>
                <p className="text-[10px] text-gray-500 uppercase mt-0.5">Runs</p>
              </div>
              <div className="text-center py-3">
                <p className="text-lg font-extrabold text-gray-900">{seasonStats ? seasonStats.total_wickets : '–'}</p>
                <p className="text-[10px] text-gray-500 uppercase mt-0.5">Wickets</p>
              </div>
              <div className="text-center py-3">
                <p className="text-lg font-extrabold text-indigo-700">{seasonStats ? seasonStats.total_fantasy_points : '–'}</p>
                <p className="text-[10px] text-gray-500 uppercase mt-0.5">Pts</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Batting Style</p>
                <p className="text-sm font-semibold text-gray-900">{player.batting_style}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Bowling Style</p>
                <p className="text-sm font-semibold text-gray-900">{player.bowling_style}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Credit Value</p>
                <p className="text-sm font-semibold text-blue-600">{player.credit_value}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className={`text-sm font-semibold ${player.is_available ? 'text-green-600' : 'text-red-600'}`}>
                  {player.is_available ? 'Available' : 'Unavailable'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}