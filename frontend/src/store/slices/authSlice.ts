import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  user: {
    id: string
    username: string
    email: string
  } | null
}

const getInitialState = (): AuthState => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  
  if (token) {
    let user = null
    if (userStr) {
      try {
        user = JSON.parse(userStr)
      } catch (e) {
        console.log('ERROR', e)
      }
    }
    
    return {
      isAuthenticated: true,
      token,
      user,
    }
  }
  
  return {
    isAuthenticated: false,
    token: null,
    user: null,
  }
}

const initialState: AuthState = getInitialState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string; user: { id: string; username: string; email: string } }>) => {
      state.isAuthenticated = true
      state.token = action.payload.token
      state.user = action.payload.user
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    checkAuth: (state) => {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      
      if (token) {
        state.isAuthenticated = true
        state.token = token
        
        if (userStr) {
          try {
            state.user = JSON.parse(userStr)
          } catch (e) {
            state.user = null
            console.log('ERROR', e)

          }
        } else {
          state.user = null
        }
      }
    },
    setUser: (state, action: PayloadAction<{ id: string; username: string; email: string }>) => {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
  },
})

export const { login, logout, checkAuth, setUser } = authSlice.actions
export default authSlice.reducer

