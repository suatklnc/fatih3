import { useState, useEffect } from 'react'
import { companiesApi } from '../services/api'
import './Materials.css'

function Companies() {
    const [companies, setCompanies] = useState([])
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
            const response = await companiesApi.getAll()
            setCompanies(response.data || [])
        } catch (error) {
            console.error('Error loading companies:', error)
        } finally {
            setLoading(false)
        }
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

    const handleDelete = async (id) => {
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

            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th>Firma Adı</th>
                            <th>Vergi No</th>
                            <th>Telefon</th>
                            <th>E-posta</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                    Henüz firma eklenmemiş
                                </td>
                            </tr>
                        ) : (
                            companies.map((company) => (
                                <tr key={company.id}>
                                    <td>{company.name}</td>
                                    <td>{company.taxNumber || '-'}</td>
                                    <td>{company.phone || '-'}</td>
                                    <td>{company.email || '-'}</td>
                                    <td>
                                        <button
                                            className="btn"
                                            onClick={() => handleEdit(company)}
                                            style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                                        >
                                            Düzenle
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleDelete(company.id)}
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

export default Companies
