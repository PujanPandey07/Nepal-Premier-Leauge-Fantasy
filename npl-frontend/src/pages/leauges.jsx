import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { Link } from "react-router-dom";
import axiosInstance from '../utilis/axiosInstance'
import { useAuth } from '../context/AuthContext'

function Leagues() {
  const { isLoggedIn, userId } = useAuth()
  const [allLeagues, setAllLeagues] = useState([])
  const [myLeagues, setMyLeagues] = useState([])
  const [members, setMembers] = useState([])
  const [fantasyTeamMap, setFantasyTeamMap] = useState({})
  const [userData, setUserData] = useState({})
  const [activeTab, setActiveTab] = useState('all')
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tournaments, setTournaments] = useState([])

  // ── Leaderboard state ──────────────────────────────
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardTournament, setLeaderboardTournament] = useState('')
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboardNext, setLeaderboardNext] = useState(null)
  const [leaderboardPrev, setLeaderboardPrev] = useState(null)

  const [form, setForm] = useState({
    name: '',
    tournament: '',
    entry_fee: '',
    prize_pool: '',
    max_members: '',
    is_public: true,
  })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/api/leagues/'),
      isLoggedIn
        ? axiosInstance.get('/api/league-members/').catch(() => ({ data: { results: [] } }))
        : Promise.resolve({ data: { results: [] } }),
      isLoggedIn
        ? axiosInstance.get('/api/tournaments/')
        : Promise.resolve({ data: { results: [] } }),
      isLoggedIn
        ? axiosInstance.get('/api/fantasy-teams/').catch(() => ({ data: { results: [] } }))
        : Promise.resolve({ data: { results: [] } }),
      isLoggedIn
        ? axiosInstance.get('/api/users/me/').catch(() => ({ data: {} }))
        : Promise.resolve({ data: {} }),
    ])
      .then(([leaguesRes, membersRes, tournamentsRes, fantasyTeamsRes, meRes]) => {
        const leagues = leaguesRes.data.results || leaguesRes.data
        setAllLeagues(leagues)
        setNextPage(leaguesRes.data.next)
        setPrevPage(leaguesRes.data.previous)

        const tourneyList = tournamentsRes.data.results || tournamentsRes.data || []
        setTournaments(tourneyList)

        const membersList = membersRes.data.results || membersRes.data || []
        setMembers(membersList)
        const myLeagueIds = membersList.map(m => m.league)

        const fantasyTeams = fantasyTeamsRes.data.results || fantasyTeamsRes.data || []
        const me = meRes.data || {}
        const teamMap = {}
        fantasyTeams.forEach(t => { teamMap[t.id] = t })

        const mine = leagues.filter(l =>
          myLeagueIds.includes(l.id) || l.created_by === userId
        )
        setMyLeagues(mine)
        setFantasyTeamMap(teamMap)
        setUserData(me)
      })
      .catch(error => console.error('Error fetching leagues:', error))
      .finally(() => setLoading(false))
  }, [isLoggedIn, userId])

  // ── Fetch leaderboard when tab or tournament changes ──
  useEffect(() => {
    if (activeTab !== 'leaderboard') return
    if (!leaderboardTournament) {
      setLeaderboard([])
      return
    }

    setLeaderboardLoading(true)
    axiosInstance.get(`/api/leaderboard/?tournament=${leaderboardTournament}`)
      .then(res => {
        setLeaderboard(res.data.results || [])
        setLeaderboardNext(res.data.next)
        setLeaderboardPrev(res.data.previous)
      })
      .catch(err => {
        console.error('Error fetching leaderboard:', err)
        setLeaderboard([])
      })
      .finally(() => setLeaderboardLoading(false))
  }, [activeTab, leaderboardTournament])

  const goToPage = (url) => {
    if (!url) return
    axiosInstance.get(url)
      .then(res => {
        setAllLeagues(res.data.results || res.data)
        setNextPage(res.data.next)
        setPrevPage(res.data.previous)
      })
      .catch(error => console.error('Error fetching leagues:', error))
  }

  const goToLeaderboardPage = (url) => {
    if (!url) return
    setLeaderboardLoading(true)
    axiosInstance.get(url)
      .then(res => {
        setLeaderboard(res.data.results || [])
        setLeaderboardNext(res.data.next)
        setLeaderboardPrev(res.data.previous)
      })
      .catch(err => console.error('Error fetching leaderboard:', err))
      .finally(() => setLeaderboardLoading(false))
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleCreate = async () => {
    setCreating(true)
    setCreateError(null)

    if (!form.name || !form.tournament || !form.max_members) {
      setCreateError('Name, tournament and max members are required.')
      setCreating(false)
      return
    }

    try {
      const res = await axiosInstance.post(
        '/api/leagues/',
        {
          name: form.name,
          tournament: form.tournament,
          entry_fee: form.entry_fee || 0,
          prize_pool: form.prize_pool || 0,
          max_members: parseInt(form.max_members),
          is_public: form.is_public,
          status: 'open',
          type: form.is_public ? 'public' : 'private',
        }
      )

      setAllLeagues(prev => [res.data, ...prev])
      setMyLeagues(prev => [res.data, ...prev])

      setForm({
        name: '',
        tournament: '',
        entry_fee: '',
        prize_pool: '',
        max_members: '',
        is_public: true,
      })
      setShowCreateModal(false)
    } catch (err) {
      const errData = err.response?.data
      setCreateError(
        typeof errData === 'object'
          ? Object.values(errData)[0]
          : 'Failed to create league'
      )
    } finally {
      setCreating(false)
    }
  }

  const LeagueTable = ({ leagues }) => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="min-w-[650px]">
        <div className="grid grid-cols-6 bg-gray-900 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white">
          <span>League</span>
          <span>Entry Fee</span>
          <span>Prize Pool</span>
          <span>Status</span>
          <span>Members</span>
          <span className="text-right">Your Points</span>
        </div>
        {leagues.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No leagues found.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leagues.map(league => (
              <Link
                key={league.id}
                to={`/leagues/${league.id}`}
                className="grid grid-cols-6 items-center px-6 py-4 text-sm transition-colors hover:bg-gray-50 gap-4"
              >
                <div className="truncate pr-2">
                  <div className="font-semibold text-gray-900 truncate">{league.name}</div>
                  <div className="text-xs text-gray-500 truncate">{league.tournament?.name || 'Standard'}</div>
                </div>

                <div className="font-medium text-gray-700">
                  {league.entry_fee ? `Rs. ${league.entry_fee}` : 'Free'}
                </div>

                <div className="font-medium text-emerald-600">
                  {league.prize_pool ? `Rs. ${league.prize_pool}` : '—'}
                </div>

                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    league.status === 'open' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {league.status}
                  </span>
                </div>

                <div className="font-semibold text-indigo-600">
                  {league.member_count}/{league.max_members}
                </div>

                <div className="text-right font-bold text-gray-900">
                  {(() => {
                    const member = members.find(m => m.league === league.id && (m.user === userId || league.created_by === userId))
                    return member ? (member.points || 0) : '—'
                  })()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const LeaderboardTable = () => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="min-w-[600px]">
        <div className="grid grid-cols-5 bg-gray-900 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Teams Played</span>
          <span className="text-right">Total Points</span>
          <span className="text-right">Status</span>
        </div>
        {leaderboardLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {leaderboardTournament ? 'No players found for this season.' : 'Select a tournament to view the leaderboard.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leaderboard.map((player) => (
              <div
                key={player.id}
                className={`grid grid-cols-5 items-center px-6 py-4 text-sm gap-4 transition-colors ${
                  player.id === userId ? 'bg-indigo-50/60' : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-base text-gray-800">
                  {player.rank === 1 ? '🥇 1' : player.rank === 2 ? '🥈 2' : player.rank === 3 ? '🥉 3' : `#${player.rank}`}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{player.name}</div>
                  <div className="text-xs text-gray-500">{player.email}</div>
                </div>
                <div className="text-right text-gray-600 font-medium">{player.teams_played}</div>
                <div className="text-right font-bold font-mono text-indigo-900 text-base">{player.total_fantasy_points}</div>
                <div className="text-right">
                  {player.id === userId ? (
                    <span className="inline-block text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">You</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex items-center justify-center">
        <p className="text-gray-500 font-medium animate-pulse">Loading leagues...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">NPL Leagues</h1>
            <p className="text-sm text-gray-500 mt-1">Join public contests or compete in private friend leagues</p>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 text-sm shadow-sm transition-colors"
            >
              + Create League
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Leagues
          </button>
          {isLoggedIn && (
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'my'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              My Leagues
            </button>
          )}
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-fit">
              <label className="text-sm font-semibold text-gray-700">Select Season:</label>
              <select
                value={leaderboardTournament}
                onChange={(e) => setLeaderboardTournament(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Choose a tournament —</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <LeaderboardTable />

            {(leaderboardNext || leaderboardPrev) && (
              <div className="flex justify-between items-center mt-4">
                <button
                  disabled={!leaderboardPrev}
                  onClick={() => goToLeaderboardPage(leaderboardPrev)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  ← Previous
                </button>
                <button
                  disabled={!leaderboardNext}
                  onClick={() => goToLeaderboardPage(leaderboardNext)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Leagues Tabs */}
        {activeTab !== 'leaderboard' && (
          <>
            <LeagueTable leagues={activeTab === 'all' ? allLeagues : myLeagues} />

            {activeTab === 'all' && (nextPage || prevPage) && (
              <div className="flex justify-between items-center mt-4">
                <button
                  disabled={!prevPage}
                  onClick={() => goToPage(prevPage)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={!nextPage}
                  onClick={() => goToPage(nextPage)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create League Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Create League</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateError(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 mb-4 text-xs font-medium bg-red-50 text-red-600 rounded-lg border border-red-100">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">League Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Friends League"
                  className="mt-1 border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Tournament *</label>
                <select
                  name="tournament"
                  value={form.tournament}
                  onChange={handleFormChange}
                  className="mt-1 border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="">Select tournament</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Entry Fee</label>
                  <input
                    type="number"
                    name="entry_fee"
                    value={form.entry_fee}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                    className="mt-1 border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Prize Pool</label>
                  <input
                    type="number"
                    name="prize_pool"
                    value={form.prize_pool}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                    className="mt-1 border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Max Members *</label>
                <input
                  type="number"
                  name="max_members"
                  value={form.max_members}
                  onChange={handleFormChange}
                  placeholder="e.g. 20"
                  min="2"
                  className="mt-1 border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Public League</p>
                  <p className="text-xs text-gray-500">
                    {form.is_public
                      ? 'Anyone can join with one click'
                      : 'Members join via invite code only'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, is_public: !prev.is_public }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.is_public ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    form.is_public ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateError(null)
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {creating ? 'Creating...' : 'Create League'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leagues;