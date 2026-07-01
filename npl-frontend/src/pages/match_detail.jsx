// MatchDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'

function MatchDetail() {
  const { matchId } = useParams()
  // useLocation gives us the state passed via the Link in Matches.jsx
  const { state } = useLocation()
  // isBuildable defaults to false if user navigates directly via URL
  // (not from the Matches page) — safest default
  const isBuildable = state?.isBuildable ?? false

  const [match, setMatch] = useState(null)
  const [teams, setTeams] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      axios.get(`http://localhost:8000/api/matches/${matchId}/`),
      axios.get('http://localhost:8000/api/cricket-teams/'),
    ])
      .then(([matchRes, teamsRes]) => {
        setMatch(matchRes.data)
        const list = teamsRes.data.results || teamsRes.data
        const map = {}
        list.forEach(t => { map[t.id] = t.name })
        setTeams(map)
      })
      .catch(err => {
        console.error('Error loading match:', err)
        setError('Could not load this match')
      })
      .finally(() => setLoading(false))
  }, [matchId])

  if (loading) return <p className="p-8">Loading...</p>
  if (error) return <p className="p-8 text-red-500">{error}</p>
  if (!match) return <p className="p-8">Match not found.</p>

  const deadlinePassed = new Date() >= new Date(match.match_date) - 30 * 60 * 1000

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8 max-w-xl mx-auto">
        <Link to="/matches" className="text-blue-600 hover:underline text-sm">
          ← Back to matches
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mt-4">
          <p className="text-sm text-gray-500 mb-1">
            Gameweek {match.gameweek} · {match.status}
          </p>
          <h1 className="text-2xl font-bold">
            {teams[match.home_team] || '...'} vs {teams[match.away_team] || '...'}
          </h1>
          <p className="text-gray-600 mt-3">
            <span className="font-medium">Venue:</span> {match.venue}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-medium">Date:</span>{' '}
            {new Date(match.match_date).toLocaleString()}
          </p>
          {match.result && (
            <p className="text-gray-800 font-medium mt-3">
              Result: {match.result}
            </p>
          )}

          <div className="mt-6">
            {isBuildable ? (
              // Only the closest upcoming match gets this button
              <Link
                to={`/build-team/${match.id}`}
                className="inline-block bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700"
              >
                Build Team
              </Link>
            ) : deadlinePassed ? (
              // Past match — link to points for THIS specific match
              <Link
                to="/view-points"
                state={{ matchId: match.id }}
                className="text-blue-600 underline text-sm"
              >
                View points for this match →
              </Link>
            ) : (
              // Future match — info only
              <p className="text-gray-400 text-sm italic">
                Team selection not open yet for this match.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MatchDetail