import { createContext, useState,useEffect } from 'react'
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
  useEffect(() => {
        axios.get('http://localhost:8000/api/tournaments/')
            .then(res => setTournaments(res.data[0]))
            .catch(error => console.error('Error fetching tournaments:', error))
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
    console.warn('Maximum limit reached for team: ${player.team}')
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

  return (
    <TeamContext.Provider value={{ selectedPlayers, addPlayer, removePlayer, tournament }}>
      {children}
    </TeamContext.Provider>
  )
}