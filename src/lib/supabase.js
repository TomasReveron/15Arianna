import { createClient } from '@supabase/supabase-js'
// Si las variables de entorno faltan, usaremos mocks locales
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Intentamos cargar los mocks (están en src/mocks/supabaseMock.js)
let mock = null
try {
  // import estático (no dinámico) para que Vite los incluya en dev
  // eslint-disable-next-line import/no-unresolved
  // @ts-ignore
  mock = await import('../mocks/supabaseMock.js')
} catch (e) {
  // No hacer nada; mock puede no existir en casos extraños
}

function createMockSupabase() {
  const { mockInvitations = [], fetchInvitations, fetchInvitationById, insertInvitation, updateInvitation, markViewed } = (mock && mock.default) ? mock.default : (mock || {})

  // Estado interno de sesión de autenticación simulada
  let session = null

  function createFrom(table) {
    // Solo implementamos la API mínima que la app usa para `invitations`
    const tableName = table
    const chain = {
      _filters: [],
      _order: null,
      select(selectStr) {
        this._select = selectStr
        return this
      },
      order(column, opts = {}) {
        this._order = { column, opts }
        return this
      },
      eq(key, value) {
        this._filters.push({ type: 'eq', key, value })
        return this
      },
      not(key, op, value) {
        this._filters.push({ type: 'not', key, op, value })
        return this
      },
      maybeSingle() {
        // Ejecutar la consulta ahora y devolver maybeSingle
        return (async () => {
          const rows = await fetchInvitations ? fetchInvitations() : Promise.resolve(mockInvitations)
          let data = rows
          for (const f of this._filters) {
            if (f.type === 'eq') data = data.filter(r => String(r[f.key]) === String(f.value))
            if (f.type === 'not') {
              if (f.op === 'is' && f.value === null) data = data.filter(r => r[f.key] !== null)
            }
          }
          return { data: data[0] ?? null, error: null }
        })()
      },
      async then(cb) {
        // Soporta .then after update/insert
        const res = await this.execute()
        return cb(res)
      },
      async execute() {
        // Ejecuta select
        const rows = await (fetchInvitations ? fetchInvitations() : Promise.resolve(mockInvitations))
        let data = rows
        for (const f of this._filters) {
          if (f.type === 'eq') data = data.filter(r => String(r[f.key]) === String(f.value))
          if (f.type === 'not') {
            if (f.op === 'is' && f.value === null) data = data.filter(r => r[f.key] !== null)
          }
        }
        if (this._order && this._order.column) {
          const col = this._order.column
          const asc = !(this._order.opts && this._order.opts.ascending === false)
          data = data.slice().sort((a, b) => {
            const A = a[col] ?? ''
            const B = b[col] ?? ''
            if (asc) return String(A).localeCompare(String(B), undefined, { numeric: true })
            return String(B).localeCompare(String(A), undefined, { numeric: true })
          })
        }
        return { data, error: null }
      },
      insert(payload) {
        return (async () => {
          const row = await (insertInvitation ? insertInvitation(Array.isArray(payload) ? payload[0] : payload) : Promise.resolve(null))
          return { data: [row], error: null }
        })()
      },
      update(patch) {
        this._updatePatch = patch
        return this
      },
      async executeUpdate() {
        // Aplica update sobre filas que cumplan filtros (se usa eq id)
        const rows = mockInvitations
        const targets = rows.filter(r => {
          return this._filters.every(f => {
            if (f.type === 'eq') return String(r[f.key]) === String(f.value)
            return true
          })
        })
        const results = []
        for (const t of targets) {
          const updated = await (updateInvitation ? updateInvitation(t.id, this._updatePatch) : Promise.resolve({ ...t, ...this._updatePatch }))
          results.push(updated)
        }
        return { data: results, error: null }
      },
      async thenUpdate(cb) {
        const res = await this.executeUpdate()
        return cb(res)
      }
    }

    // alias: .then after update/insert uses .then implemented arriba; but some calls do .update(...).eq(...)
    // Para facilitar, añadimos métodos comunes que llaman a execute/executeUpdate
    chain.not = chain.not.bind(chain)
    chain.eq = chain.eq.bind(chain)

    // Proxies para que .eq(... ) en adelante puedan terminar en una Promise resolviendo { data, error }
    chain.select = chain.select.bind(chain)

    // Añadimos implementaciones de uso directo: .update(...).eq(...)
    chain.eq = function (key, value) {
      this._filters.push({ type: 'eq', key, value })
      // Cuando .eq sigue a .update, retornamos objeto con then que ejecuta update
      const self = this
      return {
        then: async (cb) => {
          const res = await self.executeUpdate()
          return cb(res)
        }
      }
    }

    return chain
  }

  return {
    from: createFrom,
    auth: {
      async signUp({ email, password }) {
        // crear usuario simulado
        const user = { id: `mock_${Date.now()}`, email, startedAt: new Date().toISOString() }
        // no mantenemos contraseñas
        session = { user, access_token: 'mock-token' }
        return { data: { user }, error: null }
      },
      async signInWithPassword({ email, password }) {
        const user = { id: `mock_${Date.now()}`, email, startedAt: new Date().toISOString() }
        session = { user, access_token: 'mock-token' }
        return { data: { session }, error: null }
      },
      async signOut() {
        session = null
        return { error: null }
      },
      async getUser() {
        return { data: { user: session ? session.user : null }, error: null }
      },
      async getSession() {
        return { data: { session }, error: null }
      }
    }
  }
}

// Si hay URL y KEY, exportamos el cliente real, si no, usamos el mock
let supabaseClient
if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('Supabase: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY, usando mocks locales')
  supabaseClient = createMockSupabase()
}

export const supabase = supabaseClient
