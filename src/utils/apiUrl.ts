const raw = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
export const API_URL = raw.replace(/\/+$/, '')
