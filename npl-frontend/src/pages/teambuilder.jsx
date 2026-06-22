import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { TeamContext, ROLE_LIMITS } from '../context/TeamContext'

function TeamBuilder() {
  const { selectedPlayers, removePlayer } = useContext(TeamContext)
const totalCredits = selectedPlayers.reduce((sum, player) => sum + player.credit_value, 0)
  // Object.entries(ROLE_LIMITS) turns { Batsman: 4, Bowler: 4, ... }
  // into an array of [key, value] pairs: [["Batsman", 4], ["Bowler", 4], ...]
  // We need this because .map() only works on arrays, not on objects directly.
  return (
    <div className="min-h-screen bg-green-700 p-8">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">Build Your Team</h1>
      <p className="text-white text-center mb-6">Total Credits: {totalCredits}</p>
      {Object.entries(ROLE_LIMITS).map(([role, limit]) => {
        // role is e.g. "Batsman", limit is e.g. 4 — destructured from the pair above
        const playersInRole = selectedPlayers.filter(p => p.role === role)
        const emptySlots = limit - playersInRole.length

        return (
          <div key={role} className="mb-8">
            <h2 className="text-white text-center font-semibold mb-2">{role}</h2>
            <div className="flex justify-center gap-4 flex-wrap">

              {/* Filled slots: already-selected players for this role */}
              {playersInRole.map(player => (
                <div key={player.id} className="bg-white rounded p-2 text-center w-24">
                  <p className="text-sm font-medium truncate">{player.name}</p>
                  <p className="text-xs text-gray-600">{player.credit_value} Cr</p>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-red-500 text-xs mt-1"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {/* Empty slots: Array.from({length: N}) creates an array of N
                  items (each undefined) just so .map() has something to loop
                  over N times — we don't care about the value, just the count. */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <Link
                  key={i}
                  to={`/build-team/players?role=${role}`}
                  className="bg-white/30 border-2 border-dashed border-white rounded w-24 h-20 flex items-center justify-center text-white text-2xl"
                >
                  +
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TeamBuilder