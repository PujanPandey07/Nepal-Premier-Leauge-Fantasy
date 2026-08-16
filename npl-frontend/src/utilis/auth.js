// auth.js — in-memory access token and cookie-based refresh helpers

const BASE_URL = ''

let accessToken = null
let listeners = []
let refreshPromise = null

function notifyListeners() {
  listeners.forEach(listener => listener(accessToken))
}

export function subscribe(listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

export function setAccessToken(token) {
  accessToken = token
  notifyListeners()
}

export function getAccessToken() {
  return accessToken
}

export function removeAccessToken() {
  accessToken = null
  notifyListeners()
}

export async function tryRefresh() {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/token/refresh/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('Refresh failed:', errData)
        removeAccessToken()
        return null
      }

      const data = await res.json()
      if (data?.access) {
        setAccessToken(data.access)
      }
      return data
    } catch (err) {
      console.error('Refresh network error:', err)
      removeAccessToken()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function logout() {
  try {
    const token = getAccessToken()
    await fetch(`${BASE_URL}/api/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
  } catch (err) {
    // ignore
  }
  removeAccessToken()
}

export default {
  setAccessToken,
  getAccessToken,
  removeAccessToken,
  tryRefresh,
  logout,
  subscribe,
}