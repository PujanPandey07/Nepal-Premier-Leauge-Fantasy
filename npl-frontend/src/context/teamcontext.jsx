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
  const [teamPlayerRowIds, setTeamPlayerRowIds] = useState({})

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

  useEffect(() => {
    if (!match) return

    setSelectedPlayers([])
    setCaptainId(null)
    setViceCaptainId(null)
    setSavedTeamId(null)
    setTeamPlayerRowIds({})

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
                    _rowId: row.id,
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
            const rowIdMap = {}
            players.forEach(p => { rowIdMap[p.id] = p._rowId })
            setTeamPlayerRowIds(rowIdMap)
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

    const normalizedPlayer = { ...player, role: playerRole, credit_value: playerCredit }

    if (savedTeamId) {
      try {
        const res = await axiosInstance.post(
          '/api/fantasy-team-players/',
          { fantasy_team: savedTeamId, player: player.id, is_captain: false, is_vice_captain: false }
        )
        setTeamPlayerRowIds(prev => ({ ...prev, [player.id]: res.data.id }))
      } catch (error) {
        const backendError = error.response?.data
        return { success: false, error: typeof backendError === 'object' ? Object.values(backendError)[0] : 'Failed to add player' }
      }
    }

    setSelectedPlayers(prev => [...prev, normalizedPlayer])
    return { success: true }
  }

  const removePlayer = async (playerId) => {
    if (savedTeamId && teamPlayerRowIds[playerId]) {
      try {
        await axiosInstance.delete(
          `/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`
        )
      } catch (error) {
        return { success: false, error: 'Failed to remove player' }
      }
      setTeamPlayerRowIds(prev => {
        const updated = { ...prev }
        delete updated[playerId]
        return updated
      })
    }
    setSelectedPlayers(prev => prev.filter(p => String(p.id) !== String(playerId)))
    if (String(captainId) === String(playerId)) setCaptainId(null)
    if (String(viceCaptainId) === String(playerId)) setViceCaptainId(null)
    return { success: true }
  }

  const setCaptain = async (playerId) => {
    if (String(playerId) === String(viceCaptainId)) {
      return { success: false, error: 'A player cannot be both captain and vice-captain' }
    }
    if (savedTeamId && teamPlayerRowIds[playerId]) {
      try {
        if (captainId && teamPlayerRowIds[captainId]) {
          await axiosInstance.patch(
            `/api/fantasy-team-players/${teamPlayerRowIds[captainId]}/`,
            { is_captain: false }
          )
        }
        await axiosInstance.patch(
          `/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`,
          { is_captain: true }
        )
      } catch (error) {
        return { success: false, error: 'Failed to update captain' }
      }
    }
    setCaptainId(playerId)
    return { success: true }
  }

  const setViceCaptain = async (playerId) => {
    if (String(playerId) === String(captainId)) {
      return { success: false, error: 'A player cannot be both captain and vice-captain' }
    }
    if (savedTeamId && teamPlayerRowIds[playerId]) {
      try {
        if (viceCaptainId && teamPlayerRowIds[viceCaptainId]) {
          await axiosInstance.patch(
            `/api/fantasy-team-players/${teamPlayerRowIds[viceCaptainId]}/`,
            { is_vice_captain: false }
          )
        }
        await axiosInstance.patch(
          `/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`,
          { is_vice_captain: true }
        )
      } catch (error) {
        return { success: false, error: 'Failed to update vice-captain' }
      }
    }
    setViceCaptainId(playerId)
    return { success: true }
  }

  const saveTeam = async () => {
    if (!match) return { success: false, error: 'Match data not loaded yet' }
    if (selectedPlayers.length < 11) return { success: false, error: 'Team is not complete yet' }

    try {
      const profileRes = await axiosInstance.get('/api/users/me/')
      const teamName = profileRes.data.team_name
      if (!teamName) {
        return { success: false, error: 'Please set your team name in Settings first' }
      }

      const teamRes = await axiosInstance.post(
        '/api/fantasy-teams/',
        { tournament: tournament.id, match: match.id, name: teamName, deadline: match.match_date }
      )
      const fantasyTeamId = teamRes.data.id
      setSavedTeamId(fantasyTeamId)

      const rowIdMap = {}
      for (const player of selectedPlayers) {
        const playerRowRes = await axiosInstance.post(
          '/api/fantasy-team-players/',
          {
            fantasy_team: fantasyTeamId,
            player: player.id,
            is_captain: String(player.id) === String(captainId),
            is_vice_captain: String(player.id) === String(viceCaptainId),
          }
        )
        rowIdMap[player.id] = playerRowRes.data.id
      }
      setTeamPlayerRowIds(rowIdMap)
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