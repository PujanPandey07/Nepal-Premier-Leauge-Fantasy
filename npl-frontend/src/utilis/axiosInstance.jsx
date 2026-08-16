import axios from 'axios'
import { getAccessToken, tryRefresh, removeAccessToken } from './auth'

const axiosInstance = axios.create({
  baseURL: '',
  withCredentials: true,
})

// REQUEST interceptor
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

// RESPONSE interceptor
axiosInstance.interceptors.response.use(
  response => response,

  async error => {
    const originalRequest = error.config

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/api/token/refresh/')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const data = await tryRefresh()

      if (!data?.access) {
        removeAccessToken()
        window.location.href = '/login'
        return Promise.reject(new Error('Session expired. Please log in again.'))
      }

      originalRequest.headers.Authorization = `Bearer ${data.access}`
      return axiosInstance(originalRequest)

    } catch (refreshError) {
      removeAccessToken()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    }
  }
)

export default axiosInstance