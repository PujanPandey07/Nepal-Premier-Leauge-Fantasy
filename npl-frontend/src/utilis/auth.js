// auth.js — in-memory access token and cookie-based refresh helpers
import axiosInstance from './axiosInstance'  // ← ADD THIS IMPORT

const BASE_URL = 'http://localhost:8000'

let accessToken = null
let listeners = []

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
  try {
    const res = await fetch(`${BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
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

export async function logout() {
  try {
    // axiosInstance automatically attaches the Bearer token
    await axiosInstance.post('/api/auth/logout/')
  } catch (err) {
    // ignore network errors — still clear local state
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