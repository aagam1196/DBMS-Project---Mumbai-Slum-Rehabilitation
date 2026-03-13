import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

export let authHeader = {}

export function setAuth(username, password) {
  const encoded = btoa(`${username}:${password}`)
  authHeader = { Authorization: `Basic ${encoded}` }
  localStorage.setItem('sra_auth', encoded)
}

export function loadAuth() {
  const stored = localStorage.getItem('sra_auth')
  if (stored) authHeader = { Authorization: `Basic ${stored}` }
  return !!stored
}

export function clearAuth() {
  authHeader = {}
  localStorage.removeItem('sra_auth')
}

const api = axios.create({ baseURL: BASE })
api.interceptors.request.use(cfg => {
  cfg.headers = { ...cfg.headers, ...authHeader }
  return cfg
})

export const getKPIs       = () => api.get('/api/dashboard/kpis').then(r => r.data)
export const getCharts     = () => api.get('/api/dashboard/charts').then(r => r.data)
export const searchBeneficiary = (q) => api.get(`/api/search/beneficiary?q=${encodeURIComponent(q)}`).then(r => r.data)
export const getViolations = (params) => api.get('/api/violations', { params }).then(r => r.data)
export const getBeneficiaries = (params) => api.get('/api/beneficiaries', { params }).then(r => r.data)
export const getBeneficiary = (id) => api.get(`/api/beneficiaries/${id}`).then(r => r.data)
export const createBeneficiary = (data) => api.post('/api/beneficiaries', data).then(r => r.data)
export const updateBeneficiary = (id, data) => api.patch(`/api/beneficiaries/${id}`, data).then(r => r.data)
export const deleteBeneficiary = (id) => api.delete(`/api/beneficiaries/${id}`).then(r => r.data)
export const updateViolation = (id, data) => api.patch(`/api/violations/${id}`, data).then(r => r.data)
export const getAllotments = (params) => api.get('/api/allotments', { params }).then(r => r.data)
export const createAllotment = (data) => api.post('/api/allotments', data).then(r => r.data)
export const getSlums      = () => api.get('/api/slums').then(r => r.data)
export const getBuildings  = () => api.get('/api/buildings').then(r => r.data)
export const getRentals    = () => api.get('/api/rentals').then(r => r.data)
export const healthCheck   = () => api.get('/health').then(r => r.data)
