// context/AuthContext.jsx
//
// Single source of truth for "is the user logged in" across the app.
// Replaces the old pattern of every component independently reading
// localStorage and decoding a JWT itself.
//
// Two things happen here:
// 1. On first mount, silently attempt to derive a fresh access token
//    from the HttpOnly refresh cookie (so a browser refresh doesn't
//    look like a logout — the cookie is still valid even though the
//    in-memory access token was wiped by the page reload).
// 2. Subscribe to auth.js so any setAccessToken/removeAccessToken call
//    anywhere in the app (login, logout, axiosInstance's 401 interceptor)
//    is reflected here reactively, without touching localStorage.

import { createContext, useContext, useEffect, useState } from 'react'
import { getAccessToken, subscribe, tryRefresh } from '../utilis/auth'

const AuthContext = createContext(null)

function decodeUserId(token) {
    if (!token) return null
    try {
        return JSON.parse(atob(token.split('.')[1])).user_id
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [accessToken, setAccessTokenState] = useState(getAccessToken())
    const [checkingAuth, setCheckingAuth] = useState(true)

    useEffect(() => {
        const unsubscribe = subscribe(token => setAccessTokenState(token))
        return unsubscribe
    }, [])

    useEffect(() => {
        tryRefresh().finally(() => setCheckingAuth(false))
    }, [])

    const value = {
        isLoggedIn: !!accessToken,
        userId: decodeUserId(accessToken),
        checkingAuth,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}