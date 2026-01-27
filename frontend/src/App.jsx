import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import MaterialRequests from './pages/MaterialRequests'
import Quotations from './pages/Quotations'
import Projects from './pages/Projects'
import Suppliers from './pages/Suppliers'
import Companies from './pages/Companies'
import Users from './pages/Users'
import './App.css'

const PrivateRoute = ({ children }) => {
  const { session, loading } = useAuth()

  if (loading) return <div className="loading">Yükleniyor...</div>

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

const ProtectedLayout = ({ children }) => {
  return (
    <PrivateRoute>
      <Layout>
        {children}
      </Layout>
    </PrivateRoute>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedLayout><Navigate to="/dashboard" replace /></ProtectedLayout>} />
          <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/companies" element={<ProtectedLayout><Companies /></ProtectedLayout>} />
          <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
          <Route path="/materials" element={<ProtectedLayout><Materials /></ProtectedLayout>} />
          <Route path="/requests" element={<ProtectedLayout><MaterialRequests /></ProtectedLayout>} />
          <Route path="/quotations" element={<ProtectedLayout><Quotations /></ProtectedLayout>} />
          <Route path="/suppliers" element={<ProtectedLayout><Suppliers /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout><Users /></ProtectedLayout>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
