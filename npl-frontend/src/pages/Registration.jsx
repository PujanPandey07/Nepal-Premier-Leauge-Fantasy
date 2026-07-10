import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function Registration() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await axios.post('http://localhost:8000/api/auth/registration/', {
        name,
        email,
        password1: password,
        password2: confirmPassword
      })
      setSuccess(true)
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data)
      } else {
        setErrors({ non_field_errors: ['Something went wrong. Please try again.'] })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <p className="text-green-600 font-semibold text-lg mb-2">Registration successful!</p>
          <p className="text-gray-500 text-sm mb-4">You can now log in to your account.</p>
          <Link to="/login" className="inline-block bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">NPL Fantasy Registration</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.join(' ')}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.join(' ')}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password1 && (
              <ul className="text-red-500 text-sm mt-1 list-disc list-inside">
                {errors.password1.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password2 && (
              <p className="text-red-500 text-sm mt-1">{errors.password2.join(' ')}</p>
            )}
          </div>

          {errors.non_field_errors && (
            <p className="text-red-500 text-sm mb-4">{errors.non_field_errors.join(' ')}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-gray-300 w-full"></div>
            <span className="bg-white px-3 text-sm text-gray-500 absolute">or</span>
          </div>
          
            href="http://localhost:8000/accounts/google/login/"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded px-4 py-2 hover:bg-gray-50 text-sm font-medium text-gray-700"
          
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          
        </div>

        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Registration