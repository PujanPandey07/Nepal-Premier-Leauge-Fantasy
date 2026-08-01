// auth.js — in-memory access token and cookie-based refresh helpers
const BASE_URL = 'http://localhost:8000'

let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function removeAccessToken() {
  accessToken = null
}

export async function tryRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
    })

    if (!res.ok) {
      removeAccessToken()
      return null
    }

    const data = await res.json()
    if (data?.access) {
      setAccessToken(data.access)
    }
    return data
  } catch (err) {
    removeAccessToken()
    return null
  }
}

export default {
  setAccessToken,
  getAccessToken,
  removeAccessToken,
  tryRefresh,
  logout: async function() {
    try {
      await fetch('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      // ignore network errors — still clear local state
    }
    removeAccessToken()
  }
}
