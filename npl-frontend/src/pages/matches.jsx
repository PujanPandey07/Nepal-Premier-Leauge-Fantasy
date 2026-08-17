import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import { fetchAllPages } from '../utilis/fetchAllPages'

const BRAND = '#38003c'

function groupByDay(matches) {
  const groups = {}
  matches.forEach((m) => {
    if (!m.match_date) return
    const day = new Date(m.match_date).toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    if (!groups[day]) groups[day] = []
    groups[day].push(m)
  })
  return groups
}

function TeamBadge({ name }) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
    : '?'

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ backgroundColor: `${BRAND}1A`, color: BRAND }}
    >
      {initials}
    </div>
  )
}

function MatchRow({ match, isBuildable }) {
  const isCompleted = match.status === 'completed'
  const time = match.match_date
    ? new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '-'

  return (
    <Link
      to={`/matches/${match.id}`}
      state={{ isBuildable }}
      className="flex items-center justify-between border-b border-gray-100 px-6 py-4 transition-colors hover:bg-gray-50"
    >
      <div className="flex flex-1 items-center justify-end gap-3">
        <span className="text-right text-sm font-medium text-gray-900">{match.home_team_name}</span>
        <TeamBadge name={match.home_team_name} />
      </div>

      <div className="mx-6 shrink-0 text-center">
        {isCompleted ? (
          <>
            <p className="tabular-nums text-sm font-semibold text-gray-900">
              {match.score_summary?.[0]?.runs ?? '-'}/{match.score_summary?.[0]?.wickets ?? '-'}
            </p>
            <p className="tabular-nums text-sm font-semibold text-gray-900">
              {match.score_summary?.[1]?.runs ?? '-'}/{match.score_summary?.[1]?.wickets ?? '-'}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-500">{time}</p>
            {isBuildable && (
              <span
                className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: BRAND }}
              >
                Open
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex flex-1 items-center gap-3">
        <TeamBadge name={match.away_team_name} />
        <span className="text-sm font-medium text-gray-900">{match.away_team_name}</span>
      </div>
    </Link>
  )
}

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [buildableIds, setBuildableIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    Promise.all([
      fetchAllPages('/api/matches/?page_size=20'),
      fetchAllPages('/api/matches/?ordering=match_date&page_size=20'),
    ])
      .then(([allMatches, orderingMatches]) => {
        if (!isMounted) return

        const sorted = [...allMatches].sort(
          (a, b) => new Date(a.match_date) - new Date(b.match_date)
        )
        setMatches(sorted)

        const now = new Date()
        const isOpen = (m) => now < new Date(m.match_date) - 30 * 60 * 1000
        const openSorted = orderingMatches.filter(isOpen)

        if (openSorted.length > 0) {
          const earliestDay = new Date(openSorted[0].match_date).toDateString()
          const ids = openSorted
            .filter((m) => new Date(m.match_date).toDateString() === earliestDay)
            .map((m) => m.id)
          setBuildableIds(new Set(ids))
        } else {
          setBuildableIds(new Set())
        }
      })
      .catch((error) => {
        if (isMounted) console.error('Error fetching matches:', error)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const grouped = useMemo(() => groupByDay(matches), [matches])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="mb-4 px-6 text-xl font-bold text-gray-900">NPL 2025</h1>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">Loading matches...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">No matches found.</div>
        ) : (
          Object.entries(grouped).map(([day, dayMatches]) => (
            <div key={day} className="mb-6">
              <p
                className="rounded-t-lg px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: BRAND }}
              >
                {day}
              </p>
              <div className="overflow-hidden rounded-b-lg border border-gray-100 bg-white shadow-sm">
                {dayMatches.map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    isBuildable={buildableIds.has(match.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}