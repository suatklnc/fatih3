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
  const [editMode, setEditMode] = useState(false)
  const [editingRequestId, setEditingRequestId] = useState(null)
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
      
      if (editMode && editingRequestId) {
        // Düzenleme modu
        await materialRequestsApi.update(editingRequestId, requestData)
        alert('Talep başarıyla güncellendi.')
      } else {
        // Yeni talep
        await materialRequestsApi.create(requestData)
      }
      
      setShowForm(false)
      setEditMode(false)
      setEditingRequestId(null)
      setFormData({
        projectId: '',
        requiredDate: '',
        notes: '',
        items: [{ materialId: '', quantity: 0, notes: '' }],
      })
      setMaterialSearchQueries({})
      refreshRequests()
    } catch (error) {
      console.error('Error saving request:', error)
      const errorMsg = error.response?.data?.message || error.response?.data || error.message
      alert('Talep kaydedilirken hata oluştu: ' + errorMsg)
    }
  }

  // Düzenleme için talebi yükle
  const handleEdit = async (request) => {
    try {
      // Detayları yükle
      const res = await materialRequestsApi.getById(request.id)
      const detail = res.data
      
      // Malzemeleri yükle (form için gerekli)
      await loadMaterials()
      
      // Formu doldur
      setFormData({
        projectId: detail.projectId,
        requiredDate: detail.requiredDate ? detail.requiredDate.split('T')[0] : '',
        notes: detail.notes || '',
        items: detail.items?.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
          notes: item.notes || ''
        })) || [{ materialId: '', quantity: 0, notes: '' }]
      })
      
      setEditMode(true)
      setEditingRequestId(request.id)
      setShowForm(true)
      setShowDetail(false)
    } catch (error) {
      console.error('Error loading request for edit:', error)
      alert('Talep yüklenirken hata oluştu')
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
          if (showForm) {
            // Form kapatılırken reset
            setShowForm(false)
            setEditMode(false)
            setEditingRequestId(null)
            setFormData({
              projectId: '',
              requiredDate: '',
              notes: '',
              items: [{ materialId: '', quantity: 0, notes: '' }],
            })
            setMaterialSearchQueries({})
          } else {
            loadMaterials()
            setShowForm(true)
          }
        }}>
          {showForm ? 'İptal' : '+ Yeni Talep'}
        </button>
      </div>

      {showForm && (
        <div className="card request-form-card">
          {editMode && (
            <div className="edit-mode-banner">
              📝 Düzenleme Modu
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {/* Üst Bilgiler - Kompakt */}
            <div className="request-form-header">
              <div className="form-field">
                <label>Proje *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                >
                  <option value="">Seçiniz</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Tarih</label>
                <input
                  type="date"
                  value={formData.requiredDate}
                  onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                />
              </div>
              <div className="form-field form-field-note">
                <label>Not</label>
                <input
                  type="text"
                  placeholder="Talep notu..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Malzeme Listesi */}
            <div className="material-items-container">
              {formData.items.map((item, index) => {
                const filteredMats = getFilteredMaterialsForItem(index)
                const selectedMaterial = item.materialId ? materials.find(m => m.id === item.materialId) : null
                const searchQuery = (materialSearchQueries[index] || '').trim()
                
                return (
                  <div 
                    key={index}
                    ref={el => itemRefs.current[index] = el}
                    className="material-item-row"
                  >
                    {/* Malzeme Arama/Seçim */}
                    <div className="material-select-area">
                      {selectedMaterial ? (
                        <div className="selected-material">
                          <div className="selected-material-info">
                            <span className="selected-material-name">{selectedMaterial.name}</span>
                            <span className="selected-material-code">{selectedMaterial.code}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleItemChange(index, 'materialId', '')}
                            className="btn-clear-material"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="material-search-wrapper">
                          <input
                            type="text"
                            placeholder="🔍 Malzeme ara..."
                            value={materialSearchQueries[index] || ''}
                            onChange={(e) => handleMaterialSearch(index, e.target.value)}
                            className="material-search-input"
                          />
                          {searchQuery.length >= 2 && filteredMats.length > 0 && (
                            <div className="material-dropdown">
                              {filteredMats.map((m) => (
                                <div
                                  key={m.id}
                                  onClick={() => {
                                    handleItemChange(index, 'materialId', m.id)
                                    handleMaterialSearch(index, '')
                                  }}
                                  className="material-dropdown-item"
                                >
                                  <span className="dropdown-material-name">{m.name}</span>
                                  <span className="dropdown-material-code">{m.code}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchQuery.length >= 2 && filteredMats.length === 0 && (
                            <div className="no-results">Sonuç yok</div>
                          )}
                        </div>
                      )}
                      <input type="hidden" required value={item.materialId} />
                    </div>

                    {/* Miktar ve Sil */}
                    <div className="material-item-actions">
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        placeholder="Adet"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="quantity-input"
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="btn-remove-item"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Kalem Ekle */}
              <button 
                type="button" 
                onClick={handleAddItem}
                className="btn-add-item"
              >
                + Kalem Ekle
              </button>
            </div>

            {/* Footer */}
            <div className="request-form-footer">
              <span className="item-count">
                {formData.items.filter(i => i.materialId).length}/{formData.items.length} malzeme
              </span>
              <button type="submit" className="btn btn-primary btn-submit">
                {editMode ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
      <div className="card requests-card">
        <div className="table-responsive">
          <table className="requests-table">
            <thead>
              <tr>
                <th className="col-request-info">Talep</th>
                <th className="col-status">Durum</th>
                <th className="col-date hide-mobile">Tarih</th>
                <th className="col-request-actions">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {displayRequests.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                    {isPurchasingOnly ? 'Onaylanmış talep bulunmuyor.' : 'Henüz talep oluşturulmamış'}
                  </td>
                </tr>
              ) : (
                displayRequests.map((request) => (
                  <tr key={request.id} style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(request)}>
                    <td className="col-request-info">
                      <div className="request-info-cell">
                        <span className="request-project">{getProjectName(request.projectId)}</span>
                        <span className="request-number">{request.requestNumber}</span>
                      </div>
                    </td>
                    <td className="col-status">
                      <span className={`badge ${getStatusBadge(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="col-date hide-mobile">{new Date(request.requestDate).toLocaleDateString('tr-TR')}</td>
                    <td className="col-request-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="request-actions">
                        {request.status === 'pending' && (
                          <button
                            className="btn btn-icon btn-edit"
                            onClick={() => handleEdit(request)}
                            title="Düzenle"
                          >
                            <span className="btn-icon-text">✏️</span>
                            <span className="btn-full-text">Düzenle</span>
                          </button>
                        )}
                        {request.status === 'pending' && isPatronOrAdmin && (
                          <>
                            <button
                              className="btn btn-icon btn-approve"
                              onClick={() => handleStatusChange(request.id, 'approved')}
                              title="Onayla"
                            >
                              <span className="btn-icon-text">✓</span>
                              <span className="btn-full-text">Onayla</span>
                            </button>
                            <button
                              className="btn btn-icon btn-reject"
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                              title="Reddet"
                            >
                              <span className="btn-icon-text">✗</span>
                              <span className="btn-full-text">Reddet</span>
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && isPatronOrAdmin && (
                          <button
                            className="btn btn-icon btn-send"
                            onClick={() => handleSendToPurchasing(request.id)}
                            title="Satın Almaya Gönder"
                          >
                            <span className="btn-icon-text">📤</span>
                            <span className="btn-full-text">Satın Al</span>
                          </button>
                        )}
                        {(request.status === 'approved' || request.status === 'sent_to_purchasing') && isPurchasing && (
                          <button
                            className="btn btn-icon btn-supplier"
                            onClick={() => handleSendToSuppliers(request.id)}
                            title="Tedarikçilere Gönder"
                          >
                            <span className="btn-icon-text">📧</span>
                            <span className="btn-full-text">Tedarikçi</span>
                          </button>
                        )}
                        {isPatronOrAdmin && (
                          <button
                            className="btn btn-icon btn-delete"
                            onClick={() => handleDelete(request.id)}
                            title="Sil"
                          >
                            <span className="btn-icon-text">🗑️</span>
                            <span className="btn-full-text">Sil</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  )
}

export default MaterialRequests
