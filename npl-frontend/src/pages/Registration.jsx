import { useState } from 'react'
import axios from 'axios'

function Registration() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})   // NEW: holds field -> [messages]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})   // NEW: clear old errors before trying again

    try {
      const response = await axios.post('http://localhost:8000/api/auth/registration/', {
        name: name,
        email: email,
        password1: password,
        password2: confirmPassword
      })
      console.log(response.data)
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data)   // NEW: store whatever Django sent back
      } else {
        setErrors({ non_field_errors: ['Something went wrong. Please try again.'] })
      }
    }
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
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.join(' ')}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password1 && (
              <ul className="text-red-500 text-sm mt-1 list-disc list-inside">
                {errors.password1.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  )
}

export default Registration