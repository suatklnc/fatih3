import { useState, useEffect } from 'react'
import { quotationsApi, materialRequestsApi, materialsApi } from '../services/api'
import './Quotations.css'

function Quotations() {
  const [quotations, setQuotations] = useState([])
  const [requests, setRequests] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    requestId: '',
    supplierId: '',
    validUntil: '',
    currency: 'TRY',
    notes: '',
    items: [{ materialId: '', quantity: 0, unitPrice: 0, deliveryTime: 0, notes: '' }],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [quotationsRes, requestsRes, materialsRes] = await Promise.all([
        quotationsApi.getAll(),
        materialRequestsApi.getAll(),
        materialsApi.getAll(),
      ])
      setQuotations(quotationsRes.data || [])
      setRequests(requestsRes.data || [])
      setMaterials(materialsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialId: '', quantity: 0, unitPrice: 0, deliveryTime: 0, notes: '' }],
    })
  }

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await quotationsApi.create(formData)
      setShowForm(false)
      setFormData({
        requestId: '',
        supplierId: '',
        validUntil: '',
        currency: 'TRY',
        notes: '',
        items: [{ materialId: '', quantity: 0, unitPrice: 0, deliveryTime: 0, notes: '' }],
      })
      loadData()
    } catch (error) {
      console.error('Error creating quotation:', error)
      alert('Teklif oluşturulurken hata oluştu')
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await quotationsApi.updateStatus(id, status)
      loadData()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Durum güncellenirken hata oluştu')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
    }
    return badges[status] || 'badge-info'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Bekliyor',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
    }
    return texts[status] || status
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="quotations">
      <div className="page-header">
        <h1>Teklifler</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : '+ Yeni Teklif'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>Yeni Teklif</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Talep ID *</label>
                <input
                  type="text"
                  required
                  value={formData.requestId}
                  onChange={(e) => setFormData({ ...formData, requestId: e.target.value })}
                  placeholder="Talep UUID'si"
                />
              </div>
              <div className="form-group">
                <label>Tedarikçi ID *</label>
                <input
                  type="text"
                  required
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  placeholder="Tedarikçi UUID'si"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Geçerlilik Tarihi</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Para Birimi</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notlar</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label>Teklif Kalemleri</label>
                <button type="button" className="btn btn-success" onClick={handleAddItem} style={{ fontSize: '12px', padding: '5px 10px' }}>
                  + Kalem Ekle
                </button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="quotation-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Malzeme</label>
                      <select
                        required
                        value={item.materialId}
                        onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                      >
                        <option value="">Seçiniz</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} - {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Miktar</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Birim Fiyat</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Teslimat Süresi (Gün)</label>
                      <input
                        type="number"
                        value={item.deliveryTime}
                        onChange={(e) => handleItemChange(index, 'deliveryTime', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Not</label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleRemoveItem(index)}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary">Teklif Oluştur</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Teklif No</th>
              <th>Talep</th>
              <th>Tedarikçi</th>
              <th>Toplam Tutar</th>
              <th>Para Birimi</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  Henüz teklif oluşturulmamış
                </td>
              </tr>
            ) : (
              quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td>{quotation.quotationNumber}</td>
                  <td>{quotation.requestId}</td>
                  <td>{quotation.supplierId}</td>
                  <td>{quotation.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>{quotation.currency}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(quotation.status)}`}>
                      {getStatusText(quotation.status)}
                    </span>
                  </td>
                  <td>{new Date(quotation.quotationDate).toLocaleDateString('tr-TR')}</td>
                  <td>
                    {quotation.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handleStatusChange(quotation.id, 'approved')}
                          style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                        >
                          Onayla
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleStatusChange(quotation.id, 'rejected')}
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          Reddet
                        </button>
                      </>
                    )}
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

export default Quotations
