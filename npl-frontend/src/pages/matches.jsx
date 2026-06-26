import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Matches() {
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState({})  // maps team id -> team name

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
      .then(res => setMatches(res.data.results || res.data))
      .catch(error => console.error('Error fetching matches:', error))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Select a Match</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map(match => (
            <Link
              key={match.id}
              to={`/build-team/${match.id}`}
              className="block bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
            >
              <p className="text-sm text-gray-500">Gameweek {match.gameweek} · {match.status}</p>
              <p className="text-lg font-semibold mt-1">
                {teams[match.home_team] || '...'} vs {teams[match.away_team] || '...'}
              </p>
              <p className="text-sm text-gray-600 mt-1">{match.venue}</p>
              <p className="text-sm text-gray-600">
                {new Date(match.match_date).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Matches