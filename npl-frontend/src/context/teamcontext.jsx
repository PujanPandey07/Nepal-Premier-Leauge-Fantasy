// TeamContext.jsx
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
  const [savedTeamId, setSavedTeamId] = useState(null)
  const [teamPlayerRowIds, setTeamPlayerRowIds] = useState({})

  const isDeadlinePassed = match
    ? new Date() > new Date(match.match_date) - 30 * 60 * 1000
    : false

  useEffect(() => {
    axios.get('http://localhost:8000/api/tournaments/')
      .then(res => setTournaments(res.data.results[0]))
      .catch(error => console.error('Error fetching tournaments:', error))
  }, [])

  // Called by TeamBuilder when it mounts or its matchId changes.
  // TeamContext no longer reads the URL itself — TeamBuilder reads
  // useParams() and passes the id here.
  const loadMatch = (matchId) => {
    if (!matchId) return
    // If this match is already loaded, don't re-fetch — that would
    // trigger the [match] effect and wipe selectedPlayers unnecessarily
    // (which happens when navigating back from the players page)
    if (match && match.id === matchId) return
    axios.get(`http://localhost:8000/api/matches/${matchId}/`)
      .then(res => setMatch(res.data))
      .catch(error => console.error('Error fetching match:', error))
  }

  // Whenever match changes: reset all squad state, then check if a
  // saved team already exists for this match and load it if so.
  useEffect(() => {
    if (!match) return

    // Reset everything first — switching matches should never carry
    // over the previous match's selection.
    setSelectedPlayers([])
    setCaptainId(null)
    setViceCaptainId(null)
    setSavedTeamId(null)
    setTeamPlayerRowIds({})

    const token = localStorage.getItem('token')
    if (!token) return

    const headers = { Authorization: `Bearer ${token}` }

    axios.get('http://localhost:8000/api/fantasy-teams/', { headers })
      .then(res => {
        const teams = res.data.results || res.data
        const existing = teams.find(t => t.match === match.id)
        if (!existing) return

        setSavedTeamId(existing.id)

        return axios.get('http://localhost:8000/api/fantasy-team-players/', { headers })
          .then(res2 => {
            const allRows = res2.data.results || res2.data
            const rows = allRows.filter(r => r.fantasy_team === existing.id)

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
      return { success: false, error: 'Tournament data not loaded yet' }
    }
    if (selectedPlayers.some(p => p.id === player.id)) {
      return { success: false, error: 'Player already in team' }
    }
    if (selectedPlayers.filter(p => p.role === player.role).length >= ROLE_LIMITS[player.role]) {
      return { success: false, error: `Maximum limit reached for role: ${player.role}` }
    }
    const totalCredits = selectedPlayers.reduce((sum, p) => sum + p.credit_value, 0)
    if (totalCredits + player.credit_value > tournament.budget_cap) {
      return { success: false, error: 'Adding this player exceeds the budget cap' }
    }
    if (selectedPlayers.filter(p => p.team === player.team).length >= 7) {
      return { success: false, error: `Maximum limit reached for team: ${player.team}` }
    }
    if (selectedPlayers.length >= 11) {
      return { success: false, error: 'Team is already full' }
    }

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
        const backendError = error.response?.data
        return { success: false, error: typeof backendError === 'object' ? Object.values(backendError)[0] : 'Failed to add player' }
      }
    }

    setSelectedPlayers(prev => [...prev, player])
    return { success: true }
  }

  const removePlayer = async (playerId) => {
    if (savedTeamId && teamPlayerRowIds[playerId]) {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        await axios.delete(
          `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`,
          { headers }
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
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId))
    if (captainId === playerId) setCaptainId(null)
    if (viceCaptainId === playerId) setViceCaptainId(null)
    return { success: true }
  }

  const setCaptain = async (playerId) => {
    if (playerId === viceCaptainId) {
      return { success: false, error: 'A player cannot be both captain and vice-captain' }
    }
    if (savedTeamId && teamPlayerRowIds[playerId]) {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        if (captainId && teamPlayerRowIds[captainId]) {
          await axios.patch(
            `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[captainId]}/`,
            { is_captain: false }, { headers }
          )
        }
        await axios.patch(
          `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`,
          { is_captain: true }, { headers }
        )
      } catch (error) {
        return { success: false, error: 'Failed to update captain' }
      }
    }
    setCaptainId(playerId)
    return { success: true }
  }

  const setViceCaptain = async (playerId) => {
    if (playerId === captainId) {
      return { success: false, error: 'A player cannot be both captain and vice-captain' }
    }
    if (savedTeamId && teamPlayerRowIds[playerId]) {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      try {
        if (viceCaptainId && teamPlayerRowIds[viceCaptainId]) {
          await axios.patch(
            `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[viceCaptainId]}/`,
            { is_vice_captain: false }, { headers }
          )
        }
        await axios.patch(
          `http://localhost:8000/api/fantasy-team-players/${teamPlayerRowIds[playerId]}/`,
          { is_vice_captain: true }, { headers }
        )
      } catch (error) {
        return { success: false, error: 'Failed to update vice-captain' }
      }
    }
    setViceCaptainId(playerId)
    return { success: true }
  }

  const saveTeam = async (teamName) => {
    const token = localStorage.getItem('token')
    if (!token) return { success: false, error: 'You must be logged in to save a team' }
    if (!match) return { success: false, error: 'Match data not loaded yet' }
    if (selectedPlayers.length < 11) return { success: false, error: 'Team is not complete yet' }

    const headers = { Authorization: `Bearer ${token}` }
    try {
      const teamRes = await axios.post(
        'http://localhost:8000/api/fantasy-teams/',
        { tournament: tournament.id, match: match.id, name: teamName, deadline: match.match_date },
        { headers }
      )
      const fantasyTeamId = teamRes.data.id
      setSavedTeamId(fantasyTeamId)

      const rowIdMap = {}
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