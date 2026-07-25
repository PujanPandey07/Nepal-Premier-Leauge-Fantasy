// Matches.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import  axiosInstance  from '../utilis/axiosInstance'

const BRAND = '#38003c'

function groupByDay(matches) {
  const groups = {}
  matches.forEach(m => {
    const day = new Date(m.match_date).toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short'
    })
    if (!groups[day]) groups[day] = []
    groups[day].push(m)
  })
  return groups
}

function TeamBadge({ name }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
      style={{ backgroundColor: `${BRAND}1A`, color: BRAND }}
    >
      {name ? name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?'}
    </div>
  )
}

function Matches() {
  const [matches, setMatches] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)
  const [buildableIds, setBuildableIds] = useState(new Set())

  useEffect(() => {
    axiosInstance.get('/api/matches/')
      .then(res => {
        setMatches(res.data.results || res.data)
        setNextPage(res.data.next)
        setPrevPage(res.data.previous)
      })
      .catch(error => console.error('Error fetching matches:', error))

    axiosInstance.get('/api/matches/?ordering=match_date')
      .then(res => {
        const sorted = res.data.results || res.data
        const now = new Date()
        const isOpen = (m) => now < new Date(m.match_date) - 30 * 60 * 1000
        const openSorted = sorted.filter(isOpen)
        if (openSorted.length === 0) { setBuildableIds(new Set()); return }
        const earliestDay = new Date(openSorted[0].match_date).toDateString()
        const ids = openSorted
          .filter(m => new Date(m.match_date).toDateString() === earliestDay)
          .map(m => m.id)
        setBuildableIds(new Set(ids))
      })
      .catch(error => console.error('Error determining buildable matches:', error))
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

  const sorted = [...matches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
  const grouped = groupByDay(sorted)

  const MatchRow = ({ match }) => {
    const isBuildable = buildableIds.has(match.id)
    const isCompleted = match.status === 'completed'
    const time = new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
      <Link
        to={`/matches/${match.id}`}
        state={{ isBuildable }}
        className="flex items-center justify-between py-4 px-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="font-medium text-gray-900 text-sm text-right">{match.home_team_name}</span>
          <TeamBadge name={match.home_team_name} />
        </div>

        <div className="mx-6 text-center shrink-0">
          {isCompleted ? (
            <>
              <p className="text-gray-900 text-sm font-semibold tabular-nums">
                {match.score_summary?.[0]?.runs ?? '-'}/{match.score_summary?.[0]?.wickets ?? '-'}
              </p>
              <p className="text-gray-900 text-sm font-semibold tabular-nums">
                {match.score_summary?.[1]?.runs ?? '-'}/{match.score_summary?.[1]?.wickets ?? '-'}
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-xs">{time}</p>
              {isBuildable && (
                <span
                  className="text-[10px] text-white font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{ backgroundColor: BRAND }}
                >
                  Open
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1">
          <TeamBadge name={match.away_team_name} />
          <span className="font-medium text-gray-900 text-sm">{match.away_team_name}</span>
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-gray-900 text-xl font-bold px-6 mb-4">NPL 2025</h1>

        {Object.entries(grouped).map(([day, dayMatches]) => (
          <div key={day} className="mb-6">
            <p
              className="text-white text-xs font-semibold uppercase tracking-wide px-6 py-2 rounded-t-lg"
              style={{ backgroundColor: BRAND }}
            >
              {day}
            </p>
            <div className="bg-white border border-gray-100 rounded-b-lg overflow-hidden shadow-sm">
              {dayMatches.map(match => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between px-6 mt-6">
          <button
            disabled={!prevPage}
            onClick={() => goToPage(prevPage)}
            className="font-medium disabled:opacity-30"
            style={{ color: BRAND }}
          >
            Previous
          </button>
          <button
            disabled={!nextPage}
            onClick={() => goToPage(nextPage)}
            className="font-medium disabled:opacity-30"
            style={{ color: BRAND }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Matches