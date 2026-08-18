import { createContext, useContext, useState, useMemo } from 'react'

export const TeamContext = createContext()

// Helper to normalize backend role strings into standard Fantasy categories
export const getFantasyRole = (role) => {
  if (!role) return 'BAT'
  const r = String(role).toUpperCase().trim()
  if (r.includes('WICKET') || r.includes('WK') || r.includes('KEEPER')) return 'WK'
  if (r.includes('BAT') || r.includes('BATTER') || r.includes('BATSMAN')) return 'BAT'
  if (r.includes('ALL') || r.includes('AR') || r.includes('ROUND')) return 'AR'
  if (r.includes('BOWL') || r.includes('BWL')) return 'BOWL'
  return 'BAT'
}

// Helper to extract clean team ID regardless of whether team is an ID or Object
const getTeamId = (p) => {
  if (!p) return ''
  if (typeof p.team === 'object' && p.team !== null) return String(p.team.id || '')
  return String(p.team || '')
}

// Helper to resolve human-readable team name
const getTeamName = (player, match) => {
  if (!player) return 'this team'
  if (player.team_name) return player.team_name
  if (typeof player.team === 'object' && player.team?.name) return player.team.name

  const pTeamId = getTeamId(player)
  if (match) {
    const homeId = typeof match.home_team === 'object' ? String(match.home_team?.id) : String(match.home_team)
    const awayId = typeof match.away_team === 'object' ? String(match.away_team?.id) : String(match.away_team)

    if (pTeamId && pTeamId === homeId) return match.home_team_name || match.home_team?.name || 'Home Team'
    if (pTeamId && pTeamId === awayId) return match.away_team_name || match.away_team?.name || 'Away Team'
  }
  return 'this team'
}

export function TeamProvider({ children }) {
  const [match, setMatch] = useState(null)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [captain, setCaptain] = useState(null)
  const [viceCaptain, setViceCaptain] = useState(null)

  const TOTAL_CREDITS = 100

  // Calculation: Total credits spent
  const creditsUsed = useMemo(() => {
    return selectedPlayers.reduce((sum, p) => sum + (Number(p.credit_value) || 0), 0)
  }, [selectedPlayers])

  // Calculation: Remaining credits
  const creditsRemaining = useMemo(() => {
    return Math.max(0, TOTAL_CREDITS - creditsUsed)
  }, [creditsUsed])

  // Calculation: Counts by normalized role
  const roleCounts = useMemo(() => {
    const counts = { WK: 0, BAT: 0, AR: 0, BOWL: 0 }
    selectedPlayers.forEach((p) => {
      const roleKey = getFantasyRole(p.role)
      counts[roleKey] = (counts[roleKey] || 0) + 1
    })
    return counts
  }, [selectedPlayers])

  // Calculation: Count of players selected per team
  const teamCounts = useMemo(() => {
    const counts = {}
    selectedPlayers.forEach((p) => {
      const tId = getTeamId(p)
      if (tId) {
        counts[tId] = (counts[tId] || 0) + 1
      }
    })
    return counts
  }, [selectedPlayers])

  // Add Player Validation & Handler
  const addPlayer = (playerToAdd) => {
    // 1. Check if player already exists in selection
    const exists = selectedPlayers.some((p) => String(p.id) === String(playerToAdd.id))
    if (exists) {
      return { success: false, error: `${playerToAdd.name} is already in your team.` }
    }

    // 2. Check maximum player capacity (11 players)
    if (selectedPlayers.length >= 11) {
      return { success: false, error: 'You can only select a maximum of 11 players.' }
    }

    // 3. Check credit budget limit
    const playerCredit = Number(playerToAdd.credit_value) || 0
    if (creditsUsed + playerCredit > TOTAL_CREDITS) {
      return {
        success: false,
        error: `Not enough credits! Adding ${playerToAdd.name} exceeds the 100 Cr limit.`,
      }
    }

    // 4. Check maximum 7 players per team restriction
    const targetTeamId = getTeamId(playerToAdd)
    const currentCountForTeam = selectedPlayers.filter(
      (p) => getTeamId(p) === targetTeamId
    ).length

    if (currentCountForTeam >= 7) {
      const teamDisplayName = getTeamName(playerToAdd, match)
      return {
        success: false,
        error: `You cannot select more than 7 players from ${teamDisplayName}.`,
      }
    }

    // Add player to state with formatted credit value
    const normalizedPlayer = {
      ...playerToAdd,
      team_name: getTeamName(playerToAdd, match),
      credit_value: playerCredit,
    }

    setSelectedPlayers((prev) => [...prev, normalizedPlayer])
    return { success: true }
  }

  // Remove Player Handler
  const removePlayer = (playerId) => {
    setSelectedPlayers((prev) => prev.filter((p) => String(p.id) !== String(playerId)))

    // Reset C/VC if removed player was designated
    if (String(captain) === String(playerId)) setCaptain(null)
    if (String(viceCaptain) === String(playerId)) setViceCaptain(null)
  }

  // Captain Assignment
  const handleSetCaptain = (playerId) => {
    if (String(viceCaptain) === String(playerId)) {
      setViceCaptain(null) // Swap out if already vice-captain
    }
    setCaptain(playerId)
  }

  // Vice-Captain Assignment
  const handleSetViceCaptain = (playerId) => {
    if (String(captain) === String(playerId)) {
      setCaptain(null) // Swap out if already captain
    }
    setViceCaptain(playerId)
  }

  // Reset/Clear Team
  const resetTeam = () => {
    setSelectedPlayers([])
    setCaptain(null)
    setViceCaptain(null)
  }

  // Hydrate team state (e.g. when editing an existing saved team)
  const loadExistingTeam = (playersList = [], capId = null, vcId = null) => {
    const formattedList = playersList.map((p) => ({
      ...p,
      team_name: getTeamName(p, match),
      credit_value: Number(p.credit_value) || 0,
    }))
    setSelectedPlayers(formattedList)
    setCaptain(capId)
    setViceCaptain(vcId)
  }

  return (
    <TeamContext.Provider
      value={{
        match,
        setMatch,
        selectedPlayers,
        setSelectedPlayers,
        captain,
        viceCaptain,
        setCaptain: handleSetCaptain,
        setViceCaptain: handleSetViceCaptain,
        addPlayer,
        removePlayer,
        resetTeam,
        loadExistingTeam,
        creditsUsed,
        creditsRemaining,
        TOTAL_CREDITS,
        roleCounts,
        teamCounts,
      }}
    >
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