import { fetchAllPages } from './fetchAllPages'

export async function fetchMatchPlayerPoints(matchId) {
  const rows = await fetchAllPages(`/api/match-performances/?match=${matchId}&page_size=20`)
  const pointsByPlayer = {}

  rows.forEach(row => {
    const playerId = row.player
    const points = Number(row.fantasy_points || 0)
    pointsByPlayer[playerId] = (pointsByPlayer[playerId] || 0) + points
  })

  return pointsByPlayer
}
