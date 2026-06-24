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
  const [match, setMatch] = useState(null)              // CHANGED: singular, not array
  const [captainId, setCaptainId] = useState(null)       // NEW
  const [viceCaptainId, setViceCaptainId] = useState(null) // NEW

  useEffect(() => {
    axios.get('http://localhost:8000/api/tournaments/')
      .then(res => setTournaments(res.data[0]))
      .catch(error => console.error('Error fetching tournaments:', error))
  }, [])

  useEffect(() => {
    axios.get('http://localhost:8000/api/matches/')
      .then(res => setMatch(res.data[0]))   // CHANGED: just grab the first match
      .catch(error => console.error('Error fetching matches:', error))
  }, [])

  const addPlayer = (player) => {
    if (!tournament || !tournament.budget_cap) {
      console.warn('Tournament not loaded yet')
      return {success: false, error: 'Tournament data not loaded yet'}
    }
    const exists = selectedPlayers.some(p => p.id === player.id)
    if (exists) {
      console.warn('Player already in team')
      return {success: false, error: 'Player already in team'}
    }
    const roleCount = selectedPlayers.filter(p => p.role === player.role).length
    if (roleCount >= ROLE_LIMITS[player.role]) {
      console.warn(`Maximum limit reached for role: ${player.role}`)
      return {success: false, error: `Maximum limit reached for role: ${player.role}`}
    }
    const totalCredits = selectedPlayers.reduce((sum, p) => sum + p.credit_value, 0)
    if (totalCredits + player.credit_value > tournament.budget_cap) {
      console.warn('Adding this player exceeds the budget cap')
      return {success: false, error: 'Adding this player exceeds the budget cap'}
    }
    const totalplayersfromteam = selectedPlayers.filter(p => p.team === player.team).length
    if (totalplayersfromteam >= 7) {
      console.warn(`Maximum limit reached for team: ${player.team}`)
      return {success: false, error: `Maximum limit reached for team: ${player.team}`}
    }
    const teamCount = selectedPlayers.length
    if (teamCount >= 11) {
      console.warn('Team is already full')
      return {success: false, error: 'Team is already full'}
    }
    setSelectedPlayers(prev => [...prev, player])
    return {success: true}
  }

  const removePlayer = (playerId) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId))
  }

  // NEW: captain / vice-captain
  const setCaptain = (playerId) => {
    if (playerId === viceCaptainId) {
      console.warn('This player is already vice-captain')
      return {success: false, error: 'A player cannot be both captain and vice-captain'}
    }
    setCaptainId(playerId)
    return {success: true}
  }

  const setViceCaptain = (playerId) => {
    if (playerId === captainId) {
      console.warn('This player is already captain')
      return {success: false, error: 'A player cannot be both captain and vice-captain'}
    }
    setViceCaptainId(playerId)
    return {success: true}
  }

  // NEW: the actual save function
  const saveTeam = async (teamName) => {
    const token = localStorage.getItem('token')   // CONFIRM this key matches Login.jsx
    if (!token) {
      return {success: false, error: 'You must be logged in to save a team'}
    }
    if (!match) {
      return {success: false, error: 'Match data not loaded yet'}
    }
    if (selectedPlayers.length < 11) {
      return {success: false, error: 'Team is not complete yet'}
    }

    const headers = { Authorization: `Bearer ${token}` }

    try {
      // Step 1: create the Fantasy_Team itself, get back its id
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

      // Step 2: create one Fantasy_Team_Player row per selected player
      for (const player of selectedPlayers) {
        await axios.post(
          'http://localhost:8000/api/fantasy-team-players/',
          {
            fantasy_team: fantasyTeamId,
            player: player.id,
            is_captain: player.id === captainId,
            is_vice_captain: player.id === viceCaptainId,
          },
          { headers }
        )
      }

      return {success: true, teamId: fantasyTeamId}
    } catch (error) {
      console.error('Error saving team:', error)
      return {success: false, error: error.response?.data?.detail || 'Failed to save team'}
    }
  }

  return (
    <TeamContext.Provider value={{
      selectedPlayers, addPlayer, removePlayer,
      tournament, match,
      captainId, viceCaptainId, setCaptain, setViceCaptain,
      saveTeam   // NEW
    }}>
      {children}
    </TeamContext.Provider>
  )
}