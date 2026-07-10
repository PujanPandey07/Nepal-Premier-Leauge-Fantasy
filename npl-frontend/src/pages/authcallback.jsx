// AuthCallback.jsx
// This page handles the redirect from Google OAuth.
// It reads the tokens from the URL params, saves them to localStorage,
// and redirects to the dashboard.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const access = params.get('access')
        const refresh = params.get('refresh')

        if (access && refresh) {
            localStorage.setItem('token', access)
            localStorage.setItem('refreshtoken', refresh)
            navigate('/')
        } else {
            // Something went wrong — go back to login
            navigate('/login?error=auth_failed')
        }
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Logging you in...</p>
        </div>
    )
}