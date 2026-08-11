import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAccessToken } from '../utilis/auth'

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/token/refresh/', {
      method: 'POST',
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Refresh failed')
        return res.json()
      })
      .then(data => {
        if (data.access) {
          setAccessToken(data.access)
          navigate('/')  // or your logged-in home page
        } else {
          throw new Error('No access token')
        }
      })
      .catch(() => {
        navigate('/login')
      })
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Logging you in...</p>
    </div>
  )
}

export default AuthCallback