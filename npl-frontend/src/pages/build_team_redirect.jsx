// BuildTeamRedirect.jsx — handles the no-id case: finds the closest valid
// match and redirects to /build-team/:matchId for it.
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'

export default function BuildTeamRedirect() {
  const [targetId, setTargetId] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    axios.get('http://localhost:8000/api/matches/')
      .then(res => {
        const allMatches = res.data.results || res.data
        const now = new Date()
        const eligible = allMatches.filter(m => {
          const deadline = new Date(m.match_date) - 30 * 60 * 1000
          return now < deadline
        })
        if (eligible.length === 0) {
          setNotFound(true)
          return
        }
        const closest = eligible.reduce((soonest, current) =>
          new Date(current.match_date) < new Date(soonest.match_date) ? current : soonest
        )
        setTargetId(closest.id)
      })
      .catch(error => console.error('Error finding closest match:', error))
  }, [])

  if (notFound) return <p className="p-8">No upcoming matches available right now.</p>
  if (!targetId) return <p className="p-8">Loading...</p>
  return <Navigate to={`/build-team/${targetId}`} replace />
}