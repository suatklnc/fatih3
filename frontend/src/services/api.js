import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Materials API
export const materialsApi = {
  getAll: () => api.get('/materials'),
  getPaged: (page = 1, pageSize = 50, search = '') => {
    const params = new URLSearchParams({ page, pageSize })
    if (search) params.append('search', search)
    return api.get(`/materials?${params.toString()}`)
  },
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  deleteAll: () => api.delete('/materials/delete-all'),
  importFromExcel: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    // Omit Content-Type so axios/browser sends multipart/form-data with boundary (default api uses application/json)
    return api.post('/materials/import', formData, {
      headers: { 'Content-Type': false }
    })
  },
}

// Material Requests API
export const materialRequestsApi = {
  getAll: () => api.get('/materialrequests'),
  getById: (id) => api.get(`/materialrequests/${id}`),
  create: (data) => api.post('/materialrequests', data),
  updateStatus: (id, status) => api.put(`/materialrequests/${id}/status`, { status }),
  sendToPurchasing: (id) => api.put(`/materialrequests/${id}/send-to-purchasing`),
  sendToSuppliers: (id, supplierIds) => api.put(`/materialrequests/${id}/send-to-suppliers`, supplierIds),
  delete: (id) => api.delete(`/materialrequests/${id}`),
}

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
}

// Quotations API
export const quotationsApi = {
  getAll: () => api.get('/quotations'),
  getById: (id) => api.get(`/quotations/${id}`),
  getByRequestId: (requestId) => api.get(`/quotations/request/${requestId}`),
  create: (data) => api.post('/quotations', data),
  updateStatus: (id, status) => api.put(`/quotations/${id}/status`, { status }),
  delete: (id) => api.delete(`/quotations/${id}`),
}

// Notifications API
export const notificationsApi = {
  getUserNotifications: (userId) => api.get(`/notifications/user/${userId}`),
  markAsRead: (notificationId) => api.post(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.post(`/notifications/user/${userId}/read-all`),
}

// Companies API
export const companiesApi = {
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
}

// Projects API
export const projectsApi = {
  getAll: () => api.get('/projects'),
  getByCompanyId: (companyId) => api.get(`/projects/company/${companyId}`),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getAllWithAuth: () => api.get('/users/with-auth'),
  getById: (id) => api.get(`/users/${id}`),
  getByEmail: (email) => api.get(`/users/by-email?email=${encodeURIComponent(email || '')}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/users/roles'),
}

export default api
