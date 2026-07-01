// Matches.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Matches() {
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState({})
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)

  useEffect(() => {
    axios.get('http://localhost:8000/api/cricket-teams/')
      .then(res => {
        const list = res.data.results || res.data
        const map = {}
        list.forEach(t => { map[t.id] = t.name })
        setTeams(map)
      })
      .catch(error => console.error('Error fetching teams:', error))

    axios.get('http://localhost:8000/api/matches/')
      .then(res => {
        setMatches(res.data.results || res.data)
        setNextPage(res.data.next)
        setPrevPage(res.data.previous)
      })
      .catch(error => console.error('Error fetching matches:', error))
  }, [])

  const goToPage = (url) => {
    if (!url) return
    axios.get(url)
      .then(res => {
        setMatches(res.data.results || res.data)
        setNextPage(res.data.next)
        setPrevPage(res.data.previous)
      })
      .catch(error => console.error('Error fetching matches:', error))
  }

  const now = new Date()
  const isDeadlinePassed = (match) =>
    now >= new Date(match.match_date) - 30 * 60 * 1000

  const pastMatches = matches
    .filter(m => isDeadlinePassed(m))
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))

  const openMatches = matches
    .filter(m => !isDeadlinePassed(m))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))

  const upcomingMatch = openMatches[0] || null
  const futureMatches = openMatches.slice(1)

  // MatchCard passes isBuildable via router state so MatchDetail knows
  // whether to show the Build Team button without re-fetching all matches.
  const MatchCard = ({ match, badge, isBuildable = false }) => (
    <Link
      to={`/matches/${match.id}`}
      state={{ isBuildable }}
      className="block bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-500">
          Gameweek {match.gameweek} · {match.status}
        </p>
        {badge && (
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-lg font-semibold mt-1">
        {teams[match.home_team] || '...'} vs {teams[match.away_team] || '...'}
      </p>
      <p className="text-sm text-gray-600 mt-1">{match.venue}</p>
      <p className="text-sm text-gray-600">
        {new Date(match.match_date).toLocaleString()}
      </p>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8 max-w-3xl mx-auto">

        <h2 className="text-xl font-bold mb-4">Upcoming Match</h2>
        {upcomingMatch ? (
          <div className="mb-10">
            <MatchCard
              match={upcomingMatch}
              badge="Team Selection Open"
              isBuildable={true}
            />
          </div>
        ) : (
          <p className="text-gray-500 mb-10">No upcoming match right now.</p>
        )}

        {futureMatches.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4">Future Matches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {futureMatches.map(match => (
                // isBuildable not passed — defaults to false
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </>
        )}

        <h2 className="text-xl font-bold mb-4">Past Matches</h2>
        {pastMatches.length === 0 ? (
          <p className="text-gray-500">No past matches yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button disabled={!prevPage} onClick={() => goToPage(prevPage)} className="disabled:opacity-30">
            Previous
          </button>
          <button disabled={!nextPage} onClick={() => goToPage(nextPage)} className="disabled:opacity-30">
            Next
          </button>
        </div>

      </div>
    </div>
  )
}

export default Matches