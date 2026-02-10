// supabaseMock.js
// Mocks basados en las consultas reales que usa la app (tabla `invitations`).
// Contiene al menos 10 registros de ejemplo y helpers que simulan llamadas asíncronas.

// Formato de cada entrada observado en el repositorio:
// { id, names, participants, view, accepted, created_at, table, ishere, isvirtual }

const now = () => new Date().toISOString()

export const mockInvitations = [
  { id: 1, names: 'María López', participants: 1, view: true, accepted: true, created_at: now(), table: '1', ishere: true, isvirtual: false },
  { id: 2, names: 'Juan Pérez', participants: 0, view: true, accepted: false, created_at: now(), table: null, ishere: false, isvirtual: false },
  { id: 3, names: 'Lucía García', participants: 2, view: false, accepted: true, created_at: now(), table: '2', ishere: false, isvirtual: false },
  { id: 4, names: 'Carlos Fernández', participants: 0, view: true, accepted: true, created_at: now(), table: '2', ishere: false, isvirtual: false },
  { id: 5, names: 'Ana Martínez', participants: 1, view: false, accepted: false, created_at: now(), table: '3', ishere: false, isvirtual: true },
  { id: 6, names: 'Pedro Sánchez', participants: 3, view: true, accepted: true, created_at: now(), table: '4', ishere: true, isvirtual: false },
  { id: 7, names: 'Sofía Ramírez', participants: 0, view: true, accepted: true, created_at: now(), table: '2', ishere: false, isvirtual: false },
  { id: 8, names: 'Miguel Torres', participants: 2, view: false, accepted: false, created_at: now(), table: null, ishere: false, isvirtual: false },
  { id: 9, names: 'Valentina Ruiz', participants: 1, view: true, accepted: true, created_at: now(), table: '5', ishere: false, isvirtual: false },
  { id: 10, names: 'Diego Gómez', participants: 0, view: false, accepted: true, created_at: now(), table: '3', ishere: false, isvirtual: false },
  { id: 11, names: 'Camila Ortega', participants: 1, view: true, accepted: false, created_at: now(), table: '3', ishere: false, isvirtual: false },
  { id: 12, names: 'Andrés Molina', participants: 0, view: true, accepted: true, created_at: now(), table: '1', ishere: false, isvirtual: false }
]

// Simula latencia de red
const simulateDelay = (value, ms = 250) => new Promise((resolve) => setTimeout(() => resolve(value), ms))

// Helpers que emulan operaciones que la app usa habitualmente
export async function fetchInvitations({ acceptedOnly = false } = {}) {
  let data = [...mockInvitations]
  if (acceptedOnly) data = data.filter(i => !!i.accepted)
  return simulateDelay(data)
}

export async function fetchInvitationById(id) {
  const item = mockInvitations.find(i => String(i.id) === String(id)) || null
  return simulateDelay(item)
}

export async function insertInvitation(payload) {
  const nextId = Math.max(...mockInvitations.map(i => i.id)) + 1
  const row = {
    id: nextId,
    names: payload.names ?? '',
    participants: Number(payload.participants ?? 0),
    view: !!payload.view,
    accepted: !!payload.accepted,
    created_at: payload.created_at ?? now(),
    table: payload.table ?? null,
    ishere: !!payload.ishere,
    isvirtual: !!payload.isvirtual
  }
  mockInvitations.push(row)
  return simulateDelay(row)
}

export async function updateInvitation(id, patch) {
  const idx = mockInvitations.findIndex(i => String(i.id) === String(id))
  if (idx === -1) return simulateDelay(null)
  mockInvitations[idx] = { ...mockInvitations[idx], ...patch }
  return simulateDelay(mockInvitations[idx])
}

export async function toggleIshere(id) {
  const idx = mockInvitations.findIndex(i => String(i.id) === String(id))
  if (idx === -1) return simulateDelay(null)
  mockInvitations[idx].ishere = !mockInvitations[idx].ishere
  return simulateDelay(mockInvitations[idx])
}

export async function markViewed(id) {
  return updateInvitation(id, { view: true })
}

export default {
  mockInvitations,
  fetchInvitations,
  fetchInvitationById,
  insertInvitation,
  updateInvitation,
  toggleIshere,
  markViewed
}
