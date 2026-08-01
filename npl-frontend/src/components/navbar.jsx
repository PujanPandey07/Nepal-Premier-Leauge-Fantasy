import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axiosInstance from '../utilis/axiosInstance'
import auth, { getAccessToken } from '../utilis/auth'

function Navbar() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAccessToken())
  const [balance, setBalance] = useState(null)

  useEffect(() => {
    let mounted = true
    async function init() {
      if (!getAccessToken()) {
        // try silent refresh — will populate in-memory access token if cookie present
        const res = await auth.tryRefresh()
        if (mounted && res && res.access) setIsLoggedIn(true)
      }

      if (getAccessToken()) {
        try {
          const res = await axiosInstance.get('/api/users/me/')
          if (mounted) setBalance(res.data.wallet_balance)
        } catch (e) {
          // ignore
        }
      }
    }

    init()
    return () => { mounted = false }
  }, [])

  const handleLogout = async () => {
    await auth.logout()
    setIsLoggedIn(false)
    navigate('/login')
  }

  return (
    <nav className="bg-slate-900 text-white px-6 py-6 flex justify-between items-center mb-4">
      <Link to="/" className="font-bold text-lg">NPL Fantasy</Link>

      <div className="flex gap-8 text-sm">
        <Link to="/" className="hover:text-yellow-400">Home</Link>
        <Link to="/players" className="hover:text-yellow-400">Players</Link>
        <Link to="/matches" className="hover:text-yellow-400">Matches</Link>
        <Link to="/news" className="hover:text-yellow-400">News</Link>
        <Link to="/leagues" className="hover:text-yellow-400">Leagues</Link>
        <Link to="/cricket-teams" className="hover:text-yellow-400">Teams</Link>
        {isLoggedIn && (
          <>
            <Link to="/build-team" className="hover:text-yellow-400">Build Team</Link>
            <Link to="/view-team" className="hover:text-yellow-400">View Team</Link>
            <Link to="/view-points" className="hover:text-yellow-400">View Points</Link>
             <Link to="/settings" className="hover:text-yellow-400">My Profile</Link>
          </>
        )}
      </div>

      <div className="flex gap-4 items-center text-sm">
        {isLoggedIn ? (
          <>
            {/* Wallet balance — links to wallet page */}
            <Link
              to="/wallet"
              className="flex items-center gap-1 bg-slate-700 px-3 py-1 rounded-lg hover:bg-slate-600"
            >
              <span className="text-yellow-400 font-bold">NPR</span>
              <span>{balance !== null ? Number(balance).toFixed(2) : '...'}</span>
            </Link>
            <button onClick={handleLogout} className="hover:text-red-400">Logout</button>
          </>
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