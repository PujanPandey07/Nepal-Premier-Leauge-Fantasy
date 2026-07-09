// axiosInstance.js
import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
})

// REQUEST interceptor — attach access token to every outgoing request
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
  response => response,

  async error => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/api/token/refresh/')
    ) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshtoken')

      if (!refreshToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshtoken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        })

        const newAccessToken = res.data.access
        localStorage.setItem('token', newAccessToken)

        // Save the new refresh token too — old one is blacklisted
        // because ROTATE_REFRESH_TOKENS = True in Django settings
        if (res.data.refresh) {
          localStorage.setItem('refreshtoken', res.data.refresh)
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        // Refresh token expired or blacklisted — force logout
        localStorage.removeItem('token')
        localStorage.removeItem('refreshtoken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance