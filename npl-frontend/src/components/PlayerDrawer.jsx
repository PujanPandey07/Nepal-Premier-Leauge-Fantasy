// components/PlayerDrawer.jsx
import { useEffect, useState, useContext } from 'react'
import { TeamContext } from '../context/teamcontext'
import axiosInstance from '../utilis/axiosInstance'

export default function PlayerDrawer({ role, onClose, onSelectPlayer }) {
  const { match, selectedPlayers, addPlayer } = useContext(TeamContext)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!match) return
    setLoading(true)
    const params = new URLSearchParams()
    params.append('role', role)
    params.append('teams', `${match.home_team},${match.away_team}`)
    if (searchTerm) params.append('search', searchTerm)

    axiosInstance.get(`/api/players/?${params.toString()}`)
      .then(res => {
        const list = res.data.results || res.data
        setPlayers(list.map(p => ({ ...p, credit_value: Number(p.credit_value) })))
      })
      .catch(err => console.error('Error fetching players for drawer:', err))
      .finally(() => setLoading(false))
  }, [role, match, searchTerm])

  const handleAdd = async (player) => {
    const result = await addPlayer(player)
    if (!result.success) alert(result.error)
  }

  return (
    <div className="fixed inset-0 z-40">
      {/* Overlay covers the full screen; click anywhere on it to close */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel explicitly pinned to the right edge, independent of flex order */}
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Select {role}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-400 text-sm mt-6">Loading...</p>
          ) : players.length === 0 ? (
            <p className="text-center text-gray-400 text-sm mt-6">No players found.</p>
          ) : (
            players.map(player => {
              const isSelected = selectedPlayers.some(p => p.id === player.id)
              return (
                <div key={player.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                  <button onClick={() => onSelectPlayer(player.id)} className="text-left flex-1">
                    <p className="text-sm font-semibold text-gray-900">{player.name}</p>
                    <p className="text-xs text-gray-500">{player.credit_value} Cr · {player.nationality}</p>
                  </button>
                  {isSelected ? (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-1 rounded-full">
                      ✓ Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(player)}
                      className="bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-800"
                    >
                      Add
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}