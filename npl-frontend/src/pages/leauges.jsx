// Leagues.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/navbar";
import { Link } from "react-router-dom";
import  axiosInstance  from '../utilis/axiosInstance'

function Leagues() {
  const [allLeagues, setAllLeagues] = useState([])
  const [myLeagues, setMyLeagues] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tournaments, setTournaments] = useState([])

  // Create league form state
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

  const token = localStorage.getItem('refreshtoken')
  const isLoggedIn = !!token
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => {
    // Fetch leagues and memberships in parallel
    Promise.all([
      axiosInstance.get('/api/leagues/', { headers }),
      isLoggedIn
        ? axiosInstance.get('/api/league-members/', { headers })
            .catch(() => ({ data: { results: [] } }))
        : Promise.resolve({ data: { results: [] } }),
      isLoggedIn
        ? axiosInstance.get('/api/tournaments/', { headers })
        : Promise.resolve({ data: { results: [] } }),
    ])
      .then(([leaguesRes, membersRes, tournamentsRes]) => {
        const leagues = leaguesRes.data.results || leaguesRes.data
        setAllLeagues(leagues)
        setNextPage(leaguesRes.data.next)
        setPrevPage(leaguesRes.data.previous)
        setTournaments(tournamentsRes.data.results || tournamentsRes.data)

        const members = membersRes.data.results || membersRes.data || []
        const myLeagueIds = members.map(m => m.league)
        const currentUserId = token
          ? JSON.parse(atob(token.split('.')[1])).user_id
          : null

        const mine = leagues.filter(l =>
          myLeagueIds.includes(l.id) || l.created_by === currentUserId
        )
        setMyLeagues(mine)
      })
      .catch(error => console.error('Error fetching leagues:', error))
      .finally(() => setLoading(false))
  }, [])

  const goToPage = (url) => {
    if (!url) return
    axios.get(url, { headers })
      .then(res => {
        setAllLeagues(res.data.results || res.data)
        setNextPage(res.data.next)
        setPrevPage(res.data.previous)
      })
      .catch(error => console.error('Error fetching leagues:', error))
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

    // Basic validation
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
          // status defaults to 'open' on the backend
          status: 'open',
          type: form.is_public ? 'public' : 'private',
        },
        { headers }
      )

      // Add newly created league to both lists
      setAllLeagues(prev => [res.data, ...prev])
      setMyLeagues(prev => [res.data, ...prev])

      // Reset form and close modal
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
      // Show first error message from backend
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="grid grid-cols-5 bg-gray-800 text-white text-sm font-semibold p-4">
        <span>League</span>
        <span>Entry Fee</span>
        <span>Prize Pool</span>
        <span>Status</span>
        <span>Members</span>
      </div>
      {leagues.length === 0 ? (
        <p className="text-gray-500 text-sm p-4">No leagues found.</p>
      ) : (
        leagues.map(league => (
          <Link
            key={league.id}
            to={`/leagues/${league.id}`}
            className="grid grid-cols-5 items-center p-4 border-b border-gray-200 hover:bg-gray-50"
          >
            <span className="font-medium text-gray-800 truncate pr-2">{league.name}</span>
            <span className="text-gray-600">{league.entry_fee}</span>
            <span className="text-gray-600">{league.prize_pool}</span>
            <span className={`font-medium ${league.status === 'open' ? 'text-green-600' : 'text-gray-500'}`}>
              {league.status}
            </span>
            <span className="text-blue-600 font-bold">
              {league.member_count}/{league.max_members}
            </span>
          </Link>
        ))
      )}
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <p className="p-8">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Navbar />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NPL Leagues</h1>
        {/* Only show Create League button when logged in */}
        {isLoggedIn && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm"
          >
            + Create League
          </button>
        )}
      </div>

      {/* Tab toggle */}
      {isLoggedIn && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Leagues
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === 'my'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            My Leagues
          </button>
        </div>
      )}

      <LeagueTable leagues={activeTab === 'all' ? allLeagues : myLeagues} />

      {activeTab === 'all' && (
        <div className="flex justify-between mt-4">
          <button
            disabled={!prevPage}
            onClick={() => goToPage(prevPage)}
            className="disabled:opacity-30"
          >
            Previous
          </button>
          <button
            disabled={!nextPage}
            onClick={() => goToPage(nextPage)}
            className="disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}

      {/* Create League Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create League</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateError(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {createError && (
              <p className="text-red-500 text-sm mb-4">{createError}</p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">League Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Friends League"
                  className="mt-1 border border-gray-300 rounded px-3 py-2 w-full text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tournament *</label>
                <select
                  name="tournament"
                  value={form.tournament}
                  onChange={handleFormChange}
                  className="mt-1 border border-gray-300 rounded px-3 py-2 w-full text-sm"
                >
                  <option value="">Select tournament</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Entry Fee</label>
                  <input
                    type="number"
                    name="entry_fee"
                    value={form.entry_fee}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                    className="mt-1 border border-gray-300 rounded px-3 py-2 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Prize Pool</label>
                  <input
                    type="number"
                    name="prize_pool"
                    value={form.prize_pool}
                    onChange={handleFormChange}
                    placeholder="0"
                    min="0"
                    className="mt-1 border border-gray-300 rounded px-3 py-2 w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Max Members *</label>
                <input
                  type="number"
                  name="max_members"
                  value={form.max_members}
                  onChange={handleFormChange}
                  placeholder="e.g. 20"
                  min="2"
                  className="mt-1 border border-gray-300 rounded px-3 py-2 w-full text-sm"
                />
              </div>

              {/* Public/Private toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">Public League</p>
                  <p className="text-xs text-gray-500">
                    {form.is_public
                      ? 'Anyone can join with one click'
                      : 'Members join via invite code only'}
                  </p>
                </div>
                <button
                  onClick={() => setForm(prev => ({ ...prev, is_public: !prev.is_public }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    form.is_public ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    form.is_public ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateError(null)
                }}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
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