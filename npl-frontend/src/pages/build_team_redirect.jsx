// BuildTeamRedirect.jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import axiosInstance from '../utilis/axiosInstance'
import { fetchAllPages } from '../utilis/fetchAllPages'

export default function BuildTeamRedirect() {
  const [targetId, setTargetId] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [hasTeam, setHasTeam] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchAllPages('/api/matches/?ordering=match_date'),
      axiosInstance.get('/api/fantasy-teams/').catch(() => ({ data: { results: [] } }))
    ])
      .then(([allMatches, teamsRes]) => {
        const myTeams = teamsRes.data.results || teamsRes.data || []
        const myMatchIds = new Set(myTeams.map(t => (t.match?.id || t.match)))

        const now = new Date()
        const isOpen = (m) => now < new Date(m.match_date) - 30 * 60 * 1000
        
        // SAME logic as Matches.jsx: only matches on the EARLIEST open day are buildable
        const openSorted = allMatches.filter(isOpen)
        if (openSorted.length === 0) {
          setNotFound(true)
          return
        }

        const earliestDay = new Date(openSorted[0].match_date).toDateString()
        const buildableMatches = openSorted.filter(m => 
          new Date(m.match_date).toDateString() === earliestDay
        )

        // Find first buildable match where user doesn't have a team
        const nextMatch = buildableMatches.find(m => !myMatchIds.has(m.id))

        if (!nextMatch) {
          setHasTeam(true)
          return
        }

        setTargetId(nextMatch.id)
      })
      .catch(error => {
        console.error('Error finding closest match:', error)
        setNotFound(true)
      })
  }, [])

  if (hasTeam) return <Navigate to="/view-team" replace />
  if (notFound) return <p className="p-8">No upcoming matches available right now.</p>
  if (!targetId) return <p className="p-8">Loading...</p>
  return <Navigate to={`/build-team/${targetId}`} replace />
}