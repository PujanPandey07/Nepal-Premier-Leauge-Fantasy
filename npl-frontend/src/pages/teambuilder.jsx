import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { TeamContext, ROLE_LIMITS } from '../context/TeamContext'

function TeamBuilder() {
  const { selectedPlayers, removePlayer } = useContext(TeamContext)
  const { captainId, viceCaptainId, setCaptain, setViceCaptain, saveTeam } = useContext(TeamContext)
  const [teamName, setTeamName] = useState("")

  const totalCredits = selectedPlayers.reduce((sum, player) => sum + player.credit_value, 0)

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
                  <p className="text-xs text-gray-600">
                    {player.credit_value} Cr
                    {player.id === captainId && <span className="font-bold text-yellow-600"> (C)</span>}
                    {player.id === viceCaptainId && <span className="font-bold text-blue-600"> (VC)</span>}
                  </p>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-red-500 text-xs mt-1"
                  >
                    Remove
                  </button>
                  <button onClick={() => setCaptain(player.id)} className="text-yellow-600 text-xs mt-1 block">
                    Set Captain
                  </button>
                  <button onClick={() => setViceCaptain(player.id)} className="text-blue-600 text-xs mt-1 block">
                    Set Vice-Captain
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

      <div className="text-center mt-8">
        <input
          type="text"
          placeholder="Team name"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
          className="border rounded px-3 py-2 mr-4"
        />
        <button
          disabled={selectedPlayers.length < 11}
          onClick={async () => {
            const result = await saveTeam(teamName)
            if (result.success) {
              alert('Team saved!')
            } else {
              alert(result.error)
            }
          }}
          className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Save Team
        </button>
      </div>
    </div>
  )
}

export default TeamBuilder