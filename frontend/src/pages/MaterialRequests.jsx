import { useState, useEffect, useRef } from 'react'
import { materialRequestsApi, materialsApi, projectsApi, suppliersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './MaterialRequests.css'

// Rol adını karşılaştırma için normalleştir (Türkçe ı/i farkları)
function normalizeRole(roleName) {
  if (!roleName || typeof roleName !== 'string') return ''
  return roleName.toLowerCase().replace(/ı/g, 'i').replace(/İ/g, 'i').trim()
}

function MaterialRequests() {
  const { userProfile } = useAuth()
  const rawRole = userProfile?.roleName || ''
  const userRole = rawRole.toLowerCase().trim()
  const roleNorm = normalizeRole(rawRole)

  // Tam yetkili / yönetici: onaylar ve satın almaya gönderir. Satın alma: onaylanmış talepleri tedarikçilere gönderir.
  const isPatronOrAdmin = roleNorm === 'patron' || roleNorm === 'yönetici' || userRole === 'patron' || userRole === 'yönetici'
  const isPurchasing =
    isPatronOrAdmin ||
    roleNorm === 'satın alma' ||
    roleNorm === 'satın alma birimi' ||
    roleNorm.includes('satın alma') ||
    roleNorm.includes('satin alma') ||
    userRole.includes('satın alma') ||
    userRole.includes('alma birimi')
  const isPurchasingOnly = isPurchasing && !isPatronOrAdmin

  const [requests, setRequests] = useState([])
  const [materials, setMaterials] = useState([])
  const [filteredMaterials, setFilteredMaterials] = useState([])
  const [materialSearchQueries, setMaterialSearchQueries] = useState({})
  const [projects, setProjects] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  // Supplier Modal States
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [selectedSupplierIds, setSelectedSupplierIds] = useState([])
  const [supplierModalLoading, setSupplierModalLoading] = useState(false)

  // Tüm kullanıcılar (yetkisiz, satın alma, yönetici) pending dahil tüm talepleri görebilir
  // Sadece rejected talepler satın alma biriminden gizlenir
  const displayRequests = isPurchasingOnly
    ? requests.filter(r => r.status !== 'rejected')
    : requests

  const [formData, setFormData] = useState({
    projectId: '',
    requiredDate: '',
    notes: '',
    items: [{ materialId: '', quantity: 0, notes: '' }],
  })
  
  // Satır referansları - scroll için
  const itemRefs = useRef({})

  useEffect(() => {
    loadData()
  }, [])

  // İlk yükleme - malzemeler HARİÇ (lazy load edilecek)
  const loadData = async () => {
    try {
      const [requestsRes, projectsRes, suppliersRes] = await Promise.all([
        materialRequestsApi.getAll(),
        projectsApi.getAll(),
        suppliersApi.getAll()
      ])
      setRequests(requestsRes.data || [])
      setProjects(projectsRes.data || [])
      setSuppliers(suppliersRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Malzemeleri yükle - form açıldığında çağrılır
  const loadMaterials = async () => {
    if (materials.length > 0) return // Zaten yüklüyse tekrar yükleme
    try {
      const res = await materialsApi.getAll()
      const materialsData = res.data || []
      setMaterials(materialsData)
      setFilteredMaterials(materialsData)
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  // Sadece talepleri yenile - hızlı güncelleme için
  const refreshRequests = async () => {
    try {
      const res = await materialRequestsApi.getAll()
      setRequests(res.data || [])
    } catch (error) {
      console.error('Error refreshing requests:', error)
    }
  }

  const handleAddItem = () => {
    const newIndex = formData.items.length
    setFormData({
      ...formData,
      items: [...formData.items, { materialId: '', quantity: 0, notes: '' }],
    })
    // Yeni eklenen satıra scroll yap
    setTimeout(() => {
      itemRefs.current[newIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
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
    if (field === 'materialId') {
      setMaterialSearchQueries(prev => ({ ...prev, [index]: '' }))
    }
  }

  const handleMaterialSearch = (index, query) => {
    setMaterialSearchQueries(prev => ({ ...prev, [index]: query }))
    // Arama yapıldığında satıra scroll yap
    if (query.length >= 2) {
      setTimeout(() => {
        itemRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }

  const getFilteredMaterialsForItem = (index) => {
    const query = (materialSearchQueries[index] || '').toLowerCase().trim()
    // Minimum 2 karakter gerekli
    if (query.length < 2) return []
    // Filtreleme ve sadece ilk 3 sonucu döndür
    const filtered = materials.filter(m => 
      (m.code?.toLowerCase().includes(query) || '') ||
      (m.name?.toLowerCase().includes(query) || '') ||
      (m.category?.toLowerCase().includes(query) || '')
    )
    return filtered.slice(0, 3)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Backend'in beklediği formata dönüştür
      const requestData = {
        projectId: formData.projectId,
        requiredDate: formData.requiredDate || null,
        notes: formData.notes || null,
        items: formData.items.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          notes: item.notes || null
        }))
      }
      console.log('Sending request data:', JSON.stringify(requestData, null, 2))
      await materialRequestsApi.create(requestData)
      setShowForm(false)
      setFormData({
        projectId: '',
        requiredDate: '',
        notes: '',
        items: [{ materialId: '', quantity: 0, notes: '' }],
      })
      refreshRequests()
    } catch (error) {
      console.error('Error creating request:', error)
      console.error('Error response data:', error.response?.data)
      alert('Talep oluşturulurken hata oluştu: ' + JSON.stringify(error.response?.data))
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await materialRequestsApi.updateStatus(id, status)
      refreshRequests()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Durum güncellenirken hata oluştu')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return

    try {
      await materialRequestsApi.delete(id)
      refreshRequests()
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Talep silinirken hata oluştu')
    }
  }

  const handleViewDetail = async (request) => {
    try {
      const res = await materialRequestsApi.getById(request.id)
      setSelectedRequest(res.data)
      setShowDetail(true)
    } catch (error) {
      console.error('Error fetching request details:', error)
      alert('Talep detayları yüklenirken hata oluştu')
    }
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || projectId
  }

  const getMaterialName = (materialId) => {
    const material = materials.find(m => m.id === materialId)
    return material ? `${material.code} - ${material.name} ` : materialId
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      completed: 'badge-info',
      sent_to_purchasing: 'badge-primary',
      sent_to_suppliers: 'badge-info',
      quotations_received: 'badge-secondary',
    }
    return badges[status] || 'badge-info'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Bekliyor',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
      completed: 'Tamamlandı',
      sent_to_purchasing: 'Satın Almada',
      sent_to_suppliers: 'Tedarikçilere Gönderildi',
      quotations_received: 'Teklifler Alındı',
    }
    return texts[status] || status
  }

  const handleSendToPurchasing = async (id) => {
    try {
      await materialRequestsApi.sendToPurchasing(id)
      refreshRequests()
    } catch (error) {
      console.error('Error sending to purchasing:', error)
      alert('Satın almaya gönderilirken hata oluştu')
    }
  }

  const handleSendToSuppliers = (id) => {
    const req = requests.find(r => r.id === id)
    setSelectedRequest(req)
    setSelectedSupplierIds([])
    setShowSupplierModal(true)
  }

  const handleConfirmSendToSuppliers = async () => {
    if (selectedSupplierIds.length === 0) {
      alert('Lütfen en az bir tedarikçi seçiniz.')
      return
    }

    setSupplierModalLoading(true)
    try {
      await materialRequestsApi.sendToSuppliers(selectedRequest.id, selectedSupplierIds)
      setShowSupplierModal(false)
      setSelectedRequest(null)
      refreshRequests()
      alert('Tedarikçilere mail gönderildi ve durum güncellendi.')
    } catch (error) {
      console.error('Error sending to suppliers:', error)
      alert('Hata oluştu: ' + (error.response?.data?.message || 'Bilinmeyen hata'))
    } finally {
      setSupplierModalLoading(false)
    }
  }

  const handleSupplierToggle = (supplierId) => {
    if (selectedSupplierIds.includes(supplierId)) {
      setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== supplierId))
    } else {
      setSelectedSupplierIds([...selectedSupplierIds, supplierId])
    }
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="material-requests">
      {/* Detail Modal */}
      {showDetail && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Talep Detayı</h2>
              <button onClick={() => setShowDetail(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div><strong>Talep No:</strong> {selectedRequest.requestNumber}</div>
              <div><strong>Durum:</strong> <span className={`badge ${getStatusBadge(selectedRequest.status)} `}>{getStatusText(selectedRequest.status)}</span></div>
              <div><strong>Proje:</strong> {getProjectName(selectedRequest.projectId)}</div>
              <div><strong>Talep Tarihi:</strong> {new Date(selectedRequest.requestDate).toLocaleDateString('tr-TR')}</div>
              <div><strong>Gerekli Tarih:</strong> {selectedRequest.requiredDate ? new Date(selectedRequest.requiredDate).toLocaleDateString('tr-TR') : '-'}</div>
            </div>

            {selectedRequest.notes && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Notlar:</strong> {selectedRequest.notes}
              </div>
            )}

            <div>
              <strong>Malzeme Kalemleri:</strong>
              <table style={{ width: '100%', marginTop: '10px', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Malzeme</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Miktar</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Not</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.items?.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{getMaterialName(item.materialId)}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '8px' }}>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Selection Modal */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3>Tedarikçilere Gönder</h3>
            <p>Lütfen teklif isteği gönderilecek tedarikçileri seçiniz:</p>

            <div className="supplier-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
              {suppliers.length === 0 ? (
                <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                  Kayıtlı tedarikçi bulunamadı. Lütfen önce Tedarikçiler sayfasından ekleme yapınız.
                </div>
              ) : (
                suppliers.map(sup => (
                  <div key={sup.id} style={{ padding: '8px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: sup.email ? 'pointer' : 'not-allowed', width: '100%', opacity: sup.email ? 1 : 0.5 }}>
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.includes(sup.id)}
                        onChange={() => handleSupplierToggle(sup.id)}
                        disabled={!sup.email}
                        style={{ marginRight: '10px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{sup.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {sup.email ? sup.email : '(E-posta adresi yok)'}
                        </div>
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSupplierModal(false)}
                disabled={supplierModalLoading}
              >
                İptal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmSendToSuppliers}
                disabled={supplierModalLoading || selectedSupplierIds.length === 0}
              >
                {supplierModalLoading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1>Malzeme Talepleri</h1>
        <button className="btn btn-primary" onClick={() => {
          if (!showForm) loadMaterials() // Form açılırken malzemeleri yükle
          setShowForm(!showForm)
        }}>
          {showForm ? 'İptal' : '+ Yeni Talep'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '20px' }}>
          <form onSubmit={handleSubmit}>
            {/* Üst Bilgiler - Kompakt Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '12px',
              marginBottom: '20px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Proje *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                >
                  <option value="">Seçiniz</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Gerekli Tarih</label>
                <input
                  type="date"
                  value={formData.requiredDate}
                  onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Not</label>
                <input
                  type="text"
                  placeholder="Talep notu..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>
            </div>

            {/* Malzeme Tablosu */}
            <div style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: '8px', 
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              {/* Tablo Başlığı */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 100px 150px 50px', 
                gap: '8px',
                padding: '12px 16px',
                background: '#1976d2',
                color: 'white',
                fontWeight: '600',
                fontSize: '13px'
              }}>
                <div>Malzeme</div>
                <div style={{ textAlign: 'center' }}>Miktar</div>
                <div>Kalem Notu</div>
                <div></div>
              </div>

              {/* Malzeme Satırları */}
              <div>
                {formData.items.map((item, index) => {
                  const filteredMats = getFilteredMaterialsForItem(index)
                  const selectedMaterial = item.materialId ? materials.find(m => m.id === item.materialId) : null
                  const searchQuery = (materialSearchQueries[index] || '').trim()
                  
                  return (
                    <div 
                      key={index}
                      ref={el => itemRefs.current[index] = el}
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 100px 150px 50px', 
                        gap: '8px',
                        padding: '12px 16px',
                        borderBottom: '1px solid #eee',
                        alignItems: 'start',
                        background: index % 2 === 0 ? '#fff' : '#fafafa'
                      }}
                    >
                      {/* Malzeme Seçimi */}
                      <div style={{ position: 'relative' }}>
                        {selectedMaterial ? (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '6px 10px',
                            background: '#e8f5e9',
                            borderRadius: '6px',
                            border: '1px solid #c8e6c9'
                          }}>
                            <span style={{ flex: 1, fontSize: '13px', color: '#2e7d32', fontWeight: '500' }}>
                              {selectedMaterial.code} - {selectedMaterial.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, 'materialId', '')}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#999', 
                                cursor: 'pointer',
                                fontSize: '18px',
                                lineHeight: 1,
                                padding: '0 4px'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              placeholder="🔍 Ara..."
                              value={materialSearchQueries[index] || ''}
                              onChange={(e) => handleMaterialSearch(index, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '13px'
                              }}
                            />
                            {/* Arama Sonuçları Dropdown */}
                            {searchQuery.length >= 2 && filteredMats.length > 0 && (
                              <div style={{ 
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 9999,
                                border: '1px solid #ddd', 
                                borderRadius: '6px', 
                                background: '#fff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                marginTop: '4px',
                                maxHeight: '200px',
                                overflowY: 'auto'
                              }}>
                                {filteredMats.map((m) => (
                                  <div
                                    key={m.id}
                                    onClick={() => {
                                      handleItemChange(index, 'materialId', m.id)
                                      handleMaterialSearch(index, '')
                                    }}
                                    style={{
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f0f0f0',
                                      fontSize: '13px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                  >
                                    <div style={{ fontWeight: '500' }}>{m.code} - {m.name}</div>
                                    {m.category && <div style={{ fontSize: '11px', color: '#888' }}>{m.category}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {searchQuery.length >= 2 && filteredMats.length === 0 && (
                              <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Sonuç yok</div>
                            )}
                          </>
                        )}
                        <input type="hidden" required value={item.materialId} />
                      </div>

                      {/* Miktar */}
                      <div>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0.01"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '13px',
                            textAlign: 'center'
                          }}
                        />
                      </div>

                      {/* Kalem Notu */}
                      <div>
                        <input
                          type="text"
                          placeholder="Not..."
                          value={item.notes}
                          onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      {/* Sil Butonu */}
                      <div style={{ textAlign: 'center' }}>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            style={{ 
                              background: '#ffebee',
                              border: '1px solid #ffcdd2',
                              color: '#c62828',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Kalem Ekle Butonu */}
              <div style={{ padding: '12px 16px', background: '#f5f5f5', borderTop: '1px solid #eee' }}>
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  style={{
                    background: 'none',
                    border: '1px dashed #1976d2',
                    color: '#1976d2',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    width: '100%'
                  }}
                >
                  + Yeni Kalem Ekle
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>
                {formData.items.length} kalem • {formData.items.filter(i => i.materialId).length} malzeme seçili
              </span>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '6px'
                }}
              >
                Talep Oluştur
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Talep No</th>
              <th>Proje</th>
              <th>Durum</th>
              <th>Tarih</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {displayRequests.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  {isPurchasingOnly ? 'Onaylanmış talep bulunmuyor.' : 'Henüz talep oluşturulmamış'}
                </td>
              </tr>
            ) : (
              displayRequests.map((request) => (
                <tr key={request.id} style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(request)}>
                  <td>{request.requestNumber}</td>
                  <td>{getProjectName(request.projectId)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(request.status)} `}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td>{new Date(request.requestDate).toLocaleDateString('tr-TR')}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {request.status === 'pending' && isPatronOrAdmin && (
                      <>
                        <button
                          className="btn btn-success"
                          onClick={() => handleStatusChange(request.id, 'approved')}
                          style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                        >
                          Onayla
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleStatusChange(request.id, 'rejected')}
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          Reddet
                        </button>
                      </>
                    )}
                    {request.status === 'approved' && isPatronOrAdmin && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSendToPurchasing(request.id)}
                        style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                      >
                        Satın Almaya Gönder
                      </button>
                    )}
                    {(request.status === 'approved' || request.status === 'sent_to_purchasing') && isPurchasing && (
                      <button
                        className="btn btn-info"
                        onClick={() => handleSendToSuppliers(request.id)}
                        style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                      >
                        Tedarikçilere Gönder
                      </button>
                    )}
                    {isPatronOrAdmin && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(request.id)}
                        style={{ fontSize: '12px', padding: '5px 10px', marginLeft: '5px' }}
                      >
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

export default MaterialRequests
