import { createContext, useContext, useState, useEffect } from 'react'
import axiosInstance from '../utilis/axiosInstance'

export const TeamContext = createContext()

export const ROLE_LIMITS = {
  'Wicket-Keeper': 1,
  'Batsman': 3,
  'Bowler': 3,
  'All-Rounder': 4,
}

// Named export to prevent Vite build errors when other pages import role normalizer
export const getFantasyRole = (role) => {
  if (!role) return 'Batsman'
  const r = String(role).toLowerCase().trim()
  if (r.includes('wicket') || r.includes('wk') || r.includes('keeper')) return 'Wicket-Keeper'
  if (r.includes('all') || r.includes('round')) return 'All-Rounder'
  if (r.includes('bat')) return 'Batsman'
  if (r.includes('bowl') || r.includes('bwl')) return 'Bowler'
  return role
}

export function TeamProvider({ children }) {
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [tournament, setTournament] = useState(null)
  const [match, setMatch] = useState(null)
  const [captainId, setCaptainId] = useState(null)
  const [viceCaptainId, setViceCaptainId] = useState(null)
  const [savedTeamId, setSavedTeamId] = useState(null)
  
  // Note: teamPlayerRowIds is no longer needed since we aren't editing rows one by one.

  const isDeadlinePassed = match
    ? new Date() > new Date(new Date(match.match_date).getTime() - 30 * 60 * 1000)
    : false

  useEffect(() => {
    axiosInstance.get('/api/tournaments/')
      .then(res => setTournament(res.data.results ? res.data.results[0] : res.data[0]))
      .catch(error => console.error('Error fetching tournaments:', error))
  }, [])

  const loadMatch = (matchId) => {
    if (!matchId) return
    if (match && String(match.id) === String(matchId)) return
    axiosInstance.get(`/api/matches/${matchId}/`)
      .then(res => setMatch(res.data))
      .catch(error => console.error('Error fetching match:', error))
  }

  // Load Existing Team when match loads
  useEffect(() => {
    if (!match) return

    setSelectedPlayers([])
    setCaptainId(null)
    setViceCaptainId(null)
    setSavedTeamId(null)

    axiosInstance.get('/api/fantasy-teams/')
      .then(res => {
        const teams = res.data.results || res.data
        const existing = teams.find(t => String(t.match?.id || t.match) === String(match.id))
        if (!existing) return

        setSavedTeamId(existing.id)

        return axiosInstance.get('/api/fantasy-team-players/')
          .then(res2 => {
            const allRows = res2.data.results || res2.data
            const rows = allRows.filter(r => String(r.fantasy_team?.id || r.fantasy_team) === String(existing.id))

            return Promise.all(
              rows.map(row =>
                axiosInstance.get(`/api/players/${row.player}/`)
                  .then(pRes => ({
                    ...pRes.data,
                    credit_value: Number(pRes.data.credit_value) || 0,
                    _isCaptain: row.is_captain,
                    _isViceCaptain: row.is_vice_captain,
                    points_earned: row.points_earned,
                  }))
              )
            )
          })
          .then(players => {
            if (!players) return
            setSelectedPlayers(players)
            const existingCaptain = players.find(p => p._isCaptain)
            const existingViceCaptain = players.find(p => p._isViceCaptain)
            if (existingCaptain) setCaptainId(existingCaptain.id)
            if (existingViceCaptain) setViceCaptainId(existingViceCaptain.id)
          })
      })
      .catch(error => console.error('Error loading existing team:', error))
  }, [match])

  const addPlayer = async (player) => {
    if (!tournament || !tournament.budget_cap) {
      return { success: false, error: 'Tournament data not loaded yet' }
    }
    if (selectedPlayers.some(p => String(p.id) === String(player.id))) {
      return { success: false, error: 'Player already in team' }
    }

    const playerRole = getFantasyRole(player.role)
    const roleLimit = ROLE_LIMITS[playerRole] || 11
    if (selectedPlayers.filter(p => getFantasyRole(p.role) === playerRole).length >= roleLimit) {
      return { success: false, error: `Maximum limit reached for role: ${playerRole}` }
    }

    const totalCredits = selectedPlayers.reduce((sum, p) => sum + (Number(p.credit_value) || 0), 0)
    const playerCredit = Number(player.credit_value) || 0
    if (totalCredits + playerCredit > tournament.budget_cap) {
      return { success: false, error: 'Adding this player exceeds the budget cap' }
    }

    if (selectedPlayers.filter(p => String(p.team) === String(player.team)).length >= 7) {
      return { success: false, error: 'Maximum limit of 7 players per team reached' }
    }

    if (selectedPlayers.length >= 11) {
      return { success: false, error: 'Team is already full' }
    }

    // Only update Local State (Draft Mode)
    const normalizedPlayer = { ...player, role: playerRole, credit_value: playerCredit }
    setSelectedPlayers(prev => [...prev, normalizedPlayer])
    return { success: true }
  }

  const removePlayer = async (playerId) => {
    // Only update Local State (Draft Mode)
    setSelectedPlayers(prev => prev.filter(p => String(p.id) !== String(playerId)))
    if (String(captainId) === String(playerId)) setCaptainId(null)
    if (String(viceCaptainId) === String(playerId)) setViceCaptainId(null)
    return { success: true }
  }

  const setCaptain = async (playerId) => {
    if (String(playerId) === String(viceCaptainId)) {
      return { success: false, error: 'A player cannot be both captain and vice-captain' }
    }
    // Only update Local State
    setCaptainId(playerId)
    return { success: true }
  }

  const setViceCaptain = async (playerId) => {
    if (String(playerId) === String(captainId)) {
      return { success: false, error: 'A player cannot be both captain and vice-captain' }
    }
    // Only update Local State
    setViceCaptainId(playerId)
    return { success: true }
  }

  const saveTeam = async () => {
    if (!match) return { success: false, error: 'Match data not loaded yet' }
    if (selectedPlayers.length < 11) return { success: false, error: 'Team is not complete yet' }
    if (!captainId || !viceCaptainId) return { success: false, error: 'You must set a Captain and Vice Captain before saving.' }

    try {
      const profileRes = await axiosInstance.get('/api/users/me/')
      const teamName = profileRes.data.team_name
      if (!teamName) return { success: false, error: 'Please set your team name in Settings first' }

      let fantasyTeamId = savedTeamId

      // 1. If shell team doesn't exist, create it once
      if (!fantasyTeamId) {
        const teamRes = await axiosInstance.post(
          '/api/fantasy-teams/',
          { tournament: tournament.id, match: match.id, name: teamName, deadline: match.match_date }
        )
        fantasyTeamId = teamRes.data.id
        setSavedTeamId(fantasyTeamId)
      }

      // 2. Submit the 11 players via the new bulk endpoint
      const payload = {
        players: selectedPlayers.map(p => p.id),
        captain_id: captainId,
        vice_captain_id: viceCaptainId
      }

      await axiosInstance.post(`/api/fantasy-teams/${fantasyTeamId}/update-roster/`, payload)
      
      return { success: true, teamId: fantasyTeamId }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to save team' }
    }
  }

  return (
    <TeamContext.Provider value={{
      selectedPlayers, addPlayer, removePlayer,
      tournament, match, loadMatch,
      captainId, viceCaptainId, setCaptain, setViceCaptain,
      saveTeam, savedTeamId, isDeadlinePassed,
    }}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeam() {
  const context = useContext(TeamContext)
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}
