import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axiosInstance from '../utilis/axiosInstance'
import auth, { getAccessToken } from '../utilis/auth'

function Navbar() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAccessToken())
  const [balance, setBalance] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    setIsMenuOpen(false)
    navigate('/login')
  }

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className="bg-slate-900 text-white px-4 sm:px-6 py-4 shadow-md sticky top-0 z-50 mb-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link 
          to="/" 
          onClick={closeMenu} 
          className="font-bold text-lg sm:text-xl tracking-tight text-white hover:text-yellow-400 transition-colors"
        >
          NPL Fantasy
        </Link>

        {/* Desktop Navigation Links (hidden on mobile, visible on lg screens) */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          <Link to="/" className="hover:text-yellow-400 transition-colors">Home</Link>
          <Link to="/players" className="hover:text-yellow-400 transition-colors">Players</Link>
          <Link to="/matches" className="hover:text-yellow-400 transition-colors">Matches</Link>
          <Link to="/news" className="hover:text-yellow-400 transition-colors">News</Link>
          <Link to="/leagues" className="hover:text-yellow-400 transition-colors">Leagues</Link>
          <Link to="/cricket-teams" className="hover:text-yellow-400 transition-colors">Teams</Link>
          {isLoggedIn && (
            <>
              <Link to="/build-team" className="hover:text-yellow-400 transition-colors">Build Team</Link>
              <Link to="/view-team" className="hover:text-yellow-400 transition-colors">View Team</Link>
              <Link to="/view-points" className="hover:text-yellow-400 transition-colors">View Points</Link>
              <Link to="/settings" className="hover:text-yellow-400 transition-colors">My Profile</Link>
            </>
          )}
        </div>

        {/* Desktop User Actions */}
        <div className="hidden lg:flex gap-4 items-center text-sm">
          {isLoggedIn ? (
            <>
              <Link
                to="/wallet"
                className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <span className="text-yellow-400 font-bold">NPR</span>
                <span>{balance !== null ? Number(balance).toFixed(2) : '...'}</span>
              </Link>
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-medium transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-yellow-400 transition-colors">Login</Link>
              <Link
                to="/register"
                className="bg-green-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex lg:hidden items-center gap-3">
          {isLoggedIn && (
            <Link
  to="/wallet"
  className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
>
  <span className="font-medium">My Wallet</span>
  <span className="text-yellow-400 font-bold">
    NPR {balance !== null ? Number(balance).toFixed(2) : '...'}
  </span>
</Link>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 mt-4 pt-4 pb-2 space-y-3">
          <div className="flex flex-col space-y-1 text-sm">
            <Link to="/" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">Home</Link>
            <Link to="/players" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">Players</Link>
            <Link to="/matches" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">Matches</Link>
            <Link to="/news" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">News</Link>
            <Link to="/leagues" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">Leagues</Link>
            <Link to="/cricket-teams" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">Teams</Link>

            {isLoggedIn && (
              <>
                <div className="border-t border-slate-800 my-2 pt-2" />
                <Link to="/build-team" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">Build Team</Link>
                <Link to="/view-team" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">View Team</Link>
                <Link to="/view-points" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">View Points</Link>
                <Link to="/settings" onClick={closeMenu} className="p-2.5 rounded-md hover:bg-slate-800 hover:text-yellow-400">My Profile</Link>
              </>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full text-left p-2.5 rounded-md text-red-400 hover:bg-slate-800 font-medium"
              >
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="w-full text-center p-2.5 rounded-md border border-slate-700 hover:bg-slate-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="w-full text-center p-2.5 rounded-md bg-green-600 hover:bg-green-700 font-medium text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar