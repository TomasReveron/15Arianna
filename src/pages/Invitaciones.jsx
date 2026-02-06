import { useState, useEffect } from 'react'
import '../assets/css/admin.css'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { logout } from '../utils/auth'
import { useNavigate } from 'react-router-dom'
import GoldenParticles from '../components/GoldenParticles'

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

export default function Invitaciones() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToast()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } catch { return 'light' }
  })
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [participantsInput, setParticipantsInput] = useState(1)
  const [table, setTable] = useState('')
  const [creating, setCreating] = useState(false)

  async function fetchRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('invitations')
        .select('id, names, participants, view, accepted, created_at, table')
        .order('created_at', { ascending: false })

      if (err) throw err
      // Map DB rows to UI shape
      const mapped = (data || []).map((r) => {
        // intentar dividir names en nombre y apellido (split por último espacio)
        const names = (r.names || '').trim()
        let nombre = names
        let apellido = ''
        if (names) {
          const parts = names.split(' ')
          if (parts.length > 1) {
            apellido = parts.slice(-1).join(' ')
            nombre = parts.slice(0, -1).join(' ')
          }
        }
        return {
          id: r.id,
          nombre,
          apellido,
          participants: r.participants,
          visto: !!r.view,
          aceptado: !!r.accepted,
          created_at: r.created_at,
          table: r.table || ''
        }
      })
      setRows(mapped)
    } catch (err) {
      console.error(err)
      setError(err.message ?? 'Error al cargar invitaciones')
      toast.add({ title: 'Error', message: err.message ?? 'Error al cargar', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRows() }, [])

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', theme)
    } catch (e) { /* ignore */ }
  }, [theme])

  // Copiar link de invitación al portapapeles
  async function copyLink(id) {
    try {
      const url = `${location.origin}/invitacion/${id}`
      await navigator.clipboard.writeText(url)
      toast.add({ title: 'Copiado', message: 'Enlace copiado al portapapeles', type: 'success' })
    } catch (err) {
      console.error(err)
      toast.add({ title: 'Error', message: 'No se pudo copiar el enlace', type: 'error' })
    }
  }

  function viewLink(id) {
    const url = `${location.origin}/invitacion/${id}`
    window.open(url, '_blank', 'noopener')
  }

  async function handleLogout() {
    await logout()
    navigate('/admin')
  }

  return (
    <main className="admin-page">
      <GoldenParticles />
      <div className="admin-card admin-card--wide">
        <div className="admin-header">
          <h1 style={{display:'flex',alignItems:'center',gap:12, flexWrap: 'wrap'}}>
            <span style={{flex: 1}}>Invitaciones</span>
            <div style={{display:'flex', gap: 8}}>
              <button className="btn-ghost" onClick={() => navigate('/listado')} title="Ver Lista de Asistencia">
                Lista
              </button>
              <button className="btn-ghost" onClick={() => navigate('/sorteo')} title="Ir a Sorteo">
                Sorteo
              </button>
              <button className="icon-btn" onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </h1>
        </div>

        <section style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div className="meta">Lista de Invitados</div>
            <div className="buttons buttons--compact">
              <button className="btn-ghost" onClick={fetchRows} disabled={loading}>
                <span className="btn-icon"><RefreshIcon /></span>
                <span className="btn-text">{loading ? 'Cargando...' : 'Refrescar'}</span>
              </button>
              <button className="btn-primary" onClick={() => {
                setEditingId(null)
                setFirstName('')
                setLastName('')
                setParticipantsInput(1)
                setTable('')
                setShowModal(true)
              }}>
                <span className="btn-icon"><PlusIcon /></span>
                <span className="btn-text">Crear invitación</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="table-wrap">
              <table className="invit-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Acompañantes</th>
                    <th>Mesa</th>
                    <th>Visto</th>
                    <th>Aceptado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>{loading ? 'Cargando...' : 'No hay registros.'}</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id}>
                      <td>{r.nombre}</td>
                      <td>{r.apellido}</td>
                      <td>{r.participants ?? '-'}</td>
                      <td>{r.table || '-'}</td>
                      <td><span className={`badge ${r.visto ? 'badge--true' : 'badge--false'}`}>{r.visto ? 'Sí' : 'No'}</span></td>
                      <td><span className={`badge ${r.aceptado ? 'badge--true' : 'badge--false'}`}>{r.aceptado ? 'Sí' : 'No'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="actions-inline">
                          <button className="btn-ghost" onClick={() => {
                            setEditingId(r.id)
                            setFirstName(r.nombre)
                            setLastName(r.apellido)
                            setParticipantsInput(r.participants)
                            setTable(r.table)
                            setShowModal(true)
                          }} title="Editar invitación" style={{ marginRight: 8 }}>
                            <span className="btn-icon"><EditIcon /></span>
                            <span className="btn-text">Editar</span>
                          </button>
                          <button className="btn-ghost" onClick={() => viewLink(r.id)} title="Ver invitación" aria-label={`Ver invitación ${r.id}`}>
                            <span className="btn-icon"><EyeIcon /></span>
                            <span className="btn-text">Ver</span>
                          </button>
                          <button className="btn-primary" style={{ marginLeft: 8 }} onClick={() => copyLink(r.id)} title="Copiar enlace" aria-label={`Copiar enlace ${r.id}`}>
                            <span className="btn-icon"><CopyIcon /></span>
                            <span className="btn-text">Copiar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      {showModal && (
        <div className="modal-overlay" onMouseDown={() => setShowModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Editar invitación' : 'Crear invitación'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Cerrar">×</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!firstName.trim() || !lastName.trim()) {
                toast.add({ title: 'Error', message: 'Nombre y apellido son obligatorios', type: 'error' })
                return
              }
              const participants = participantsInput === '' ? 0 : Number(participantsInput)
              if (participants < 0) {
                toast.add({ title: 'Error', message: 'Participantes no puede ser negativo', type: 'error' })
                return
              }

              setCreating(true)
              try {
                const names = `${firstName.trim()} ${lastName.trim()}`
                
                if (editingId) {
                  // Editar
                  const { error: err } = await supabase
                    .from('invitations')
                    .update({ names, participants, table })
                    .eq('id', editingId)
                  
                  if (err) throw err
                  toast.add({ title: 'Actualizado', message: 'Invitación actualizada', type: 'success' })
                } else {
                  // Crear
                  const { error: err } = await supabase
                    .from('invitations')
                    .insert([{ names, participants, table, view: false, accepted: false }])
                  
                  if (err) throw err
                  toast.add({ title: 'Creado', message: 'Invitación agregada', type: 'success' })
                }

                setShowModal(false)
                setFirstName('')
                setLastName('')
                setParticipantsInput(1)
                setTable('')
                setEditingId(null)
                fetchRows()
              } catch (err) {
                console.error(err)
                toast.add({ title: 'Error', message: err.message ?? 'No se pudo guardar', type: 'error' })
              } finally {
                setCreating(false)
              }
            }}>
              <div className="row">
                <label style={{flex:1}}>
                  Nombre
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" />
                </label>
                <label style={{flex:1}}>
                  Apellido
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" />
                </label>
              </div>
              <div className="row">
                <label style={{flex:1}}>
                  Participantes
                  <input type="number" min={0} value={participantsInput} onChange={(e) => setParticipantsInput(e.target.value)} />
                </label>
                <label style={{flex:1}}>
                  Mesa
                  <input value={table} onChange={(e) => setTable(e.target.value)} placeholder="Ej. A-1" />
                </label>
              </div>
              <div className="actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Guardando...' : (editingId ? 'Guardar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
