import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { setAccessToken } from '../utilis/auth'

function Login() {
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await axios.post('/api/token/', {
        email,
        password,
      }, { withCredentials: true })

      setAccessToken(response.data.access)
      navigate('/')
    } catch (error) {
      const data = error.response?.data
      const status = error.response?.status

      if (status === 403 && data?.detail?.toLowerCase().includes('verify')) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.')
      } else {
        const msg = data?.detail 
          || data?.non_field_errors?.[0]
          || (typeof data === 'object' ? Object.values(data)[0] : null)
          || 'Invalid email or password'
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">NPL Fantasy Login</h2>

        {verified === 'success' && (
          <p className="text-green-600 text-sm mb-4 bg-green-50 p-3 rounded">
            ✓ Your email has been verified! You can now log in.
          </p>
        )}
        {verified === 'failed' && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded">
            ✗ Verification link is invalid or expired. Please try registering again.
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-gray-300 w-full"></div>
            <span className="bg-white px-3 text-sm text-gray-500 absolute">or</span>
          </div>

          <a
            href={`${window.location.origin}/accounts/google/login/?next=${window.location.origin}/api/auth/complete/`}
  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.04 5.04 0 0 1-2.19 3.31v2.77h3.54c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.77c-.98.66-2.23 1.06-3.74 1.06-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.86-2.59 3.29-4.53 6.16-4.53z"/>
  </svg>
  <span className="font-medium">Continue with Google</span>
</a>
        </div>

        <p className="text-sm text-center text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login