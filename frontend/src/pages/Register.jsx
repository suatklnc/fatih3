import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../services/api'
import './Login.css'

function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { signUp } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const result = await signUp(email, password, { full_name: fullName })

            // Auth başarılı ise backend veritabanına kaydet
            if (result.user || result.data?.user) {
                const user = result.user || result.data.user
                await usersApi.create({
                    id: user.id,
                    email: email,
                    fullName: fullName,
                    isActive: true
                })
            }

            alert('Kayıt başarılı! Giriş yapabilirsiniz.')
            navigate('/login')
        } catch (error) {
            console.error('Registration error:', error)
            setError('Kayıt başarısız: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Malzeme Yönetim Sistemi</h2>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>Kayıt Ol</h3>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Ad Soyad</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="form-control"
                            placeholder="Adınız Soyadınız"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Adresi</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-control"
                            placeholder="ornek@sirket.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-control"
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="btn btn-success btn-block" disabled={loading}>
                        {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p>Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link></p>
                </div>
            </div>
        </div>
    )
}

export default Register
