import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { TeamContext, ROLE_LIMITS } from '../context/TeamContext'
import Navbar from '../components/navbar'

function TeamBuilder() {
  const { selectedPlayers, removePlayer, savedTeamId } = useContext(TeamContext)
  const { captainId, viceCaptainId, setCaptain, setViceCaptain, saveTeam , isDeadlinePassed } = useContext(TeamContext)
  const [teamName, setTeamName] = useState("")

  const totalCredits = selectedPlayers.reduce((sum, player) => sum + player.credit_value, 0)

  const handleRemove = async (playerId) => {
    const result = await removePlayer(playerId)
    if (!result.success) alert(result.error)
  }

  const handleSetCaptain = async (playerId) => {
    const result = await setCaptain(playerId)
    if (!result.success) alert(result.error)
  }

  const handleSetViceCaptain = async (playerId) => {
    const result = await setViceCaptain(playerId)
    if (!result.success) alert(result.error)
  }
 if (isDeadlinePassed) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Navbar />
      <p className="text-xl font-semibold text-gray-700 mt-8">Deadline has passed</p>
      <p className="text-gray-500 mt-2">You can no longer edit your team for this match.</p>
      <Link to="/view-team" className="text-blue-600 underline mt-4">View your saved team</Link>
    </div>
  )
}

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">Players</p>
          <p className="text-lg font-bold">{selectedPlayers.length}/11</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Credits used</p>
          <p className="text-lg font-bold">{totalCredits.toFixed(1)}</p>
        </div>
      </div>

      {/* Pitch background */}
      <div
        className="relative p-8 overflow-hidden w-full min-h-screen"
        style={{
          background: 'repeating-linear-gradient(180deg, #15803d 0px, #15803d 40px, #166534 40px, #166534 80px)'
        }}
      >
        {/* Boundary oval — sits behind everything */}
        <div
          className="absolute border-2 border-white/30 rounded-[50%]"
          style={{
            top: '3%',
            left: '5%',
            width: '90%',
            height: '95%',
          }}
        />

        {/* Pitch strip — the tan rectangle down the middle */}
        <div
          className="absolute bg-yellow-100/20 left-1/2 -translate-x-1/2"
          style={{ top: '8%', height: '40%', width: '60px' }}
        />

        {/* Content layer — sits ON TOP of the oval/strip */}
        <div className="relative z-10">
          {Object.entries(ROLE_LIMITS).map(([role, limit]) => {
            const playersInRole = selectedPlayers.filter(p => p.role === role)
            const emptySlots = limit - playersInRole.length

           

            return (
              <div key={role} className="mb-10">
                <h2 className="text-white text-center text-sm font-semibold tracking-wide uppercase mb-4">
                  {role}
                </h2>
                <div className="flex justify-center gap-16 flex-wrap">

                  {playersInRole.map(player => (
                    <div key={player.id} className="flex flex-col items-center w-24">
                      {/* Avatar circle with C/VC badge */}
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg">
                          {player.name.charAt(0)}
                        </div>
                        {player.id === captainId && (
                          <span className="absolute -top-1 -right-1 bg-white text-yellow-600 border border-yellow-600 rounded-full w-5 h-5 text-[10px] font-bold flex items-center justify-center">
                            C
                          </span>
                        )}
                        {player.id === viceCaptainId && (
                          <span className="absolute -top-1 -right-1 bg-white text-blue-600 border border-blue-600 rounded-full w-5 h-5 text-[10px] font-bold flex items-center justify-center">
                            VC
                          </span>
                        )}
                      </div>

                      {/* Name plate */}
                      <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded mt-1 truncate w-full text-center">
                        {player.name}
                      </div>
                      <p className="text-white text-xs mt-1">{player.credit_value} Cr</p>

                      {/* Action links */}
                      <div className="flex gap-2 mt-1 text-[10px]">
                        <button onClick={() => handleRemove(player.id)} className="text-red-300 underline">
                          Remove
                        </button>
                        <button onClick={() => handleSetCaptain(player.id)} className="text-yellow-300 underline">
                          C
                        </button>
                        <button onClick={() => handleSetViceCaptain(player.id)} className="text-blue-300 underline">
                          VC
                        </button>
                      </div>
                    </div>
                  ))}

                  {Array.from({ length: emptySlots }).map((_, i) => (
                    <Link
                      key={i}
                      to={`/build-team/players?role=${role}`}
                      className="w-14 h-14 rounded-full bg-white/20 border-2 border-dashed border-white flex items-center justify-center text-white text-2xl self-start"
                    >
                      +
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}

          {savedTeamId ? (
            <div className="text-center mt-8">
              <p className="text-white font-semibold">✓ Team saved — changes sync automatically</p>
            </div>
          ) : (
            <div className="text-center mt-8">
              <input
                type="text"
                placeholder="Team name"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="border rounded px-3 py-2 mr-4 bg-white"
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
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamBuilder