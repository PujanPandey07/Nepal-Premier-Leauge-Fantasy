import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAccessToken, tryRefresh } from '../utilis/auth'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        async function finishLogin() {
            // The backend set the refresh token as an HttpOnly cookie
            // and redirected here. We just need to exchange it for an access token.
            const res = await tryRefresh()
            if (res && res.access) {
                setAccessToken(res.access)
                navigate('/')
            } else {
                navigate('/login?error=auth_failed')
            }
        }

        finishLogin()
    }, [navigate])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-600">Logging you in...</p>
        </div>
    )
}