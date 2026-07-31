// Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar'
import TeamNameModal from '../components/Teamnamemodel'
import axiosInstance from '../utilis/axiosInstance'

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [upcomingMatch, setUpcomingMatch] = useState(null)
  const [pastMatches, setPastMatches] = useState([])
  const [topLeagues, setTopLeagues] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [cricketTeams, setCricketTeams] = useState({})
  const [fantasyTeams, setFantasyTeams] = useState([]) // raw list, used to derive hasTeam per-match
  const [seasonPoints, setSeasonPoints] = useState(0)
  const [latestPoints, setLatestPoints] = useState(0)
  const [myLeagues, setMyLeagues] = useState([])
  const [topNews, setTopNews] = useState([])
  const [loading, setLoading] = useState(true)

  // Favorites — used to highlight relevant content, pulled from the same
  // /api/users/me/ call that checks whether the team-name modal is needed
  const [favoriteTeamId, setFavoriteTeamId] = useState(null)
  const [favoritePlayerIds, setFavoritePlayerIds] = useState([])
  const [showTeamNameModal, setShowTeamNameModal] = useState(false)

  const navigate = useNavigate()
  const BRAND = '#38003c'

  useEffect(() => {
    // NOTE: confirm this matches whatever key your login flow actually
    // stores the access token under (GoogleLoginCompleteView sends
    // ?access=...&refresh=... — check your regular email/password login
    // path stores it under the same 'access' key).
    const token = localStorage.getItem('refreshtoken')
    setIsLoggedIn(!!token)

    // Public fetches — run for everyone, logged in or not
    Promise.all([
      axiosInstance.get('/api/matches/'),
      axiosInstance.get('/api/cricket-teams/'),
      axiosInstance.get('/api/leagues/'),
      axiosInstance.get('/api/players/?ordering=-credit_value'),
      axiosInstance.get('/api/news/?ordering=-published_at&page_size=3'),
    ])
      .then(([matchesRes, teamsRes, leaguesRes, playersRes, newsRes]) => {
        const allMatches = matchesRes.data.results || matchesRes.data
        const teamList = teamsRes.data.results || teamsRes.data
        const leagues = leaguesRes.data.results || leaguesRes.data
        const players = playersRes.data.results || playersRes.data
        const news = newsRes.data.results || newsRes.data

        const teamMap = {}
        teamList.forEach(t => { teamMap[t.id] = t.name })
        setCricketTeams(teamMap)

        const now = new Date()

        const eligible = allMatches
          .filter(m => now < new Date(m.match_date) - 30 * 60 * 1000)
          .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
        setUpcomingMatch(eligible[0] || null)

        const past = allMatches
          .filter(m => now >= new Date(m.match_date) - 30 * 60 * 1000)
          .sort((a, b) => new Date(b.match_date) - new Date(a.match_date))
          .slice(0, 3)
        setPastMatches(past)

        const sorted = [...leagues]
          .sort((a, b) => b.prize_pool - a.prize_pool)
          .slice(0, 3)
        setTopLeagues(sorted)

        setTopPlayers(players.slice(0, 5))
        setTopNews(news.slice(0, 3))
      })
      .catch(err => console.error('Error loading dashboard:', err))

    // Personal fetches — logged-in users only
    if (token) {
      // Profile fetch — checks whether the one-time team name prompt is
      // needed, and pulls favorites for highlighting content below
      axiosInstance.get('/api/users/me/')
        .then(res => {
          if (!res.data.team_name) {
            setShowTeamNameModal(true)
          }
          setFavoriteTeamId(res.data.favorite_team || null)
          setFavoritePlayerIds(res.data.favorite_players || [])
        })
        .catch(err => console.error('Error checking user profile:', err))

      Promise.all([
        axiosInstance.get('/api/fantasy-teams/'),
        axiosInstance.get('/api/league-members/')
          .catch(() => ({ data: { results: [] } })),
      ])
        .then(([fantasyTeamsRes, membersRes]) => {
          const teams = fantasyTeamsRes.data.results || fantasyTeamsRes.data
          const members = membersRes.data.results || membersRes.data || []

          setFantasyTeams(teams)

          const total = teams.reduce((sum, t) => sum + (t.total_points || 0), 0)
          setSeasonPoints(total)

          if (teams.length > 0) {
            const sortedByMatchDate = [...teams].sort(
              (a, b) => new Date(b.match_date || 0) - new Date(a.match_date || 0)
            )
            setLatestPoints(sortedByMatchDate[0].total_points || 0)
          }

          const myLeagueIds = members.map(m => m.league)
          const currentUserId = JSON.parse(atob(token.split('.')[1])).user_id

          axiosInstance.get('/api/leagues/')
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

  // Derived, not stored — always reflects the *current* upcomingMatch and
  // fantasyTeams, so it can't go stale the way a separately-set boolean can.
  // If your API returns `match` as a nested object instead of a raw id,
  // change the comparison below to `t.match.id === upcomingMatch.id`.
  const hasTeamForUpcomingMatch = upcomingMatch
    ? fantasyTeams.some(t => t.match === upcomingMatch.id)
    : false

  // Does the upcoming match involve the user's favorite team?
  const upcomingMatchIsFavorite = upcomingMatch && favoriteTeamId
    ? upcomingMatch.home_team === favoriteTeamId || upcomingMatch.away_team === favoriteTeamId
    : false

  const StatCard = ({ label, value, sub }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )

  const MatchCard = ({ match, badge }) => {
    const isFavoriteMatch = favoriteTeamId &&
      (match.home_team === favoriteTeamId || match.away_team === favoriteTeamId)

    return (
      <Link
        to={`/matches/${match.id}`}
        className={`block bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
          isFavoriteMatch ? 'border-yellow-300 ring-1 ring-yellow-200' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {badge && (
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          {isFavoriteMatch && (
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
              ★ Favorite Team
            </span>
          )}
        </div>
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
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <p className="p-8">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Navbar />

      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0, transparent 30%), radial-gradient(circle at 80% 10%, rgba(255,215,0,0.18) 0, transparent 22%)' }} />
        <div className="relative px-8 py-14 max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-white/80 uppercase">
              NPL Fantasy Cricket
            </p>
            <h1 className="mt-4 text-4xl md:text-5xl font-black leading-tight">
              Follow the league, build smarter teams, and track every point.
            </h1>
            <p className="mt-4 max-w-2xl text-white/70 text-base md:text-lg">
              Live match cards, fantasy points, news, and league standings in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!isLoggedIn ? (
                <>
                  <Link
                    to="/register"
                    className="bg-yellow-400 text-slate-950 px-5 py-3 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/"
                    className="bg-white/10 text-white px-5 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors"
                  >
                    Login
                  </Link>
                </>
              ) : (
                <>
                
                  <Link
                    to="/build-team"
                    className="bg-yellow-400 text-slate-950 px-5 py-3 rounded-full font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    Build Team
                  </Link>
                  <Link
                    to="/view-team"
                    className="bg-white/10 text-white px-5 py-3 rounded-full font-semibold hover:bg-white/20 transition-colors"
                  >
                    View My Team
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-white/10 backdrop-blur border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.24em] text-white/60">Today's feature</p>
                {upcomingMatchIsFavorite && (
                  <span className="text-xs bg-yellow-400/20 text-yellow-300 font-semibold px-2 py-0.5 rounded-full border border-yellow-400/40">
                    ★ Your Team
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/60">Upcoming Match</p>
                  <p className="text-xl font-bold">{upcomingMatch ? `${cricketTeams[upcomingMatch.home_team] || '...'} vs ${cricketTeams[upcomingMatch.away_team] || '...'}` : 'No upcoming match'}</p>
                </div>
                <div className="rounded-2xl bg-black/20 px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-wide text-white/50">Team status</p>
                  <p className="text-sm font-semibold">{hasTeamForUpcomingMatch ? 'Team Saved' : 'No Team Yet'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white text-slate-900 p-5 shadow-lg">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Season Points</p>
                <p className="mt-2 text-3xl font-black">{seasonPoints}</p>
              </div>
              <div className="rounded-3xl bg-yellow-400 text-slate-950 p-5 shadow-lg">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-700">Latest Match</p>
                <p className="mt-2 text-3xl font-black">{latestPoints}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 max-w-6xl mx-auto md:px-8">

        {isLoggedIn && (
          <div className="mb-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-xl font-bold mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Season Total" value={`${seasonPoints} pts`} />
              <StatCard label="Latest Match" value={`${latestPoints} pts`} />
              <StatCard label="My Leagues" value={myLeagues.length} sub="leagues joined or created" />
              <StatCard
                label="Team Status"
                value={hasTeamForUpcomingMatch ? '✓ Team Saved' : 'No Team Yet'}
                sub={upcomingMatch ? `for upcoming match` : 'no upcoming match'}
              />
            </div>

            {myLeagues.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 p-5 mb-6 shadow-sm">
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

        <h2 className="text-xl font-bold mb-4">Upcoming Match</h2>
        {upcomingMatch ? (
          <div className="mb-10">
            <MatchCard match={upcomingMatch} badge="Team Selection Open" />
          </div>
        ) : (
          <p className="text-gray-500 mb-10">No upcoming matches right now.</p>
        )}

        <Link
          to="/rules"
          className="block mb-10 rounded-2xl border border-dashed p-5 hover:shadow-md transition-shadow"
          style={{ borderColor: BRAND }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Want to play? Learn the rules</p>
              <p className="text-sm text-gray-500 mt-1">
                Squad rules, scoring system, deadlines — everything explained.
              </p>
            </div>
            <span className="text-sm font-semibold" style={{ color: BRAND }}>Learn Rules →</span>
          </div>
        </Link>

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

        {topPlayers.length > 0 && (
          <div className="mb-10 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
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
              {topPlayers.map(player => {
                const isFavoritePlayer = favoritePlayerIds.includes(player.id)
                return (
                  <div
                    key={player.id}
                    className={`grid grid-cols-4 items-center p-4 border-b border-gray-100 ${
                      isFavoritePlayer ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <span className="font-medium flex items-center gap-1.5">
                      {isFavoritePlayer && <span className="text-yellow-500">★</span>}
                      {player.name}
                    </span>
                    <span className="text-gray-600 text-sm">{player.role}</span>
                    <span className="text-gray-600 text-sm">{player.team_name || '—'}</span>
                    <span className="text-blue-600 font-bold">{player.credit_value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Top News</h2>
          <Link to="/news" className="text-blue-600 text-sm hover:underline">View all →</Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {topNews.length > 0 ? topNews.map(item => (
            <Link
              key={item.id}
              to={`/news/${item.id}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="h-40 w-full object-cover" />
              )}
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{item.source_name}</p>
                <h3 className="mt-2 text-base font-bold text-gray-900 group-hover:text-purple-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{item.summary}</p>
              </div>
            </Link>
          )) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
              No news available yet.
            </div>
          )}
        </div>

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

      {showTeamNameModal && (
        <TeamNameModal onSaved={() => setShowTeamNameModal(false)} />
      )}
    </div>
  )
}