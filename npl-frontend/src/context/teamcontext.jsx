import { createContext, useContext, useState, useMemo } from 'react'

export const TeamContext = createContext()

// Required export for page components
export const ROLE_LIMITS = {
  WK: { min: 1, max: 4, label: 'Wicket Keepers' },
  BAT: { min: 3, max: 6, label: 'Batters' },
  AR: { min: 1, max: 4, label: 'All Rounders' },
  BOWL: { min: 3, max: 6, label: 'Bowlers' },
}

// Required export for role normalization
export const getFantasyRole = (role) => {
  if (!role) return 'BAT'
  const r = String(role).toUpperCase().trim()
  if (r.includes('WICKET') || r.includes('WK') || r.includes('KEEPER')) return 'WK'
  if (r.includes('BAT') || r.includes('BATTER') || r.includes('BATSMAN')) return 'BAT'
  if (r.includes('ALL') || r.includes('AR') || r.includes('ROUND')) return 'AR'
  if (r.includes('BOWL') || r.includes('BWL')) return 'BOWL'
  return 'BAT'
}

const getTeamId = (p) => {
  if (!p) return ''
  if (typeof p.team === 'object' && p.team !== null) return String(p.team.id || '')
  return String(p.team || '')
}

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

  const creditsUsed = useMemo(() => {
    return selectedPlayers.reduce((sum, p) => sum + (Number(p.credit_value) || 0), 0)
  }, [selectedPlayers])

  const creditsRemaining = useMemo(() => {
    return Math.max(0, TOTAL_CREDITS - creditsUsed)
  }, [creditsUsed])

  const roleCounts = useMemo(() => {
    const counts = { WK: 0, BAT: 0, AR: 0, BOWL: 0 }
    selectedPlayers.forEach((p) => {
      const roleKey = getFantasyRole(p.role)
      counts[roleKey] = (counts[roleKey] || 0) + 1
    })
    return counts
  }, [selectedPlayers])

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

  const addPlayer = (playerToAdd) => {
    const exists = selectedPlayers.some((p) => String(p.id) === String(playerToAdd.id))
    if (exists) {
      return { success: false, error: `${playerToAdd.name} is already in your team.` }
    }

    if (selectedPlayers.length >= 11) {
      return { success: false, error: 'You can only select a maximum of 11 players.' }
    }

    const playerCredit = Number(playerToAdd.credit_value) || 0
    if (creditsUsed + playerCredit > TOTAL_CREDITS) {
      return {
        success: false,
        error: `Not enough credits! Adding ${playerToAdd.name} exceeds the 100 Cr limit.`,
      }
    }

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

    const normalizedPlayer = {
      ...playerToAdd,
      team_name: getTeamName(playerToAdd, match),
      credit_value: playerCredit,
    }

    setSelectedPlayers((prev) => [...prev, normalizedPlayer])
    return { success: true }
  }

  const removePlayer = (playerId) => {
    setSelectedPlayers((prev) => prev.filter((p) => String(p.id) !== String(playerId)))

    if (String(captain) === String(playerId)) setCaptain(null)
    if (String(viceCaptain) === String(playerId)) setViceCaptain(null)
  }

  const handleSetCaptain = (playerId) => {
    if (String(viceCaptain) === String(playerId)) setViceCaptain(null)
    setCaptain(playerId)
  }

  const handleSetViceCaptain = (playerId) => {
    if (String(captain) === String(playerId)) setCaptain(null)
    setViceCaptain(playerId)
  }

  const resetTeam = () => {
    setSelectedPlayers([])
    setCaptain(null)
    setViceCaptain(null)
  }

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