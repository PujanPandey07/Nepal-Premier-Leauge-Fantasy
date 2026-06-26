import { useContext } from 'react'
import { TeamContext, ROLE_LIMITS } from '../context/TeamContext'

function ViewTeam() {

  const { selectedPlayers, captainId, viceCaptainId, setCaptain, setViceCaptain } = useContext(TeamContext)

  const totalPoints = selectedPlayers.reduce((sum, p) => sum + (p.points_earned || 0), 0)

  const handleSetCaptain = async (playerId) => {
    const result = await setCaptain(playerId)
    if (!result.success) alert(result.error)
  }

  const handleSetViceCaptain = async (playerId) => {
    const result = await setViceCaptain(playerId)
    if (!result.success) alert(result.error)
  }

  if (selectedPlayers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No saved team found for this match yet.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        <p className="text-lg font-bold">Your Team</p>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Points</p>
          <p className="text-lg font-bold">{totalPoints}</p>
        </div>
      </div>

      <div
        className="relative p-8 overflow-hidden w-full min-h-screen"
        style={{
          background: 'repeating-linear-gradient(180deg, #15803d 0px, #15803d 40px, #166534 40px, #166534 80px)'
        }}
      >
        <div
          className="absolute border-2 border-white/30 rounded-[50%]"
          style={{ top: '3%', left: '5%', width: '90%', height: '95%' }}
        />
        <div
          className="absolute bg-yellow-100/20 left-1/2 -translate-x-1/2"
          style={{ top: '8%', height: '40%', width: '60px' }}
        />

        <div className="relative z-10">
          {Object.entries(ROLE_LIMITS).map(([role]) => {
            const playersInRole = selectedPlayers.filter(p => p.role === role)

            return (
              <div key={role} className="mb-10">
                <h2 className="text-white text-center text-sm font-semibold tracking-wide uppercase mb-4">
                  {role}
                </h2>
                <div className="flex justify-center gap-16 flex-wrap">
                  {playersInRole.map(player => (
                    <div key={player.id} className="flex flex-col items-center w-24">
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
                      <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded mt-1 truncate w-full text-center">
                        {player.name}
                      </div>
                      <p className="text-white text-xs mt-1">{player.points_earned || 0} pts</p>
                      <div className="flex gap-2 mt-1 text-[10px]">
                        <button onClick={() => handleSetCaptain(player.id)} className="text-yellow-300 underline">C</button>
                        <button onClick={() => handleSetViceCaptain(player.id)} className="text-blue-300 underline">VC</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="text-center mt-8">
            <button
              onClick={() => alert('Team confirmed! Good luck.')}
              className="bg-green-600 text-white px-6 py-2 rounded font-semibold"
            >
              Confirm Team
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewTeam