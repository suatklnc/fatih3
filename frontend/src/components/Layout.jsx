import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await usersApi.getAll()
        if (res.data) {
          if (authUser?.email) {
            const matched = res.data.find(u => u.email === authUser.email)
            if (matched) setCurrentUser(matched)
            else if (res.data.length > 0) setCurrentUser(res.data[0])
          } else if (res.data.length > 0) {
            setCurrentUser(res.data[0])
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }
    loadCurrentUser()
  }, [authUser])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/companies', label: 'Firmalar', icon: '🏭' },
    { path: '/projects', label: 'Projeler', icon: '📁' },
    { path: '/materials', label: 'Malzeme Havuzu', icon: '📦' },
    { path: '/requests', label: 'Malzeme Talepleri', icon: '📝' },
    { path: '/quotations', label: 'Teklifler', icon: '💰' },
    { path: '/suppliers', label: 'Tedarikçiler', icon: '🏢' },
    { path: '/users', label: 'Kullanıcılar', icon: '👥', restricted: true },
  ]

  const userRole = currentUser?.roleName?.toLowerCase() || ''
  const isPatronOrAdmin = userRole === 'patron' || userRole === 'yönetici'

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Malzeme Yönetim Sistemi</h1>
        </div>
        <div className="navbar-user">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold' }}>{currentUser.fullName || 'Kullanıcı'}</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>{currentUser.roleName || 'Yetkili'}</div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#4a90d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {currentUser.fullName?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || '?'}
              </div>
            </div>
          ) : (
            <span>Yükleniyor...</span>
          )}
          <div className="notifications">🔔</div>
          <button
            onClick={handleLogout}
            className="btn btn-danger"
            style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '13px' }}
          >
            Çıkış
          </button>
        </div>
      </nav>

      <div className="layout-body">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          <nav className="sidebar-nav">
            {menuItems.map(item => {
              if (item.restricted && !isPatronOrAdmin) return null

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
