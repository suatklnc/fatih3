import { useState, useEffect } from 'react'
import { materialsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Materials.css'

function Materials() {
  const { userProfile } = useAuth()
  const userRole = (userProfile?.roleName || '').toLowerCase().trim()
  const isPatronOrAdmin = userRole === 'patron' || userRole === 'yönetici'

  const [materials, setMaterials] = useState([])
  const [filteredMaterials, setFilteredMaterials] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMaterials, setSelectedMaterials] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [importLoading, setImportLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    unit: 'adet',
    category: '',
    stockQuantity: 0,
    minStockLevel: 0,
  })

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const response = await materialsApi.getAll()
      const materialsData = response.data || []
      setMaterials(materialsData)
      setFilteredMaterials(materialsData)
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMaterials(materials)
      return
    }
    const query = searchQuery.toLowerCase().trim()
    const filtered = materials.filter(m => 
      (m.code?.toLowerCase().includes(query) || '') ||
      (m.name?.toLowerCase().includes(query) || '') ||
      (m.category?.toLowerCase().includes(query) || '') ||
      (m.description?.toLowerCase().includes(query) || '')
    )
    setFilteredMaterials(filtered)
  }, [searchQuery, materials])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await materialsApi.create(formData)
      console.log('Material created successfully:', response.data)
      setShowForm(false)
      setFormData({
        code: '',
        name: '',
        description: '',
        unit: 'adet',
        category: '',
        stockQuantity: 0,
        minStockLevel: 0,
      })
      loadMaterials()
    } catch (error) {
      console.error('Error creating material:', error)
      // Veri kaydedilmiş olabilir, sayfayı yenile
      if (error.response?.status === 201 || error.response?.status === 200) {
        setShowForm(false)
        loadMaterials()
      } else {
        alert('Malzeme eklenirken hata oluştu: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) return

    try {
      await materialsApi.delete(id)
      loadMaterials()
      setSelectedMaterials(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      alert('Malzeme başarıyla silindi.')
    } catch (error) {
      console.error('Error deleting material:', error)
      const message = error.response?.data?.message || 'Malzeme silinirken hata oluştu'
      alert(message)
    }
  }

  const handleToggleSelect = (id) => {
    setSelectedMaterials(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedMaterials.size === filteredMaterials.length) {
      setSelectedMaterials(new Set())
    } else {
      setSelectedMaterials(new Set(filteredMaterials.map(m => m.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedMaterials.size === 0) {
      alert('Lütfen silmek için en az bir malzeme seçiniz.')
      return
    }
    const count = selectedMaterials.size
    if (!confirm(`${count} malzemeyi silmek istediğinize emin misiniz?`)) return

    const ids = Array.from(selectedMaterials)
    let successCount = 0
    let failCount = 0

    for (const id of ids) {
      try {
        await materialsApi.delete(id)
        successCount++
      } catch (error) {
        console.error(`Error deleting material ${id}:`, error)
        failCount++
      }
    }

    loadMaterials()
    setSelectedMaterials(new Set())
    
    if (failCount === 0) {
      alert(`${successCount} malzeme başarıyla silindi.`)
    } else {
      alert(`${successCount} malzeme silindi, ${failCount} malzeme silinirken hata oluştu.`)
    }
  }

  const handleDeleteAll = async () => {
    if (materials.length === 0) {
      alert('Silinecek malzeme bulunamadı.')
      return
    }
    if (!confirm(`UYARI: Tüm malzemeleri (${materials.length} adet) silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return
    if (!confirm('Bu işlem TÜM malzemeleri kalıcı olarak silecek. Devam etmek istiyor musunuz?')) return

    setLoading(true)
    try {
      const response = await materialsApi.deleteAll()
      alert(response.data?.message || 'Tüm malzemeler silindi.')
      loadMaterials()
      setSelectedMaterials(new Set())
    } catch (error) {
      console.error('Error deleting all materials:', error)
      alert('Toplu silme hatası: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    try {
      const res = await materialsApi.importFromExcel(file)
      const d = res.data
      loadMaterials()
      const msg = `${d.imported ?? 0} malzeme eklendi.${d.skipped ? ` ${d.skipped} satır atlandı.` : ''}${d.errors?.length ? ` Hatalar: ${d.errors.join('; ')}` : ''}`
      alert(msg)
    } catch (err) {
      alert('Excel içe aktarma hatası: ' + (err.response?.data?.message || err.message))
    } finally {
      setImportLoading(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="materials">
      <div className="page-header">
        <h1>Malzeme Havuzu</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="excel-import"
            onChange={handleImportExcel}
            disabled={importLoading}
          />
          <label htmlFor="excel-import" className="btn" style={{ marginBottom: 0, cursor: importLoading ? 'not-allowed' : 'pointer' }}>
            {importLoading ? 'İçe aktarılıyor...' : '📥 Excel\'den İçe Aktar'}
          </label>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'İptal' : '+ Yeni Malzeme'}
          </button>
          {isPatronOrAdmin && selectedMaterials.size > 0 && (
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              🗑️ Seçili Malzemeleri Sil ({selectedMaterials.size})
            </button>
          )}
          {isPatronOrAdmin && materials.length > 0 && (
            <button 
              className="btn" 
              onClick={handleDeleteAll}
              style={{ background: '#8B0000', color: 'white' }}
            >
              ⚠️ Tümünü Sil ({materials.length})
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Malzeme ara (kod, ad, kategori, açıklama)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1',
              minWidth: '250px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                padding: '10px 15px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2>Yeni Malzeme Ekle</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Malzeme Kodu *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Malzeme Adı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Açıklama</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Birim *</label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="adet">Adet</option>
                  <option value="kg">Kilogram</option>
                  <option value="m">Metre</option>
                  <option value="m2">Metrekare</option>
                  <option value="m3">Metreküp</option>
                  <option value="lt">Litre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stok Miktarı</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Minimum Stok Seviyesi</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">Kaydet</button>
          </form>
        </div>
      )}

      <div className="card">
        {filteredMaterials.length > 0 && (
          <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedMaterials.size === filteredMaterials.length && filteredMaterials.length > 0}
                onChange={handleSelectAll}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Tümünü Seç ({selectedMaterials.size} seçili)</span>
            </label>
            <span style={{ color: '#666', fontSize: '14px' }}>
              {filteredMaterials.length} malzeme gösteriliyor {materials.length !== filteredMaterials.length && `(${materials.length} toplam)`}
            </span>
          </div>
        )}
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table style={{ width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 1 }}>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Kod</th>
              <th>Ad</th>
              <th>Birim</th>
              <th>Kategori</th>
              <th>Stok</th>
              <th>Min. Stok</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz malzeme eklenmemiş'}
                </td>
              </tr>
            ) : (
              filteredMaterials.map((material) => (
                <tr key={material.id} style={{ backgroundColor: selectedMaterials.has(material.id) ? '#f0f8ff' : 'transparent' }}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedMaterials.has(material.id)}
                      onChange={() => handleToggleSelect(material.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td>{material.code}</td>
                  <td>{material.name}</td>
                  <td>{material.unit}</td>
                  <td>{material.category || '-'}</td>
                  <td>{material.stockQuantity}</td>
                  <td>{material.minStockLevel}</td>
                  <td>
                    {isPatronOrAdmin && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(material.id)}
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
      </div>
    </div>
  )
}

export default Materials
