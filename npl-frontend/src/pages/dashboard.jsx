// Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/navbar'

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [upcomingMatch, setUpcomingMatch] = useState(null)
  const [pastMatches, setPastMatches] = useState([])
  const [topLeagues, setTopLeagues] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [cricketTeams, setCricketTeams] = useState({})
  const [hasTeam, setHasTeam] = useState(false)
  const [seasonPoints, setSeasonPoints] = useState(0)
  const [latestPoints, setLatestPoints] = useState(0)
  const [myLeagues, setMyLeagues] = useState([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    // These fetches run for everyone — public info
    Promise.all([
      axios.get('http://localhost:8000/api/matches/'),
      axios.get('http://localhost:8000/api/cricket-teams/'),
      axios.get('http://localhost:8000/api/leagues/'),
      axios.get('http://localhost:8000/api/players/?ordering=-credit_value'),
    ])
      .then(([matchesRes, teamsRes, leaguesRes, playersRes]) => {
        const allMatches = matchesRes.data.results || matchesRes.data
        const teamList = teamsRes.data.results || teamsRes.data
        const leagues = leaguesRes.data.results || leaguesRes.data
        const players = playersRes.data.results || playersRes.data

        // Build cricket team id -> name map
        const teamMap = {}
        teamList.forEach(t => { teamMap[t.id] = t.name })
        setCricketTeams(teamMap)

        const now = new Date()

        // Find the single closest upcoming match with open deadline
        const eligible = allMatches
          .filter(m => now < new Date(m.match_date) - 30 * 60 * 1000)
          .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
        setUpcomingMatch(eligible[0] || null)

        // Last 3 past matches
        const past = allMatches
          .filter(m => now >= new Date(m.match_date) - 30 * 60 * 1000)
          .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
          .slice(0, 3)
        setPastMatches(past)

        // Top 3 leagues by prize pool
        const sorted = [...leagues]
          .sort((a, b) => b.prize_pool - a.prize_pool)
          .slice(0, 3)
        setTopLeagues(sorted)

        // Top 5 players by credit value
        setTopPlayers(players.slice(0, 5))
      })
      .catch(err => console.error('Error loading dashboard:', err))

    // These fetches only run for logged-in users
    if (token) {
      Promise.all([
        axios.get('http://localhost:8000/api/fantasy-teams/', { headers }),
        axios.get('http://localhost:8000/api/league-members/', { headers })
          .catch(() => ({ data: { results: [] } })),
      ])
        .then(([fantasyTeamsRes, membersRes]) => {
          const fantasyTeams = fantasyTeamsRes.data.results || fantasyTeamsRes.data
          const members = membersRes.data.results || membersRes.data || []

          // Season total points
          const total = fantasyTeams.reduce((sum, t) => sum + (t.total_points || 0), 0)
          setSeasonPoints(total)

          // Latest match points — most recently created fantasy team
          if (fantasyTeams.length > 0) {
            const latest = fantasyTeams[fantasyTeams.length - 1]
            setLatestPoints(latest.total_points || 0)
          }

          // Check if user has a team for the upcoming match
          // (we set upcomingMatch above but it may not be in state yet —
          // we'll handle this check in render using fantasyTeams directly)
          // Store fantasy teams in state for the check below
          setHasTeam(fantasyTeams.length > 0)

          // My leagues — get league ids from memberships
          const myLeagueIds = members.map(m => m.league)
          const currentUserId = JSON.parse(atob(token.split('.')[1])).user_id

          axios.get('http://localhost:8000/api/leagues/', { headers })
            .then(res => {
              const all = res.data.results || res.data
              const mine = all.filter(l =>
                myLeagueIds.includes(l.id) || l.created_by === currentUserId
              )
              setMyLeagues(mine)
            })
        })
        .catch(err => console.error('Error loading personal dashboard:', err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Small reusable stat card
  const StatCard = ({ label, value, sub }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )

  // Small match card used in both upcoming and past sections
  const MatchCard = ({ match, badge }) => (
    <Link
      to={`/matches/${match.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      {badge && (
        <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <p className="font-semibold mt-2">
        {cricketTeams[match.home_team] || '...'} vs {cricketTeams[match.away_team] || '...'}
      </p>
      <p className="text-sm text-gray-500 mt-1">{match.venue}</p>
      <p className="text-sm text-gray-500">
        {new Date(match.match_date).toLocaleString()}
      </p>
      {match.result && (
        <p className="text-sm text-gray-700 font-medium mt-1">Result: {match.result}</p>
      )}
    </Link>
  )

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <p className="p-8">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero section */}
      <div className="bg-slate-900 text-white px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">NPL Fantasy Cricket</h1>
        <p className="text-gray-400 mb-6">
          Build your fantasy team, compete in leagues, and win prizes.
        </p>
        {!isLoggedIn && (
          <div className="flex gap-3">
            <Link
              to="/register"
              className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              Get Started
            </Link>
            <Link
              to="/"
              className="bg-white text-slate-900 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              Login
            </Link>
          </div>
        )}
        {isLoggedIn && (
          <div className="flex gap-3">
            <Link
              to="/build-team"
              className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              Build Team
            </Link>
            <Link
              to="/view-team"
              className="bg-white text-slate-900 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              View My Team
            </Link>
          </div>
        )}
      </div>

      <div className="px-8 py-8 max-w-5xl mx-auto">

        {/* Personal section — logged in only */}
        {isLoggedIn && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Season Total"
                value={`${seasonPoints} pts`}
              />
              <StatCard
                label="Latest Match"
                value={`${latestPoints} pts`}
              />
              <StatCard
                label="My Leagues"
                value={myLeagues.length}
                sub="leagues joined or created"
              />
              <StatCard
                label="Team Status"
                value={hasTeam ? '✓ Team Saved' : 'No Team Yet'}
                sub={upcomingMatch ? `for upcoming match` : 'no upcoming match'}
              />
            </div>

            {/* My leagues quick list */}
            {myLeagues.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold">My Leagues</p>
                  <Link to="/leagues" className="text-blue-600 text-sm hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="space-y-2">
                  {myLeagues.slice(0, 3).map(league => (
                    <Link
                      key={league.id}
                      to={`/leagues/${league.id}`}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <span className="font-medium text-sm">{league.name}</span>
                      <span className="text-xs text-gray-500">
                        {league.member_count}/{league.max_members} members
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upcoming match — everyone sees this */}
        <h2 className="text-xl font-bold mb-4">Upcoming Match</h2>
        {upcomingMatch ? (
          <div className="mb-10">
            <MatchCard match={upcomingMatch} badge="Team Selection Open" />
          </div>
        ) : (
          <p className="text-gray-500 mb-10">No upcoming matches right now.</p>
        )}

        {/* Recent results */}
        {pastMatches.length > 0 && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Results</h2>
              <Link to="/matches" className="text-blue-600 text-sm hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pastMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Top leagues */}
        {topLeagues.length > 0 && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Top Leagues</h2>
              <Link to="/leagues" className="text-blue-600 text-sm hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topLeagues.map(league => (
                <Link
                  key={league.id}
                  to={isLoggedIn ? `/leagues/${league.id}` : '/'}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold">{league.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Prize Pool: {league.prize_pool}
                  </p>
                  <p className="text-sm text-gray-500">
                    {league.member_count}/{league.max_members} members
                  </p>
                  <span className={`text-xs font-semibold mt-2 inline-block ${
                    league.is_public ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {league.is_public ? 'Public' : 'Private'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Top players */}
        {topPlayers.length > 0 && (
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Top Players</h2>
              <Link to="/players" className="text-blue-600 text-sm hover:underline">
                View all →
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-4 bg-gray-800 text-white text-sm font-semibold p-4">
                <span>Player</span>
                <span>Role</span>
                <span>Team</span>
                <span>Credits</span>
              </div>
              {topPlayers.map(player => (
                <div
                  key={player.id}
                  className="grid grid-cols-4 items-center p-4 border-b border-gray-100"
                >
                  <span className="font-medium">{player.name}</span>
                  <span className="text-gray-600 text-sm">{player.role}</span>
                  <span className="text-gray-600 text-sm">{player.team_name || '—'}</span>
                  <span className="text-blue-600 font-bold">{player.credit_value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links for logged out users */}
        {!isLoggedIn && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-gray-600 mb-4">
              Login or register to build your fantasy team, join leagues, and track your points.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/"
                className="bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-slate-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Register
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}