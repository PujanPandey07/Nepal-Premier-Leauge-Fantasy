// AuthCallback.jsx
// This page handles the redirect from Google OAuth.
// It reads the tokens from the URL params, saves them to localStorage,
// and redirects to the dashboard.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAccessToken, tryRefresh } from '../utilis/auth'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const access = params.get('access')
        const refresh = params.get('refresh')

        async function finishLogin() {
            if (access && refresh) {
                // Backwards-compatible: some flows include tokens in URL.
                // Keep behaviour simple for now: store access in memory
                // and refresh in cookie if server provided it.
                setAccessToken(access)
                navigate('/')
                return
            }

            // Otherwise attempt cookie-based refresh to obtain an access token
            const res = await tryRefresh()
            if (res && res.access) {
                setAccessToken(res.access)
                navigate('/')
            } else {
                navigate('/login?error=auth_failed')
            }
        }

        finishLogin()
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Logging you in...</p>
        </div>
    )
}