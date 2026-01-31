import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { companiesApi, usersApi } from '../services/api'
import './Materials.css'

function Companies() {
    const navigate = useNavigate()
    const [companies, setCompanies] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingCompany, setEditingCompany] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        taxNumber: '',
        address: '',
        phone: '',
        email: '',
    })

    useEffect(() => {
        loadCompanies()
    }, [])

    const loadCompanies = async () => {
        try {
            const [companiesRes, usersRes] = await Promise.all([
                companiesApi.getAll(),
                usersApi.getAll()
            ])
            setCompanies(companiesRes.data || [])
            setUsers(usersRes.data || [])
        } catch (error) {
            console.error('Error loading companies:', error)
        } finally {
            setLoading(false)
        }
    }

    const getUserCountByCompany = (companyId) => {
        return users.filter(u => u.companyId === companyId).length
    }

    const resetForm = () => {
        setFormData({
            name: '',
            taxNumber: '',
            address: '',
            phone: '',
            email: '',
        })
        setEditingCompany(null)
        setShowForm(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingCompany) {
                await companiesApi.update(editingCompany.id, formData)
            } else {
                await companiesApi.create(formData)
            }
            resetForm()
            loadCompanies()
        } catch (error) {
            console.error('Error saving company:', error)
            alert('Firma kaydedilirken hata oluştu: ' + (error.response?.data?.message || error.message))
        }
    }

    const handleEdit = (company) => {
        setFormData({
            name: company.name,
            taxNumber: company.taxNumber || '',
            address: company.address || '',
            phone: company.phone || '',
            email: company.email || '',
        })
        setEditingCompany(company)
        setShowForm(true)
    }

    const handleDelete = async (company) => {
        const id = company.id
        const userCount = getUserCountByCompany(id)

        if (userCount > 0) {
            const goToUsers = window.confirm(
                `Bu firmaya ${userCount} kullanıcı bağlı. Firma silmek için önce bu kullanıcıları Kullanıcılar sayfasından başka firmaya atayın veya silin.\n\nKullanıcılar sayfasına gideyim mi?`
            )
            if (goToUsers) {
                navigate(`/users?companyId=${id}`)
            }
            return
        }

        if (!confirm('Bu firmayı silmek istediğinize emin misiniz?')) return

        try {
            await companiesApi.delete(id)
            loadCompanies()
            alert('Firma başarıyla silindi.')
        } catch (error) {
            console.error('Error deleting company:', error)
            const message = error.response?.data?.message || 'Firma silinirken hata oluştu'
            alert(message)
        }
    }

    if (loading) {
        return <div className="loading">Yükleniyor...</div>
    }

    return (
        <div className="materials">
            <div className="page-header">
                <h1>Firmalar</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'İptal' : '+ Yeni Firma'}
                </button>
            </div>

            {showForm && (
                <div className="card">
                    <h2>{editingCompany ? 'Firma Düzenle' : 'Yeni Firma Ekle'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Firma Adı *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Vergi Numarası</label>
                                <input
                                    type="text"
                                    value={formData.taxNumber}
                                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Adres</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
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
                                <label>E-posta</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingCompany ? 'Güncelle' : 'Kaydet'}
                            </button>
                            {editingCompany && (
                                <button type="button" className="btn" onClick={resetForm}>
                                    İptal
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="card companies-card">
                <div className="table-responsive">
                    <table className="companies-table">
                        <thead>
                            <tr>
                                <th className="col-company-name">Firma Adı</th>
                                <th className="col-tax hide-mobile">Vergi No</th>
                                <th className="col-phone hide-mobile">Telefon</th>
                                <th className="col-email hide-mobile">E-posta</th>
                                <th className="col-staff">👥</th>
                                <th className="col-company-actions">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                        Henüz firma eklenmemiş
                                    </td>
                                </tr>
                            ) : (
                                companies.map((company) => {
                                    const count = getUserCountByCompany(company.id)
                                    return (
                                        <tr key={company.id}>
                                            <td className="col-company-name">
                                                <div className="company-name-cell">
                                                    <span className="company-name">{company.name}</span>
                                                    <span className="company-info-mobile">
                                                        {company.phone && <span>📞 {company.phone}</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="col-tax hide-mobile">{company.taxNumber || '-'}</td>
                                            <td className="col-phone hide-mobile">{company.phone || '-'}</td>
                                            <td className="col-email hide-mobile">{company.email || '-'}</td>
                                            <td className="col-staff" title="Personel sayısı">
                                                {count > 0 ? count : '-'}
                                            </td>
                                            <td className="col-company-actions">
                                                <div className="action-buttons-compact">
                                                    <button
                                                        type="button"
                                                        className="btn btn-icon btn-edit"
                                                        onClick={() => handleEdit(company)}
                                                        title="Düzenle"
                                                    >
                                                        <span className="btn-icon-text">✏️</span>
                                                        <span className="btn-full-text">Düzenle</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-icon btn-delete"
                                                        onClick={() => handleDelete(company)}
                                                        title="Sil"
                                                    >
                                                        <span className="btn-icon-text">🗑️</span>
                                                        <span className="btn-full-text">Sil</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Companies
