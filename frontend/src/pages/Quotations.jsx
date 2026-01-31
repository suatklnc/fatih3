import { useState, useEffect } from 'react'
import { quotationsApi, materialRequestsApi, materialsApi, suppliersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Quotations.css'

function Quotations() {
  const { userProfile } = useAuth()
  const userRole = (userProfile?.roleName || '').toLowerCase().trim()
  const isPatronOrAdmin = userRole === 'patron' || userRole === 'yönetici'

  const [quotations, setQuotations] = useState([])
  const [requests, setRequests] = useState([])
  const [materials, setMaterials] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedQuotation, setSelectedQuotation] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareRequestId, setCompareRequestId] = useState(null)
  const [quotationDetails, setQuotationDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // İlk yükleme - malzemeler HARİÇ (lazy load)
  const loadData = async () => {
    try {
      const [quotationsRes, requestsRes, suppliersRes] = await Promise.all([
        quotationsApi.getAll(),
        materialRequestsApi.getAll(),
        suppliersApi.getAll(),
      ])
      setQuotations(quotationsRes.data || [])
      setRequests(requestsRes.data || [])
      setSuppliers(suppliersRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Malzemeleri yükle - detay görüntülendiğinde
  const loadMaterialsIfNeeded = async () => {
    if (materials.length > 0) return
    try {
      const res = await materialsApi.getAll()
      setMaterials(res.data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  // Sadece teklifleri yenile
  const refreshQuotations = async () => {
    try {
      const res = await quotationsApi.getAll()
      setQuotations(res.data || [])
    } catch (error) {
      console.error('Error refreshing quotations:', error)
    }
  }

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.name || supplierId?.substring(0, 8) + '...'
  }

  const getRequestNumber = (requestId) => {
    const request = requests.find(r => r.id === requestId)
    return request?.requestNumber || requestId?.substring(0, 8) + '...'
  }

  const getMaterialName = (materialId) => {
    const material = materials.find(m => m.id === materialId)
    return material?.name || materialId?.substring(0, 8) + '...'
  }

  const getMaterialCode = (materialId) => {
    const material = materials.find(m => m.id === materialId)
    return material?.code || '-'
  }

  const handleViewDetails = async (quotation) => {
    setSelectedQuotation(quotation)
    setLoadingDetails(true)
    setShowDetailModal(true)
    
    // Malzeme isimlerini göstermek için yükle
    loadMaterialsIfNeeded()

    try {
      const response = await quotationsApi.getById(quotation.id)
      setQuotationDetails(response.data)
    } catch (error) {
      console.error('Error loading quotation details:', error)
      setQuotationDetails(null)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCompare = (requestId) => {
    setCompareRequestId(requestId)
    setShowCompareModal(true)
  }

  const getQuotationsForRequest = (requestId) => {
    return quotations.filter(q => q.requestId === requestId)
  }

  const handleStatusChange = async (id, status) => {
    try {
      await quotationsApi.updateStatus(id, status)
      refreshQuotations()
      setShowDetailModal(false)
      setShowCompareModal(false)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Durum güncellenirken hata oluştu')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Bu teklifi silmek istediğinize emin misiniz?')) {
      try {
        await quotationsApi.delete(id)
        refreshQuotations()
        setShowDetailModal(false)
        setShowCompareModal(false)
      } catch (error) {
        console.error('Error deleting quotation:', error)
        alert('Teklif silinirken hata oluştu')
      }
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

  // Group quotations by request for comparison view
  const groupedByRequest = quotations.reduce((acc, q) => {
    if (!acc[q.requestId]) {
      acc[q.requestId] = []
    }
    acc[q.requestId].push(q)
    return acc
  }, {})

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="quotations">
      <div className="page-header">
        <h1>Teklifler</h1>
      </div>

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
                  Henüz onay bekleyen veya onaylanmış teklif bulunmamaktadır.
                </td>
              </tr>
            ) : (
              quotations.map((quotation) => (
                <tr key={quotation.id} onClick={() => handleViewDetails(quotation)} style={{ cursor: 'pointer' }}>
                  <td>{quotation.quotationNumber}</td>
                  <td>
                    {getRequestNumber(quotation.requestId)}
                    {getQuotationsForRequest(quotation.requestId).length > 1 && (
                      <span className="badge badge-info" style={{ marginLeft: '5px', fontSize: '10px' }}>
                        {getQuotationsForRequest(quotation.requestId).length} teklif
                      </span>
                    )}
                  </td>
                  <td>{getSupplierName(quotation.supplierId)}</td>
                  <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                    {quotation.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'}
                  </td>
                  <td>{quotation.currency}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(quotation.status)}`}>
                      {getStatusText(quotation.status)}
                    </span>
                  </td>
                  <td>{new Date(quotation.quotationDate).toLocaleDateString('tr-TR')}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-info"
                      onClick={() => handleViewDetails(quotation)}
                      style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                    >
                      Detay
                    </button>
                    {getQuotationsForRequest(quotation.requestId).length > 1 && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleCompare(quotation.requestId)}
                        style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                      >
                        Karşılaştır
                      </button>
                    )}
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
                          style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                        >
                          Reddet
                        </button>
                      </>
                    )}
                    {isPatronOrAdmin && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(quotation.id)}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
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

      {/* Detail Modal */}
      {showDetailModal && selectedQuotation && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Teklif Detayları</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Teklif No</span>
                  <span className="detail-value">{selectedQuotation.quotationNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Talep No</span>
                  <span className="detail-value">{getRequestNumber(selectedQuotation.requestId)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tedarikçi</span>
                  <span className="detail-value">{getSupplierName(selectedQuotation.supplierId)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Toplam Tutar</span>
                  <span className="detail-value highlight">
                    {selectedQuotation.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedQuotation.currency}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Teklif Tarihi</span>
                  <span className="detail-value">{new Date(selectedQuotation.quotationDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Geçerlilik Tarihi</span>
                  <span className="detail-value">
                    {selectedQuotation.validUntil ? new Date(selectedQuotation.validUntil).toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Durum</span>
                  <span className={`badge ${getStatusBadge(selectedQuotation.status)}`}>
                    {getStatusText(selectedQuotation.status)}
                  </span>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="detail-notes">
                  <strong>📝 Notlar:</strong>
                  <p>{selectedQuotation.notes}</p>
                </div>
              )}

              <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>📦 Teklif Kalemleri</h3>
              {loadingDetails ? (
                <p>Yükleniyor...</p>
              ) : quotationDetails?.items?.length > 0 ? (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Kod</th>
                      <th>Malzeme</th>
                      <th>Miktar</th>
                      <th>Birim Fiyat</th>
                      <th>Toplam</th>
                      <th>Teslim (Gün)</th>
                      <th>Not</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotationDetails.items.map((item, index) => (
                      <tr key={index}>
                        <td>{getMaterialCode(item.materialId)}</td>
                        <td>{getMaterialName(item.materialId)}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unitPrice?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 'bold' }}>
                          {item.totalPrice?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td>{item.deliveryTime || '-'}</td>
                        <td>{item.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#666' }}>Kalem bilgisi bulunamadı</p>
              )}

              <div className="modal-actions">
                {selectedQuotation.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusChange(selectedQuotation.id, 'approved')}
                    >
                      ✅ Onayla
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleStatusChange(selectedQuotation.id, 'rejected')}
                    >
                      ❌ Reddet
                    </button>
                  </>
                )}
                {isPatronOrAdmin && (
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(selectedQuotation.id)}
                  >
                    🗑️ Sil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && compareRequestId && (
        <div className="modal-overlay" onClick={() => setShowCompareModal(false)}>
          <div className="modal-content modal-xlarge" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚖️ Teklif Karşılaştırma</h2>
              <button className="modal-close" onClick={() => setShowCompareModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="compare-info">
                <strong>Talep:</strong> {getRequestNumber(compareRequestId)} -
                <strong> {getQuotationsForRequest(compareRequestId).length}</strong> teklif karşılaştırılıyor
              </p>

              <div className="compare-cards">
                {getQuotationsForRequest(compareRequestId)
                  .sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0))
                  .map((q, index) => {
                    const isCheapest = index === 0
                    return (
                      <div
                        key={q.id}
                        className={`compare-card ${isCheapest ? 'cheapest' : ''} ${q.status === 'approved' ? 'approved' : ''}`}
                      >
                        {isCheapest && <div className="cheapest-badge">🏆 En Uygun</div>}
                        {q.status === 'approved' && <div className="approved-badge">✅ Onaylandı</div>}

                        <h3>{getSupplierName(q.supplierId)}</h3>
                        <p className="compare-quotation-no">{q.quotationNumber}</p>

                        <div className="compare-price">
                          {q.totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {q.currency}
                        </div>

                        <div className="compare-details">
                          <p><strong>Tarih:</strong> {new Date(q.quotationDate).toLocaleDateString('tr-TR')}</p>
                          <p><strong>Geçerlilik:</strong> {q.validUntil ? new Date(q.validUntil).toLocaleDateString('tr-TR') : '-'}</p>
                          <p>
                            <strong>Durum:</strong>{' '}
                            <span className={`badge ${getStatusBadge(q.status)}`}>
                              {getStatusText(q.status)}
                            </span>
                          </p>
                        </div>

                        {q.notes && (
                          <p className="compare-notes"><em>{q.notes}</em></p>
                        )}

                        <div className="compare-actions">
                          <button
                            className="btn btn-info"
                            onClick={() => {
                              setShowCompareModal(false)
                              handleViewDetails(q)
                            }}
                            style={{ fontSize: '12px', marginRight: '5px' }}
                          >
                            Detay
                          </button>
                          {q.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-success"
                                onClick={() => handleStatusChange(q.id, 'approved')}
                                style={{ fontSize: '12px', marginRight: '5px' }}
                              >
                                Onayla
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleStatusChange(q.id, 'rejected')}
                                style={{ fontSize: '12px', marginRight: '5px' }}
                              >
                                Reddet
                              </button>
                            </>
                          )}
                          {isPatronOrAdmin && (
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(q.id)}
                              style={{ fontSize: '12px' }}
                            >
                              Sil
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quotations
