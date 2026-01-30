import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

// Veritabanında kayıt silinse bile tam yetkili sayılacak e-postalar (kod düzeyinde)
const SUPER_ADMIN_EMAILS = ['suatkilinc0102@gmail.com', 'ozbakanfatih@gmail.com']

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showProfilePopup, setShowProfilePopup] = useState(false)

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await usersApi.getAll()
        const userList = res.data || []
        if (authUser?.email) {
          let matched = userList.find(u => u.email === authUser.email)
          if (matched) {
            setCurrentUser(matched)
            return
          }
          if (SUPER_ADMIN_EMAILS.includes(authUser.email.toLowerCase())) {
            try {
              const byEmail = await usersApi.getByEmail(authUser.email)
              if (byEmail.data) {
                setCurrentUser(byEmail.data)
                return
              }
            } catch (_) {
              // Profil yok, aşağıdaki yedek kullanılacak
            }
            setCurrentUser({
              email: authUser.email,
              fullName: 'Tam Yetkili Kullanıcı',
              roleName: 'Patron',
            })
            return
          }
          // Profili olmayan normal kullanıcı: auth bilgilerinden varsayılan profil oluştur
          const displayName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Kullanıcı'
          setCurrentUser({
            email: authUser.email,
            fullName: displayName,
            roleName: null, // Rol atanmadı, "Kullanıcı" olarak gösterilecek
          })
          return
        }
        setCurrentUser(null)
      } catch (error) {
        if (authUser?.email && SUPER_ADMIN_EMAILS.includes(authUser.email.toLowerCase())) {
          setCurrentUser({
            email: authUser.email,
            fullName: 'Tam Yetkili Kullanıcı',
            roleName: 'Patron',
          })
        } else {
          console.error('Error loading user:', error)
        }
      }
    }
    loadCurrentUser()
  }, [authUser])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.log('Logout warning:', error.message)
    }
    // Her durumda login sayfasına yönlendir
    navigate('/login')
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
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowProfilePopup(!showProfilePopup)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{currentUser.fullName || 'Kullanıcı'}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{currentUser.roleName || 'Kullanıcı'}</div>
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

              {/* Profil Popup */}
              {showProfilePopup && (
                <>
                  <div 
                    onClick={() => setShowProfilePopup(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '10px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    padding: '20px',
                    minWidth: '280px',
                    zIndex: 1000,
                    color: '#333'
                  }}>
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4a90d9, #357abd)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '20px',
                        margin: '0 auto 10px'
                      }}>
                        {currentUser.fullName?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || '?'}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{currentUser.fullName || 'Kullanıcı'}</div>
                      <div style={{ 
                        display: 'inline-block',
                        background: currentUser.roleName === 'Patron' ? '#28a745' : 
                                   currentUser.roleName === 'Yönetici' ? '#17a2b8' : '#6c757d',
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        marginTop: '5px'
                      }}>
                        {currentUser.roleName || 'Kullanıcı'}
                      </div>
                    </div>
                    
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>E-posta</div>
                        <div style={{ fontSize: '13px' }}>{currentUser.email || authUser?.email || '-'}</div>
                      </div>
                      {currentUser.phone && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Telefon</div>
                          <div style={{ fontSize: '13px' }}>{currentUser.phone}</div>
                        </div>
                      )}
                      {currentUser.companyName && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Firma</div>
                          <div style={{ fontSize: '13px' }}>{currentUser.companyName}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>Durum</div>
                        <div style={{ fontSize: '13px' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: currentUser.isActive !== false ? '#28a745' : '#dc3545',
                            marginRight: '6px'
                          }}></span>
                          {currentUser.isActive !== false ? 'Aktif' : 'Pasif'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowProfilePopup(false)
                        await handleLogout()
                      }}
                      style={{
                        width: '100%',
                        marginTop: '15px',
                        padding: '10px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <span>Yükleniyor...</span>
          )}
          <div className="notifications">🔔</div>
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
