import { useState, useEffect } from 'react'
import { suppliersApi } from '../services/api'
import './Materials.css'

function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    taxNumber: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: ''
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      const response = await suppliersApi.getAll()
      setSuppliers(response.data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
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
      contactPerson: ''
    })
    setEditingSupplier(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        await suppliersApi.update(editingSupplier.id, formData)
      } else {
        await suppliersApi.create(formData)
      }
      resetForm()
      loadSuppliers()
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Tedarikçi kaydedilirken hata oluştu: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEdit = (supplier) => {
    setFormData({
      name: supplier.name,
      taxNumber: supplier.taxNumber || '',
      address: supplier.address || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      contactPerson: supplier.contactPerson || ''
    })
    setEditingSupplier(supplier)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return

    try {
      await suppliersApi.delete(id)
      loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Tedarikçi silinirken hata oluştu')
    }
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="materials">
      <div className="page-header">
        <h1>Tedarikçiler</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : '+ Yeni Tedarikçi'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi Ekle'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Tedarikçi Adı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>İlgili Kişi</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vergi Numarası</label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>E-posta * (Mail gönderimi için gereklidir)</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@tedarikci.com"
              />
            </div>

            <div className="form-group">
              <label>Adres</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                {editingSupplier ? 'Güncelle' : 'Kaydet'}
              </button>
              {editingSupplier && (
                <button type="button" className="btn" onClick={resetForm}>
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="card suppliers-card">
        <div className="table-responsive">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th className="col-supplier-name">Tedarikçi</th>
                <th className="col-supplier-phone">Telefon</th>
                <th className="col-supplier-actions">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                    Henüz tedarikçi eklenmemiş
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="col-supplier-name">
                      <div className="supplier-name-cell">
                        <span className="supplier-name">{supplier.name}</span>
                        {supplier.contactPerson && (
                          <span className="supplier-contact">{supplier.contactPerson}</span>
                        )}
                      </div>
                    </td>
                    <td className="col-supplier-phone">
                      {supplier.phone || '-'}
                    </td>
                    <td className="col-supplier-actions">
                      <div className="action-buttons-compact">
                        <button
                          type="button"
                          className="btn btn-icon btn-edit"
                          onClick={() => handleEdit(supplier)}
                          title="Düzenle"
                        >
                          <span className="btn-icon-text">✏️</span>
                          <span className="btn-full-text">Düzenle</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon btn-delete"
                          onClick={() => handleDelete(supplier.id)}
                          title="Sil"
                        >
                          <span className="btn-icon-text">🗑️</span>
                          <span className="btn-full-text">Sil</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Suppliers
