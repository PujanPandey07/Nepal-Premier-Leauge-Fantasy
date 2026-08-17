import React, { useState, useEffect, useMemo } from 'react';

// ==========================================
// SUB-COMPONENTS (Defined outside to prevent DOM re-mounting)
// ==========================================

const LeagueTable = ({ leagues, userId, onView, onJoin, joiningId }) => {
  if (!leagues || leagues.length === 0) {
    return <div className="text-gray-500 py-4">No leagues found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
            <th className="py-3 px-4">League Name</th>
            <th className="py-3 px-4">Your Points</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {leagues.map((league) => {
            // String comparison avoids type mismatches (e.g. number vs string IDs)
            const currentUserMember = league.members?.find(
              (m) => String(m.user) === String(userId)
            );
            const isMember = Boolean(currentUserMember);
            const points = currentUserMember ? currentUserMember.points : 0;

            return (
              <tr key={league.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium">{league.name}</td>
                <td className="py-3 px-4">{isMember ? `${points} pts` : '-'}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button
                    onClick={() => onView && onView(league)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                  >
                    View
                  </button>
                  {!isMember && onJoin && (
                    <button
                      onClick={() => onJoin(league.id)}
                      disabled={joiningId === league.id}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs disabled:opacity-50 transition-colors"
                    >
                      {joiningId === league.id ? 'Joining...' : 'Join'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const LeaderboardTable = ({ entries, loading }) => {
  if (loading) {
    return <div className="py-4 text-gray-500">Loading leaderboard...</div>;
  }

  if (!entries || entries.length === 0) {
    return <div className="py-4 text-gray-500">No leaderboard entries available.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
            <th className="py-3 px-4">Rank</th>
            <th className="py-3 px-4 font-medium">Participant</th>
            <th className="py-3 px-4 text-right">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {entries.map((entry, index) => (
            <tr key={entry.id || index} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-bold text-gray-700">#{index + 1}</td>
              <td className="py-3 px-4 font-medium">{entry.username || entry.name}</td>
              <td className="py-3 px-4 text-right font-semibold">{entry.points} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==========================================
// MAIN LEAGUES COMPONENT
// ==========================================

export default function Leagues({ userId }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my' | 'leaderboard'
  const [allLeagues, setAllLeagues] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  // Derived State: Memoized filtering keeps "My Leagues" updated automatically
  const myLeagues = useMemo(() => {
    return allLeagues.filter((league) =>
      league.members?.some((m) => String(m.user) === String(userId))
    );
  }, [allLeagues, userId]);

  // Initial Fetching (Connect to your existing API logic)
  useEffect(() => {
    // Example API fetch triggers:
    // fetchLeagues().then(setAllLeagues);
    // fetchTournaments().then(setTournaments);
  }, []);

  // Auto-select the first available tournament when tournaments load
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTournament) {
      setSelectedTournament(tournaments[0].id);
    }
  }, [tournaments, selectedTournament]);

  // Fetch leaderboard entries when the selected tournament changes or tab becomes active
  useEffect(() => {
    if (!selectedTournament || activeTab !== 'leaderboard') return;

    setLoadingLeaderboard(true);
    // Example Leaderboard Fetch:
    // fetchLeaderboardData(selectedTournament)
    //   .then((data) => setLeaderboard(data))
    //   .finally(() => setLoadingLeaderboard(false));
  }, [selectedTournament, activeTab]);

  const handleJoinLeague = async (leagueId) => {
    setJoiningId(leagueId);
    try {
      // Connect your join API logic here
      // await joinLeagueApi(leagueId);
    } catch (err) {
      console.error('Failed to join league:', err);
    } finally {
      setJoiningId(null);
    }
  };

  const handleViewLeague = (league) => {
    // Connect your view/modal handler here
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Leagues
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'my'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Leagues ({myLeagues.length})
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'leaderboard'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Leaderboards
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'all' && (
        <LeagueTable
          leagues={allLeagues}
          userId={userId}
          onView={handleViewLeague}
          onJoin={handleJoinLeague}
          joiningId={joiningId}
        />
      )}

      {activeTab === 'my' && (
        <LeagueTable
          leagues={myLeagues}
          userId={userId}
          onView={handleViewLeague}
          onJoin={handleJoinLeague}
          joiningId={joiningId}
        />
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label htmlFor="tournament-select" className="text-sm font-medium text-gray-700">
              Select Tournament:
            </label>
            <select
              id="tournament-select"
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tournaments.length === 0 && <option value="">No tournaments found</option>}
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <LeaderboardTable entries={leaderboard} loading={loadingLeaderboard} />
        </div>
      )}
    </div>
  );
}