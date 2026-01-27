import { useState, useEffect } from 'react'
import { materialsApi, materialRequestsApi, quotationsApi } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState({
    materials: 0,
    requests: 0,
    quotations: 0,
    pendingRequests: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [materialsRes, requestsRes, quotationsRes] = await Promise.all([
        materialsApi.getAll(),
        materialRequestsApi.getAll(),
        quotationsApi.getAll(),
      ])

      const requests = requestsRes.data || []
      const pendingRequests = requests.filter(r => r.status === 'pending').length

      setStats({
        materials: materialsRes.data?.length || 0,
        requests: requests.length,
        quotations: quotationsRes.data?.length || 0,
        pendingRequests,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Yükleniyor...</div>
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-value">{stats.materials}</div>
            <div className="stat-label">Toplam Malzeme</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-value">{stats.requests}</div>
            <div className="stat-label">Malzeme Talepleri</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingRequests}</div>
            <div className="stat-label">Bekleyen Talepler</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">{stats.quotations}</div>
            <div className="stat-label">Teklifler</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
