import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import axiosInstance from "../utilis/axiosInstance";

function Players() {
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  useEffect(() => {
    // Fetch Tournaments for filtering (optional)
    axiosInstance
      .get("/api/tournaments/")
      .then((res) => setTournaments(res.data.results || res.data || []))
      .catch((err) => console.error("Error loading tournaments:", err));
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [selectedTournament]);

  const fetchPlayers = (url = null) => {
    setLoading(true);
    setError(null);

    const endpoint =
      url ||
      `/api/players/${
        selectedTournament ? `?tournament=${selectedTournament}` : ""
      }`;

    axiosInstance
      .get(endpoint)
      .then((res) => {
        // Safe data extraction handling both paginated and non-paginated responses
        const data = res.data.results ? res.data.results : res.data;

        if (Array.isArray(data)) {
          setPlayers(data);
          setNextPage(res.data.next || null);
          setPrevPage(res.data.previous || null);
        } else {
          setPlayers([]);
          console.warn("API response is not an array:", res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching players:", err);
        setError("Failed to load players. Check server connection or API endpoint.");
        setPlayers([]);
      })
      .finally(() => setLoading(false));
  };

  const filteredPlayers = players.filter((player) => {
    const name = player.name || player.full_name || "";
    const team = player.team_name || player.team?.name || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Players</h1>
            <p className="text-sm text-gray-500 mt-1">Browse available players and stats</p>
          </div>

          {/* Search & Tournament Filter */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search player or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-500"
            />

            {tournaments.length > 0 && (
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Tournaments</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Players Grid / Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 animate-pulse font-medium">
            Loading players...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No players found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 text-white text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Player Name</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Team</th>
                  <th className="px-6 py-3.5 text-right">Credits / Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {player.name || player.full_name || "Unnamed Player"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {player.role || player.position || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {player.team_name || player.team?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">
                      {player.credit_value ?? player.credits ?? player.price ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {(nextPage || prevPage) && (
          <div className="flex justify-between items-center mt-6">
            <button
              disabled={!prevPage}
              onClick={() => fetchPlayers(prevPage)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              disabled={!nextPage}
              onClick={() => fetchPlayers(nextPage)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Players;