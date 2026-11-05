import { useEffect, useState } from 'react'

import { AppContext } from './context'
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getProfile,
  login as authenticate,
  logout as clearSession,
  register as createAccount,
} from '../services/auth'
import { getCart } from '../services/commerce'

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState(null)
  const [accessToken, setAccessToken] = useState(localStorage.getItem(ACCESS_TOKEN_KEY))
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)))

  function signOut() {
    clearSession()
    setAccessToken(null)
    setUser(null)
    setCart(null)
  }

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      setAuthLoading(false)
      return
    }

    getProfile()
      .then(setUser)
      .catch(signOut)
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (user) {
      getCart().then(setCart).catch(() => setCart(null))
    }
  }, [user])

  useEffect(() => {
    const handleExpired = () => signOut()
    const handleRefresh = (event) => setAccessToken(event.detail)
    window.addEventListener('misty:auth-expired', handleExpired)
    window.addEventListener('misty:token-refreshed', handleRefresh)
    return () => {
      window.removeEventListener('misty:auth-expired', handleExpired)
      window.removeEventListener('misty:token-refreshed', handleRefresh)
    }
  }, [])

  async function login(credentials) {
    const tokens = await authenticate(credentials)
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
    setAccessToken(tokens.access)
    const profile = await getProfile()
    setUser(profile)
    return profile
  }

  async function register(payload) {
    return createAccount(payload)
  }

  async function refreshProfile() {
    const profile = await getProfile()
    setUser(profile)
    return profile
  }

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        setUser,
        cart,
        setCart,
        accessToken,
        authLoading,
        login,
        register,
        signOut,
        logout: signOut,
        refreshProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
