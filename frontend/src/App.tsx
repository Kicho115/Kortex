import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Auth from './components/Auth'
import Home from './components/Home'
import Landing from './components/Landing'
import type { UserRead } from './types/user'

export default function App() {
  const [user, setUser] = useState<UserRead | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null)

  if (authMode) {
    return (
      <Auth
        initialMode={authMode}
        onBack={() => setAuthMode(null)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser)
          setAuthMode(null)
        }}
      />
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Landing
              user={user}
              onLogin={() => setAuthMode('login')}
              onRegister={() => setAuthMode('register')}
            />
          }
        />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
