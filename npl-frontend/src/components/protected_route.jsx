// ProtectedRoute.jsx
// Wraps any route that requires login.
// Reads auth state from AuthContext (single source of truth) instead
// of running its own separate refresh check — avoids racing against
// AuthContext's own startup check, which would otherwise consume and
// rotate the refresh cookie twice on first load.
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { isLoggedIn, checkingAuth } = useAuth()

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-400">Checking authentication...</p>
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <p className="text-xl font-semibold text-gray-700 mb-2">
                    You need to be logged in to view this page
                </p>
                <p className="text-gray-500 mb-6">
                    Please log in or create an account to continue
                </p>
                <div className="flex gap-3">
                    <Link
                        to="/login"
                        className="bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-slate-800"
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700"
                    >
                        Register
                    </Link>
                </div>
            </div>
        )
    }

    return children
}