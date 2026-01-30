import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { usersApi, companiesApi } from '../services/api'
import './Materials.css'

function Users() {
    const [searchParams] = useSearchParams()
    const companyIdFromUrl = searchParams.get('companyId')
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        roleId: '',
        companyId: '',
        phone: '',
        isActive: true,
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [usersRes, rolesRes, companiesRes] = await Promise.all([
                usersApi.getAll(),
                usersApi.getRoles(),
                companiesApi.getAll()
            ])
            setUsers(usersRes.data || [])
            setRoles(rolesRes.data || [])
            setCompanies(companiesRes.data || [])
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            email: '',
            fullName: '',
            roleId: '',
            companyId: '',
            phone: '',
            isActive: true,
        })
        setEditingUser(null)
        setShowForm(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const data = {
                ...formData,
                roleId: formData.roleId || null,
                companyId: formData.companyId || null,
            }

            if (editingUser) {
                await usersApi.update(editingUser.id, data)
            } else {
                await usersApi.create(data)
            }
            resetForm()
            loadData()
        } catch (error) {
            console.error('Error saving user:', error)
            alert('Kullanıcı kaydedilirken hata oluştu: ' + (error.response?.data?.message || error.message))
        }
    }

    const handleEdit = (user) => {
        setFormData({
            email: user.email,
            fullName: user.fullName || '',
            roleId: user.roleId || '',
            companyId: user.companyId || '',
            phone: user.phone || '',
            isActive: user.isActive,
        })
        setEditingUser(user)
        setShowForm(true)
    }

    const handleDelete = async (id) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return

        try {
            await usersApi.delete(id)
            loadData()
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Kullanıcı silinirken hata oluştu')
        }
    }

    const getRoleName = (roleId) => {
        const role = roles.find(r => r.id === roleId)
        return role?.name || '-'
    }

    const getCompanyName = (companyId) => {
        const company = companies.find(c => c.id === companyId)
        return company?.name || '-'
    }

    const filteredUsers = companyIdFromUrl
        ? users.filter(u => u.companyId === companyIdFromUrl)
        : users
    const filterCompanyName = companyIdFromUrl ? getCompanyName(companyIdFromUrl) : null

    if (loading) {
        return <div className="loading">Yükleniyor...</div>
    }

    return (
        <div className="materials">
            <div className="page-header">
                <h1>Kullanıcılar</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'İptal' : '+ Yeni Kullanıcı'}
                </button>
            </div>

            {filterCompanyName && (
                <div className="card" style={{ marginBottom: '16px', background: '#fff8e6', border: '1px solid #e6d9b8' }}>
                    <strong>Firma filtresi:</strong> "{filterCompanyName}" firmasına bağlı kullanıcılar listeleniyor.
                    Firma silmek için bu kullanıcıları başka firmaya atayın (Düzenle) veya silin.
                    <Link to="/users" style={{ marginLeft: '12px', fontSize: '14px' }}>Filtreyi kaldır</Link>
                </div>
            )}

            {showForm && (
                <div className="card">
                    <h2>{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>E-posta *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Ad Soyad *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Rol</label>
                                <select
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                >
                                    <option value="">Rol Seçin</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Firma</label>
                                <select
                                    value={formData.companyId}
                                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                >
                                    <option value="">Firma Seçin</option>
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>{company.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Telefon</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Durum</label>
                                <select
                                    value={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                >
                                    <option value="true">Aktif</option>
                                    <option value="false">Pasif</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingUser ? 'Güncelle' : 'Kaydet'}
                            </button>
                            {editingUser && (
                                <button type="button" className="btn" onClick={resetForm}>
                                    İptal
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Ad Soyad</th>
                            <th>E-posta</th>
                            <th>Rol</th>
                            <th>Firma</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                    {companyIdFromUrl ? 'Bu firmaya bağlı kullanıcı yok.' : 'Henüz kullanıcı eklenmemiş'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.fullName || '-'}</td>
                                    <td>{user.email}</td>
                                    <td>{getRoleName(user.roleId)}</td>
                                    <td>{getCompanyName(user.companyId)}</td>
                                    <td>
                                        <span className={`status-badge ${user.isActive ? 'status-active' : 'status-cancelled'}`}>
                                            {user.isActive ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn"
                                            onClick={() => handleEdit(user)}
                                            style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDelete(user.id)}
                                            style={{ fontSize: '12px', padding: '5px 10px' }}
                                        >
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Users
