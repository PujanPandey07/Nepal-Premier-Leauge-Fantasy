import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const TeamContext = createContext()
export const ROLE_LIMITS = {
  'Wicket-Keeper': 1,
  'Batsman': 4,
  'Bowler': 4,
  'All-Rounder': 2,
}

export function TeamProvider({ children }) {
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [tournament, setTournaments] = useState(null)
  const [match, setMatch] = useState(null)
  const [captainId, setCaptainId] = useState(null)
  const [viceCaptainId, setViceCaptainId] = useState(null)
  const [savedTeamId, setSavedTeamId] = useState(null)        // NEW: the saved Fantasy_Team's id, if any
  const [teamPlayerRowIds, setTeamPlayerRowIds] = useState({}) // NEW: maps player.id -> Fantasy_Team_Player row id

  useEffect(() => {
    axios.get('http://localhost:8000/api/tournaments/')
      .then(res => setTournaments(res.data.results[0]))
      .catch(error => console.error('Error fetching tournaments:', error))
  }, [])

  useEffect(() => {
    axios.get('http://localhost:8000/api/matches/')
      .then(res => setMatch(res.data.results[0]))
      .catch(error => console.error('Error fetching matches:', error))
  }, [])

  // NEW: once we know which match we're building for, check if a team
  // already exists for it, and if so, load it into state instead of
  // starting from an empty squad.
  useEffect(() => {
    if (!match) return
    const token = localStorage.getItem('token')
    if (!token) return  // not logged in — nothing to load yet

    const headers = { Authorization: `Bearer ${token}` }

    axios.get('http://localhost:8000/api/fantasy-teams/', { headers })
      .then(res => {
        const teams = res.data.results || res.data
        const existing = teams.find(t => t.match === match.id)
        if (!existing) return  // no saved team for this match yet — nothing to load

        setSavedTeamId(existing.id)

        return axios.get('http://localhost:8000/api/fantasy-team-players/', { headers })
          .then(res2 => {
            const allRows = res2.data.results || res2.data
            const rows = allRows.filter(r => r.fantasy_team === existing.id)

            // Each row only has the player's ID, not their full info
            // (name, role, credit_value) — so we fetch each player individually.
            return Promise.all(
              rows.map(row =>
                axios.get(`http://localhost:8000/api/players/${row.player}/`)
                  .then(pRes => ({
                    ...pRes.data,
                    credit_value: Number(pRes.data.credit_value),
                    _rowId: row.id,
                    _isCaptain: row.is_captain,
                    _isViceCaptain: row.is_vice_captain,
                    points_earned: row.points_earned,
                  }))
              )
            )
          })
          .then(players => {
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
      console.warn('Tournament not loaded yet')
      return { success: false, error: 'Tournament data not loaded yet' }
    }
    const exists = selectedPlayers.some(p => p.id === player.id)
    if (exists) {
      console.warn('Player already in team')
      return { success: false, error: 'Player already in team' }
    }
    const roleCount = selectedPlayers.filter(p => p.role === player.role).length
    if (roleCount >= ROLE_LIMITS[player.role]) {
      console.warn(`Maximum limit reached for role: ${player.role}`)
      return { success: false, error: `Maximum limit reached for role: ${player.role}` }
    }
    const totalCredits = selectedPlayers.reduce((sum, p) => sum + p.credit_value, 0)
    if (totalCredits + player.credit_value > tournament.budget_cap) {
      console.warn('Adding this player exceeds the budget cap')
      return { success: false, error: 'Adding this player exceeds the budget cap' }
    }
    const totalplayersfromteam = selectedPlayers.filter(p => p.team === player.team).length
    if (totalplayersfromteam >= 7) {
      console.warn(`Maximum limit reached for team: ${player.team}`)
      return { success: false, error: `Maximum limit reached for team: ${player.team}` }
    }
    if (selectedPlayers.length >= 11) {
      console.warn('Team is already full')
      return { success: false, error: 'Team is already full' }
    }

    // NEW: if a team is already saved, sync this addition to the backend immediately
    if (savedTeamId) {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const res = await axios.post(
          'http://localhost:8000/api/fantasy-team-players/',
          { fantasy_team: savedTeamId, player: player.id, is_captain: false, is_vice_captain: false },
          { headers }
        )
        setTeamPlayerRowIds(prev => ({ ...prev, [player.id]: res.data.id }))
      } catch (error) {
        console.error('Error adding player to saved team:', error)
        const backendError = error.response?.data
        return { success: false, error: typeof backendError === 'object' ? Object.values(backendError)[0] : 'Failed to add player' }
      }
    }

    setSelectedPlayers(prev => [...prev, player])
    return { success: true }
  }

  const removePlayer = async (playerId) => {
    // NEW: if this player has a saved row, delete it from the backend first
    if (savedTeamId && teamPlayerRowIds[playerId]) {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        await axios.delete(`http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`, { headers })
      } catch (error) {
        console.error('Error removing player from saved team:', error)
        return { success: false, error: 'Failed to remove player' }
      }
      setTeamPlayerRowIds(prev => {
        const updated = { ...prev }
        delete updated[playerId]
        return updated
      })
    }

    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId))
    if (captainId === playerId) setCaptainId(null)
    if (viceCaptainId === playerId) setViceCaptainId(null)
    return { success: true }
  }

  // CHANGED: now async, and PATCHes the backend if this player already
  // has a saved row in the database.
  const setCaptain = async (playerId) => {
    if (playerId === viceCaptainId) {
      console.warn('This player is already vice-captain')
      return { success: false, error: 'A player cannot be both captain and vice-captain' }
    }

    if (savedTeamId && teamPlayerRowIds[playerId]) {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        // Unset the previous captain's row first, if there was one
        if (captainId && teamPlayerRowIds[captainId]) {
          await axios.patch(
            `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[captainId]}/`,
            { is_captain: false },
            { headers }
          )
        }
        await axios.patch(
          `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`,
          { is_captain: true },
          { headers }
        )
      } catch (error) {
        console.error('Error updating captain:', error)
        return { success: false, error: 'Failed to update captain' }
      }
    }

    setCaptainId(playerId)
    return { success: true }
  }

  const setViceCaptain = async (playerId) => {
    if (playerId === captainId) {
      console.warn('This player is already captain')
      return { success: false, error: 'A player cannot be both captain and vice-captain' }
    }

    if (savedTeamId && teamPlayerRowIds[playerId]) {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        if (viceCaptainId && teamPlayerRowIds[viceCaptainId]) {
          await axios.patch(
            `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[viceCaptainId]}/`,
            { is_vice_captain: false },
            { headers }
          )
        }
        await axios.patch(
          `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`,
          { is_vice_captain: true },
          { headers }
        )
      } catch (error) {
        console.error('Error updating vice-captain:', error)
        return { success: false, error: 'Failed to update vice-captain' }
      }
    }

    setViceCaptainId(playerId)
    return { success: true }
  }

  const saveTeam = async (teamName) => {
    const token = localStorage.getItem('token')
    if (!token) {
      return { success: false, error: 'You must be logged in to save a team' }
    }
    if (!match) {
      return { success: false, error: 'Match data not loaded yet' }
    }
    if (selectedPlayers.length < 11) {
      return { success: false, error: 'Team is not complete yet' }
    }

    const headers = { Authorization: `Bearer ${token}` }

    try {
      const teamRes = await axios.post(
        'http://localhost:8000/api/fantasy-teams/',
        {
          tournament: tournament.id,
          match: match.id,
          name: teamName,
          deadline: match.match_date,
        },
        { headers }
      )
      const fantasyTeamId = teamRes.data.id
      setSavedTeamId(fantasyTeamId)  // NEW

      const rowIdMap = {}  // NEW
      for (const player of selectedPlayers) {
        const playerRowRes = await axios.post(
          'http://localhost:8000/api/fantasy-team-players/',
          {
            fantasy_team: fantasyTeamId,
            player: player.id,
            is_captain: player.id === captainId,
            is_vice_captain: player.id === viceCaptainId,
          },
          { headers }
        )
        rowIdMap[player.id] = playerRowRes.data.id  // NEW
      }
      setTeamPlayerRowIds(rowIdMap)  // NEW

      return { success: true, teamId: fantasyTeamId }
    } catch (error) {
      console.error('Error saving team:', error)
      return { success: false, error: error.response?.data?.detail || 'Failed to save team' }
    }
  }

  return (
    <TeamContext.Provider value={{
      selectedPlayers, addPlayer, removePlayer,
      tournament, match,
      captainId, viceCaptainId, setCaptain, setViceCaptain,
      saveTeam, savedTeamId
    }}>
      {children}
    </TeamContext.Provider>
  )
}