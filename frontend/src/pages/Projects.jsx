import { useState, useEffect } from 'react'
import { projectsApi, companiesApi } from '../services/api'
import './Materials.css'

function Projects() {
  const [projects, setProjects] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [filterCompanyId, setFilterCompanyId] = useState('')
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    description: '',
    status: 'active',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projectsRes, companiesRes] = await Promise.all([
        projectsApi.getAll(),
        companiesApi.getAll()
      ])
      setProjects(projectsRes.data || [])
      setCompanies(companiesRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      companyId: '',
      name: '',
      description: '',
      status: 'active',
      startDate: '',
      endDate: '',
    })
    setEditingProject(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }

      if (editingProject) {
        await projectsApi.update(editingProject.id, data)
      } else {
        await projectsApi.create(data)
      }
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Proje kaydedilirken hata oluştu: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEdit = (project) => {
    setFormData({
      companyId: project.companyId,
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
    })
    setEditingProject(project)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return

    try {
      await projectsApi.delete(id)
      loadData()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Proje silinirken hata oluştu')
    }
  }

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || '-'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Aktif',
      'completed': 'Tamamlandı',
      'on_hold': 'Beklemede',
      'cancelled': 'İptal'
    }
    return labels[status] || status
  }

  const filteredProjects = filterCompanyId
    ? projects.filter(p => p.companyId === filterCompanyId)
    : projects

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="materials">
      <div className="page-header">
        <h1>Projeler</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : '+ Yeni Proje'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingProject ? 'Proje Düzenle' : 'Yeni Proje Ekle'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Firma *</label>
                <select
                  required
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                >
                  <option value="">Firma Seçin</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Proje Adı *</label>
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
                <label>Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Aktif</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="on_hold">Beklemede</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>
              <div className="form-group">
                <label>Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                {editingProject ? 'Güncelle' : 'Kaydet'}
              </button>
              {editingProject && (
                <button type="button" className="btn" onClick={resetForm}>
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="card projects-card">
        <div className="projects-filter">
          <select
            value={filterCompanyId}
            onChange={(e) => setFilterCompanyId(e.target.value)}
            className="filter-select"
          >
            <option value="">Tüm Firmalar</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>

        <div className="table-responsive">
          <table className="projects-table">
            <thead>
              <tr>
                <th className="col-project-name">Proje</th>
                <th className="col-project-status">Durum</th>
                <th className="col-project-date hide-mobile">Bitiş</th>
                <th className="col-project-actions">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                    Henüz proje eklenmemiş
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="col-project-name">
                      <div className="project-name-cell">
                        <span className="project-name">{project.name}</span>
                        <span className="project-company">{getCompanyName(project.companyId)}</span>
                      </div>
                    </td>
                    <td className="col-project-status">
                      <span className={`status-badge status-${project.status}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </td>
                    <td className="col-project-date hide-mobile">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="col-project-actions">
                      <div className="action-buttons-compact">
                        <button
                          type="button"
                          className="btn btn-icon btn-edit"
                          onClick={() => handleEdit(project)}
                          title="Düzenle"
                        >
                          <span className="btn-icon-text">✏️</span>
                          <span className="btn-full-text">Düzenle</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon btn-delete"
                          onClick={() => handleDelete(project.id)}
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

export default Projects
