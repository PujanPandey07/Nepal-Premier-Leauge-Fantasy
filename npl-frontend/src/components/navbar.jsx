import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <nav className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center">
      <Link to="/dashboard" className="font-bold text-lg">NPL Fantasy</Link>
      <div className="flex gap-6 text-sm">
        <Link to="/dashboard" className="hover:text-yellow-400">Home</Link>
        <Link to="/players" className="hover:text-yellow-400">Players</Link>
        <Link to="/build-team" className="hover:text-yellow-400">Build Team</Link>
        <Link to="/view-team" className="hover:text-yellow-400">View Team</Link>
        <button onClick={handleLogout} className="hover:text-red-400">Logout</button>
      </div>
    </nav>
  )
}

export default Navbar