import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/navbar";
import { Link } from "react-router-dom";

function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const token = localStorage.getItem('token')
    if (!token) return

    const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios.get('http://localhost:8000/api/leagues/', { headers })
      .then(res => {
        setLeagues(res.data.results || res.data);
        setNextPage(res.data.next);
        setPrevPage(res.data.previous);
      })
      .catch(error => console.error('Error fetching leagues:', error));
  }, []);

  const goToPage = (url) => {
    if (!url) return;
    axios.get(url, { headers })
      .then(res => {
        setLeagues(res.data.results || res.data);
        setNextPage(res.data.next);
        setPrevPage(res.data.previous);
      })
      .catch(error => console.error('Error fetching leagues:', error));
  }

  return (
  

    <div className="min-h-screen bg-gray-50 p-8">
      <Navbar />
      <h1 className="text-2xl font-bold mb-6">NPL Leagues</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-5 bg-gray-800 text-white text-sm font-semibold p-4">
          <span>League</span>
          <span>Entry Fee</span>
          <span>Prize Pool</span>
          <span>Status</span>
          <span>Max Members</span>
        </div>

        {leagues.map(league => {
          return (  
          <div
            key={league.id}
            className="grid grid-cols-5 items-center p-4 border-b border-gray-200"
          >
            <Link to={`/leagues/${league.id}`} className="grid grid-cols-5 items-center p-4 hover:bg-gray-50">
            <span className="text-gray-800 font-medium">{league.name}</span>
              
            
            <span className="text-gray-600">{league.entry_fee}</span>
            <span className="text-gray-600">{league.prize_pool}</span>
            <span className="text-gray-600">{league.status}</span>
            <span className="text-blue-600 font-bold">{league.max_members}</span>
            </Link>

          </div>
        )})}
      </div>

      <div className="flex justify-between mt-4">
        <button disabled={!prevPage} onClick={() => goToPage(prevPage)}>Previous</button>
        <button disabled={!nextPage} onClick={() => goToPage(nextPage)}>Next</button>
      </div>
    </div>
  )
}

export default Leagues;