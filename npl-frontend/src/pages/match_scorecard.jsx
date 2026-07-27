import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

const BRAND = '#38003c'

function getMatchResult(scorecard) {
  const result = scorecard?.result?.trim()
  const innings = scorecard?.innings || []

  if (result && /won/i.test(result)) {
    return result
  }

  if (innings.length >= 2) {
    const firstInnings = innings[0]
    const secondInnings = innings[1]

    if (secondInnings.total_runs > firstInnings.total_runs) {
      const wicketsRemaining = Math.max(10 - Number(secondInnings.total_wickets || 0), 0)
      return `${secondInnings.batting_team_name} won by ${wicketsRemaining || 1} wicket${wicketsRemaining === 1 ? '' : 's'}`
    }

    if (firstInnings.total_runs > secondInnings.total_runs) {
      return `${firstInnings.batting_team_name} won by ${firstInnings.total_runs - secondInnings.total_runs} runs`
    }
  }

  return result || 'Result pending'
}

function formatOvers(overs) {
  if (overs === null || overs === undefined) return '-'
  return typeof overs === 'number' ? overs.toFixed(1) : overs
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  )
}

function BattingTable({ performances }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3 text-right">R</th>
            <th className="px-4 py-3 text-right">B</th>
            <th className="px-4 py-3 text-right">4s</th>
            <th className="px-4 py-3 text-right">6s</th>
            <th className="px-4 py-3 text-right">SR</th>
            <th className="px-4 py-3 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {performances.map((player) => (
            <tr key={player.player} className="border-t border-gray-100 hover:bg-gray-50/60">
              <td className="px-4 py-3 font-medium text-gray-900">{player.player_name}</td>
              <td className="px-4 py-3 text-right tabular-nums">{player.runs_scored}</td>
              <td className="px-4 py-3 text-right tabular-nums">{player.balls_faced}</td>
              <td className="px-4 py-3 text-right tabular-nums">{player.fours}</td>
              <td className="px-4 py-3 text-right tabular-nums">{player.sixes}</td>
              <td className="px-4 py-3 text-right tabular-nums">{player.strike_rate}</td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{player.fantasy_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BowlingTable({ performances }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Bowler</th>
            <th className="px-4 py-3 text-right">O</th>
            <th className="px-4 py-3 text-right">W</th>
            <th className="px-4 py-3 text-right">M</th>
            <th className="px-4 py-3 text-right">Econ</th>
            <th className="px-4 py-3 text-right">C</th>
            <th className="px-4 py-3 text-right">RO</th>
            <th className="px-4 py-3 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {performances
            .filter(player => Number(player.wickets_taken || 0) > 0 || Number(player.maidens || 0) > 0 || Number(player.catches || 0) > 0 || Number(player.run_outs || 0) > 0)
            .map((player) => (
              <tr key={player.player} className="border-t border-gray-100 hover:bg-gray-50/60">
                <td className="px-4 py-3 font-medium text-gray-900">{player.player_name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatOvers(player.overs_bowled)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.wickets_taken}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.maidens}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.economy_rate}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.catches}</td>
                <td className="px-4 py-3 text-right tabular-nums">{player.run_outs}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">{player.fantasy_points}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

function isBattingPerformance(player) {
  return (
    Number(player.balls_faced || 0) > 0 ||
    Number(player.runs_scored || 0) > 0 ||
    Number(player.fours || 0) > 0 ||
    Number(player.sixes || 0) > 0 ||
    Number(player.strike_rate || 0) > 0
  )
}

function isBowlingPerformance(player) {
  return (
    Number(player.overs_bowled || 0) > 0 ||
    Number(player.wickets_taken || 0) > 0 ||
    Number(player.maidens || 0) > 0 ||
    Number(player.economy_rate || 0) > 0 ||
    Number(player.catches || 0) > 0 ||
    Number(player.run_outs || 0) > 0
  )
}

export default function MatchScorecard() {
  const { matchId } = useParams()
  const [scorecard, setScorecard] = useState(null)
  const [activeInnings, setActiveInnings] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    axiosInstance.get(`/api/matches/${matchId}/scorecard/`)
      .then(res => {
        setScorecard(res.data)
        setActiveInnings(0)
      })
      .catch(() => setError('Could not load scorecard for this match.'))
      .finally(() => setLoading(false))
  }, [matchId])

  const innings = scorecard?.innings || []
  const currentInnings = innings[activeInnings]

  const matchResult = useMemo(() => getMatchResult(scorecard), [scorecard])

  const battingPlayers = useMemo(() => {
    if (!currentInnings?.performances?.length) return []
    return [...currentInnings.performances].filter(isBattingPerformance)
  }, [currentInnings])

  const bowlingPlayers = useMemo(() => {
    if (!currentInnings?.performances?.length) return []
    return [...currentInnings.performances].filter(isBowlingPerformance)
  }, [currentInnings])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="p-8 text-center text-gray-600">Loading scorecard...</div>
      </div>
    )
  }

  if (error || !scorecard) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl p-8">
          <Link to={`/matches/${matchId}`} className="text-sm font-medium text-purple-900 hover:underline">
            ← Back to match
          </Link>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-red-600">{error || 'Scorecard unavailable.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link to={`/matches/${matchId}`} className="text-sm font-medium text-purple-900 hover:underline">
            ← Back to match
          </Link>
        </div>

        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-gray-100">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950 px-6 py-6 text-white md:px-8">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">Scorecard</p>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  {scorecard.home_team_name} vs {scorecard.away_team_name}
                </h1>
                <p className="mt-2 text-sm text-white/70">
                  {new Date(scorecard.match_date).toLocaleString()} · {scorecard.venue}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/60">Winner</p>
                <p className="mt-1 text-sm font-semibold">{matchResult}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 bg-gray-50 px-4 py-4 md:px-8">
            <div className="grid gap-3 md:grid-cols-4">
              <StatPill label="Match status" value={scorecard.status} />
              <StatPill label="Total innings" value={innings.length} />
              <StatPill label="Venue" value={scorecard.venue} />
              <StatPill label="Played on" value={new Date(scorecard.match_date).toLocaleDateString()} />
            </div>
          </div>

          <div className="px-4 py-5 md:px-8">
            <div className="mb-5 flex flex-wrap gap-2">
              {innings.map((inning, index) => {
                const active = index === activeInnings
                return (
                  <button
                    key={inning.id}
                    onClick={() => setActiveInnings(index)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    style={active ? { backgroundColor: BRAND } : undefined}
                  >
                    Innings {inning.innings_number} · {inning.batting_team_name}
                  </button>
                )
              })}
            </div>

            {!currentInnings ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-gray-500">
                No innings data available for this match yet.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-4">
                  <StatPill label="Batting team" value={currentInnings.batting_team_name} />
                  <StatPill label="Score" value={`${currentInnings.total_runs}/${currentInnings.total_wickets}`} />
                  <StatPill label="Overs" value={formatOvers(currentInnings.overs)} />
                  <StatPill label="Extras" value={currentInnings.extras} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {innings.map((inning, index) => (
                    <div key={inning.id} className={`rounded-2xl border p-4 shadow-sm ${index === activeInnings ? 'border-purple-400 bg-purple-50/40' : 'border-gray-200 bg-white'}`}>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Innings {inning.innings_number}</p>
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{inning.batting_team_name}</h3>
                          <p className="text-sm text-gray-500">{inning.total_runs}/{inning.total_wickets} in {formatOvers(inning.overs)} overs</p>
                        </div>
                        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {inning.is_complete ? 'Complete' : 'In progress'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">Batting</h2>
                      <span className="text-xs text-gray-500">Players with scorecard entries only</span>
                    </div>
                    <BattingTable performances={battingPlayers} />
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">Bowling</h2>
                      <span className="text-xs text-gray-500">Bench players are omitted</span>
                    </div>
                    <BowlingTable performances={bowlingPlayers} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}