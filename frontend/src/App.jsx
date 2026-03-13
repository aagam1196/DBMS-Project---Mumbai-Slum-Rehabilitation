import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { loadAuth, setAuth, clearAuth } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Beneficiaries from './pages/Beneficiaries'
import Violations from './pages/Violations'
import Allotments from './pages/Allotments'
import Slums from './pages/Slums'

export default function App() {
  const [authed, setAuthed] = useState(() => loadAuth())

  const handleLogin = (user, pass) => {
    setAuth(user, pass)
    setAuthed(true)
  }
  const handleLogout = () => {
    clearAuth()
    setAuthed(false)
  }

  if (!authed) return <Login onLogin={handleLogin} />

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/beneficiaries" element={<Beneficiaries />} />
        <Route path="/violations" element={<Violations />} />
        <Route path="/allotments" element={<Allotments />} />
        <Route path="/slums" element={<Slums />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
