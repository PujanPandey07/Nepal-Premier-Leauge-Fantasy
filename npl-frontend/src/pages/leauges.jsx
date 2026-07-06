// Leagues.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/navbar";
import { Link } from "react-router-dom";

function Leagues() {
  const [allLeagues, setAllLeagues] = useState([])
  const [myLeagues, setMyLeagues] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    // Fetch all leagues and the user's memberships in parallel
    Promise.all([
      axios.get('http://localhost:8000/api/leagues/', { headers }),
      axios.get('http://localhost:8000/api/league-members/', { headers })
        .catch(() => ({ data: { results: [] } }))
    ])
      .then(([leaguesRes, membersRes]) => {
        const leagues = leaguesRes.data.results || leaguesRes.data
        setAllLeagues(leagues)
        setNextPage(leaguesRes.data.next)
        setPrevPage(leaguesRes.data.previous)

        // member rows have a league FK — get those league ids
        const members = membersRes.data.results || membersRes.data || []
        const myLeagueIds = members.map(m => m.league)

        // Also include leagues the user created
        // created_by is returned as a UUID in the response
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
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    axios.get(url, { headers })
      .then(res => {
        setAllLeagues(res.data.results || res.data)
        setNextPage(res.data.next)
        setPrevPage(res.data.previous)
      })
      .catch(error => console.error('Error fetching leagues:', error))
  }

  const LeagueTable = ({ leagues }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-5 bg-gray-800 text-white text-sm font-semibold p-4">
        <span>League</span>
        <span>Entry Fee</span>
        <span>Prize Pool</span>
        <span>Status</span>
        <span>Max Members</span>
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
      <h1 className="text-2xl font-bold mb-6">NPL Leagues</h1>

      {/* Tab toggle */}
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

      {/* Table — switches based on active tab */}
      <LeagueTable leagues={activeTab === 'all' ? allLeagues : myLeagues} />

      {/* Pagination only applies to All Leagues tab */}
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
    </div>
  )
}

export default Leagues;