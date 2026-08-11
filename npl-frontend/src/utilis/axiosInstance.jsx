import axios from 'axios'
import { getAccessToken, setAccessToken, tryRefresh } from './auth'

const BASE_URL = ''

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // ← ADD THIS LINE
})

// REQUEST interceptor — attach in-memory access token
axiosInstance.interceptors.request.use(
  config => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// RESPONSE interceptor — catch 401s and refresh
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

      try {
        const res = await tryRefresh()
        if (!res || !res.access) {
          setAccessToken(null)
          window.location.href = '/login'
          return Promise.reject(error)
        }

        setAccessToken(res.access)
        originalRequest.headers.Authorization = `Bearer ${res.access}`
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        setAccessToken(null)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance