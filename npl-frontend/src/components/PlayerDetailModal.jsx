// PlayerDetailModal.jsx
export default function PlayerDetailModal({ player, onClose, match }) {
  if (!player) return null

  // Safely extract team name
  let teamName = player.team_name || player.team?.name
  if (!teamName && match) {
    const pTeamId = typeof player.team === 'object' ? String(player.team?.id) : String(player.team)
    const homeId = typeof match.home_team === 'object' ? String(match.home_team?.id) : String(match.home_team)
    const awayId = typeof match.away_team === 'object' ? String(match.away_team?.id) : String(match.away_team)

    if (pTeamId === homeId) teamName = match.home_team_name
    else if (pTeamId === awayId) teamName = match.away_team_name
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
              Player Details
            </span>
            <h3 className="text-lg font-bold">{player.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-100">
            <div>
              <p className="text-[10px] uppercase text-purple-600 font-bold">Franchise / Team</p>
              <p className="text-sm font-extrabold text-purple-950">{teamName || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-purple-600 font-bold">Credit Value</p>
              <p className="text-sm font-extrabold text-purple-950">{player.credit_value} Cr</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-400 block font-medium">Role</span>
              <span className="font-bold text-gray-800">{player.role}</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-gray-400 block font-medium">Status</span>
              <span className="font-bold text-emerald-600">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}