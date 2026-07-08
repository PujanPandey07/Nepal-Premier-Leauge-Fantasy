// ProtectedRoute.jsx
// Wraps any route that requires login.
// If no token found, shows a message with a login link instead of the page.
import { Link } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem('refreshtoken')

    if (!token) {
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