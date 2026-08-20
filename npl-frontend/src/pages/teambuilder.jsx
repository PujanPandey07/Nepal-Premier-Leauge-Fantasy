import { useState, useContext, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TeamContext, ROLE_LIMITS, getFantasyRole } from "../context/teamcontext.jsx";
import Navbar from '../components/navbar'
import PlayerDrawer from '../components/PlayerDrawer'
import PlayerDetailModal from '../components/PlayerDetailModal'

function TeamBuilder() {
  const { matchId } = useParams()
  const {
    selectedPlayers, removePlayer, savedTeamId, loadMatch,
    captainId, viceCaptainId, setCaptain, setViceCaptain, saveTeam,
    isDeadlinePassed, match
  } = useContext(TeamContext)
  const [openRole, setOpenRole] = useState(null)
  const [detailPlayer, setDetailPlayer] = useState(null)

  useEffect(() => {
    if (matchId) {
      loadMatch(matchId)
    }
  }, [matchId])

  const totalCredits = selectedPlayers.reduce(
    (sum, player) => sum + (Number(player.credit_value) || 0),
    0
  )

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

  const handleSaveTeam = async () => {
    const result = await saveTeam()
    if (result.success) {
      alert('Team saved!')
    } else {
      alert(result.error)
    }
  }

  if (isDeadlinePassed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <Navbar />
        <p className="text-lg sm:text-xl font-semibold text-gray-700 mt-8">Deadline has passed</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">You can no longer edit your team for this match.</p>
        <Link to="/view-team" className="text-xs sm:text-sm text-blue-600 underline mt-4 hover:text-blue-800 transition-colors">
          View your saved team
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <Navbar />

      {/* MATCH INFO BANNER */}
      {match && (
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700">
          <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">
            Building team for
          </p>
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
            <div>
              <h2 className="text-base sm:text-xl font-bold truncate">
                {match.home_team_name || 'Home'} vs {match.away_team_name || 'Away'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {match.venue} • {new Date(match.match_date).toLocaleString()}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] sm:text-xs text-slate-400">Match starts at</p>
              <p className="text-xs sm:text-sm font-semibold text-yellow-400">
                {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STATS STRIP */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center border-b border-slate-800">
        <div>
          <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider">Players</p>
          <p className="text-base sm:text-lg font-bold text-emerald-400">{selectedPlayers.length}/11</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider">Credits used</p>
          <p className="text-base sm:text-lg font-bold text-amber-300">{totalCredits.toFixed(1)}</p>
        </div>
      </div>

      {/* PITCH AREA */}
      <div
        className="relative p-3 sm:p-6 md:p-8 overflow-hidden w-full min-h-screen"
        style={{
          background: 'repeating-linear-gradient(180deg, #15803d 0px, #15803d 40px, #166534 40px, #166534 80px)'
        }}
      >
        {/* Pitch Boundary Lines */}
        <div
          className="pointer-events-none absolute border sm:border-2 border-white/30 rounded-[50%]"
          style={{ top: '2%', left: '2%', width: '96%', height: '96%' }}
        />
        <div
          className="pointer-events-none absolute bg-yellow-100/20 left-1/2 -translate-x-1/2"
          style={{ top: '8%', height: '40%', width: '48px' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto">
          {Object.entries(ROLE_LIMITS).map(([role, limit]) => {
            const playersInRole = selectedPlayers.filter(
              p => getFantasyRole(p.role) === role
            )
            const emptySlots = limit - playersInRole.length

            return (
              <div key={role} className="mb-6 sm:mb-10">
                <h2 className="text-white text-center text-xs sm:text-sm font-bold tracking-widest uppercase mb-3 sm:mb-4 bg-slate-950/60 backdrop-blur-sm w-max mx-auto px-3 py-1 rounded-full border border-white/10 shadow-sm">
                  {role}
                </h2>

                <div className="flex justify-center gap-2 sm:gap-6 md:gap-10 flex-wrap">
                  {playersInRole.map(player => (
                    <div key={player.id} className="flex flex-col items-center w-[72px] sm:w-24 md:w-28 transition-transform hover:scale-105">
                      <div className="relative">
                        <button
                          onClick={() => setDetailPlayer(player)}
                          className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-900 border sm:border-2 border-white/30 flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-lg hover:border-emerald-400 transition-colors"
                        >
                          {player.name ? player.name.charAt(0) : '?'}
                        </button>
                        {String(player.id) === String(captainId) && (
                          <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 border border-slate-950 rounded-full w-4 h-4 sm:w-5 sm:h-5 text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-md">
                            C
                          </span>
                        )}
                        {String(player.id) === String(viceCaptainId) && (
                          <span className="absolute -top-1 -right-1 bg-sky-400 text-slate-950 border border-slate-950 rounded-full w-4 h-4 sm:w-5 sm:h-5 text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-md">
                            VC
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-950/90 text-white text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded mt-1 truncate w-full text-center border border-white/10 shadow-md">
                        {player.name}
                      </div>

                      <p className="text-amber-300 text-[10px] sm:text-xs font-bold mt-0.5">{player.credit_value} Cr</p>

                      <div className="flex gap-1.5 sm:gap-2 mt-1 text-[9px] sm:text-[10px] font-bold">
                        <button onClick={() => handleRemove(player.id)} className="text-red-300 hover:text-red-100 underline">Remove</button>
                        <button onClick={() => handleSetCaptain(player.id)} className="text-amber-300 hover:text-amber-100 underline">C</button>
                        <button onClick={() => handleSetViceCaptain(player.id)} className="text-sky-300 hover:text-sky-100 underline">VC</button>
                      </div>
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, emptySlots) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setOpenRole(role)}
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/20 border-2 border-dashed border-white/60 flex items-center justify-center text-white text-xl sm:text-2xl hover:bg-white/30 transition-colors self-start shadow-sm"
                    >
                      +
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {savedTeamId ? (
            <div className="text-center mt-6 sm:mt-8 pb-8">
              {/* 🔒 ADD THIS: Conditionally show success or warning based on count */}
              {selectedPlayers.length === 11 ? (
                <p className="text-emerald-300 text-xs sm:text-sm font-semibold bg-slate-900/80 px-4 py-2 rounded-xl inline-block border border-emerald-500/30 backdrop-blur-sm shadow-md">
                  ✓ Team Complete & Saved 
                </p>
              ) : (
                <p className="text-red-400 text-xs sm:text-sm font-semibold bg-slate-900/80 px-4 py-2 rounded-xl inline-block border border-red-500/30 backdrop-blur-sm shadow-md">
                  Your team is incomplete ({selectedPlayers.length}/11). It MUST have 11 players before the deadline to score points.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center mt-6 sm:mt-8 pb-8">
              <button
                disabled={selectedPlayers.length < 11}
                onClick={handleSaveTeam}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                Save Team
              </button>
            </div>
          )}
        </div>
      </div>

      {openRole && (
        <PlayerDrawer
          role={openRole}
          onClose={() => setOpenRole(null)}
          onSelectPlayer={(player) => setDetailPlayer(player)}
        />
      )}

      {detailPlayer && (
        <PlayerDetailModal
          player={detailPlayer}
          match={match}
          onClose={() => setDetailPlayer(null)}
        />
      )}
    </div>
  )
}

export default TeamBuilder