// axiosInstance.js
// A pre-configured axios instance that automatically:
// 1. Attaches the Authorization header to every request
// 2. Catches 401 responses, refreshes the access token, and retries the request
// Import this instead of plain axios anywhere you make API calls

import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
})

// REQUEST interceptor — attach token to every outgoing request
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// RESPONSE interceptor — catch 401s and try to refresh
axiosInstance.interceptors.response.use(
  // If response is fine, just pass it through unchanged
  response => response,

  async error => {
    const originalRequest = error.config

    // Only try to refresh if:
    // 1. We got a 401 (unauthorized)
    // 2. We haven't already tried to refresh for this request (_retry flag)
    // 3. The failed request wasn't the refresh endpoint itself (avoid infinite loop)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/token/refresh/')
    ) {
      originalRequest._retry = true  // mark so we don't retry more than once

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        // No refresh token — user must log in again
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Use plain axios here (not axiosInstance) to avoid triggering
        // the interceptor again on the refresh request itself
        const res = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        })

        const newAccessToken = res.data.access
        localStorage.setItem('token', newAccessToken)

        // Update the failed request's header with the new token and retry it
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        // Refresh token itself is expired or invalid — force logout
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance