import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('refreshtoken')
  const isLoggedIn = !!token

  const handleLogout = () => {
    localStorage.removeItem('refreshtoken')
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="bg-slate-900 text-white px-6 py-6 flex justify-between items-center mb-4">
      <Link to="/" className="font-bold text-lg">NPL Fantasy</Link>

      <div className="flex gap-8 text-sm">
        <Link to="/" className="hover:text-yellow-400">Home</Link>
        <Link to="/players" className="hover:text-yellow-400">Players</Link>
        <Link to="/matches" className="hover:text-yellow-400">Matches</Link>
        <Link to="/leagues" className="hover:text-yellow-400">Leagues</Link>
        <Link to="/cricket-teams" className="hover:text-yellow-400">Teams</Link>

        {/* Only show these links when logged in */}
        {isLoggedIn && (
          <>
            <Link to="/build-team" className="hover:text-yellow-400">Build Team</Link>
            <Link to="/view-team" className="hover:text-yellow-400">View Team</Link>
            <Link to="/view-points" className="hover:text-yellow-400">View Points</Link>
          </>
        )}
      </div>

      <div className="flex gap-4 items-center text-sm">
        {isLoggedIn ? (
          <button onClick={handleLogout} className="hover:text-red-400">Logout</button>
        ) : (
          <>
            <Link to="/login" className="hover:text-yellow-400">Login</Link>
            <Link
              to="/register"
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar