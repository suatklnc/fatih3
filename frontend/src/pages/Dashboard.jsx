import { useState, useEffect } from 'react'
import { materialsApi, materialRequestsApi, quotationsApi } from '../services/api'
import './Dashboard.css'

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="stat-card skeleton-card">
    <div className="stat-icon skeleton-icon">
      <div className="skeleton-pulse"></div>
    </div>
    <div className="stat-info">
      <div className="skeleton-value skeleton-pulse"></div>
      <div className="skeleton-label skeleton-pulse"></div>
    </div>
  </div>
)

function Dashboard() {
  const [stats, setStats] = useState({
    materials: null,
    requests: null,
    quotations: null,
    pendingRequests: null,
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
      // Set to 0 on error so UI still shows
      setStats({
        materials: 0,
        requests: 0,
        quotations: 0,
        pendingRequests: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: '📦', value: stats.materials, label: 'Toplam Malzeme' },
    { icon: '📝', value: stats.requests, label: 'Malzeme Talepleri' },
    { icon: '⏳', value: stats.pendingRequests, label: 'Bekleyen Talepler' },
    { icon: '💰', value: stats.quotations, label: 'Teklifler' },
  ]

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        {loading ? (
          // Skeleton loading state
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          // Actual content with staggered animation
          statCards.map((card, index) => (
            <div
              key={card.label}
              className="stat-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{card.value?.toLocaleString('tr-TR') ?? '-'}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard
