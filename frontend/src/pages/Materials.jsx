import { useState, useEffect } from 'react'
import { materialsApi } from '../services/api'
import './Materials.css'

function Materials() {
  const [materials, setMaterials] = useState([])
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
      setMaterials(response.data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

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
      alert('Malzeme başarıyla silindi.')
    } catch (error) {
      console.error('Error deleting material:', error)
      const message = error.response?.data?.message || 'Malzeme silinirken hata oluştu'
      alert(message)
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
        <table>
          <thead>
            <tr>
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
            {materials.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  Henüz malzeme eklenmemiş
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr key={material.id}>
                  <td>{material.code}</td>
                  <td>{material.name}</td>
                  <td>{material.unit}</td>
                  <td>{material.category || '-'}</td>
                  <td>{material.stockQuantity}</td>
                  <td>{material.minStockLevel}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(material.id)}
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

export default Materials
