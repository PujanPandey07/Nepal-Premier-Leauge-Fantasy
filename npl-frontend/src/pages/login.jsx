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
      const response = await axios.post('http://localhost:8000/api/token/', {
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
            href="http://localhost:8000/accounts/google/login/?next=http://localhost:8000/auth/complete/"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
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