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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Ekran boyutu değişikliğini dinle
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Mobil menü açıkken body scroll'u engelle
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Sayfa değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

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
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menü"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
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
                      zIndex: 999,
                      background: isMobile ? 'rgba(0,0,0,0.3)' : 'transparent'
                    }}
                  />
                  <div style={{
                    position: isMobile ? 'fixed' : 'absolute',
                    top: isMobile ? 'auto' : '100%',
                    bottom: isMobile ? '0' : 'auto',
                    left: isMobile ? '0' : 'auto',
                    right: isMobile ? '0' : '0',
                    marginTop: isMobile ? '0' : '10px',
                    background: 'white',
                    borderRadius: isMobile ? '16px 16px 0 0' : '12px',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
                    padding: isMobile ? '16px' : '20px',
                    minWidth: isMobile ? 'auto' : '280px',
                    zIndex: 1000,
                    color: '#333'
                  }}>
                    {/* Mobil için sürükleme çubuğu */}
                    {isMobile && (
                      <div style={{
                        width: '40px',
                        height: '4px',
                        background: '#ddd',
                        borderRadius: '2px',
                        margin: '0 auto 12px'
                      }} />
                    )}
                    
                    {/* Kompakt profil başlığı */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: isMobile ? '10px' : '12px',
                      marginBottom: isMobile ? '12px' : '15px',
                      paddingBottom: isMobile ? '12px' : '15px',
                      borderBottom: '1px solid #eee'
                    }}>
                      <div style={{
                        width: isMobile ? '45px' : '50px',
                        height: isMobile ? '45px' : '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4a90d9, #357abd)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '16px' : '18px',
                        flexShrink: 0
                      }}>
                        {currentUser.fullName?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: isMobile ? '14px' : '15px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {currentUser.fullName || 'Kullanıcı'}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? '11px' : '12px', 
                          color: '#666',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {currentUser.email || authUser?.email || '-'}
                        </div>
                      </div>
                      <div style={{ 
                        background: currentUser.roleName === 'Patron' ? '#28a745' : 
                                   currentUser.roleName === 'Yönetici' ? '#17a2b8' : '#6c757d',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {currentUser.roleName || 'Kullanıcı'}
                      </div>
                    </div>
                    
                    {/* Detay bilgileri - sadece masaüstünde veya telefon/firma varsa göster */}
                    {(!isMobile || currentUser.phone || currentUser.companyName) && (
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr',
                        gap: isMobile ? '8px' : '10px',
                        marginBottom: isMobile ? '12px' : '15px',
                        fontSize: isMobile ? '12px' : '13px'
                      }}>
                        {currentUser.phone && (
                          <div>
                            <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Telefon</div>
                            <div>{currentUser.phone}</div>
                          </div>
                        )}
                        {currentUser.companyName && (
                          <div>
                            <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Firma</div>
                            <div>{currentUser.companyName}</div>
                          </div>
                        )}
                        {!isMobile && (
                          <div>
                            <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Durum</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: currentUser.isActive !== false ? '#28a745' : '#dc3545'
                              }}></span>
                              {currentUser.isActive !== false ? 'Aktif' : 'Pasif'}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

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
                        padding: isMobile ? '12px' : '10px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '14px' : '13px',
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
        {/* Mobil overlay */}
        <div 
          className={`sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
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
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
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
