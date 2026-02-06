import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import '../assets/css/admin.css' // Reutilizamos estilos básicos
import GoldenParticles from '../components/GoldenParticles'

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
  
  const SquareIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  )

export default function Listado() {
  const [invitados, setInvitados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInvitadosAceptados()
  }, [])

  async function fetchInvitadosAceptados() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('invitations')
        .select('id, names, participants, accepted, ishere, table')
        .eq('accepted', true)

      if (err) throw err

      const mapped = (data || []).map((r) => {
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
          names: r.names,
          nombre,
          apellido,
          participants: r.participants,
          ishere: !!r.ishere,
          table: r.table || '-'
        }
      })

      // Ordenar por mesa numéricamente (poniendo los guiones al final)
      mapped.sort((a, b) => {
        if (a.table === '-' && b.table === '-') return 0
        if (a.table === '-') return 1
        if (b.table === '-') return -1
        return String(a.table).localeCompare(String(b.table), undefined, { numeric: true })
      })
      
      setInvitados(mapped)
    } catch (err) {
      console.error(err)
      setError('Error al cargar la lista de invitados')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAsistencia(id, currentStatus) {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ ishere: !currentStatus })
        .eq('id', id)

      if (error) throw error

      setInvitados(prev => prev.map(inv =>
        inv.id === id ? { ...inv, ishere: !currentStatus } : inv
      ))
    } catch (err) {
      console.error('Error actualizando asistencia:', err)
      // Opcional: mostrar toast de error
    }
  }

  // El total de personas es la suma del titular (1) + sus acompañantes
  const totalPersonas = invitados.reduce((acc, curr) => acc + 1 + (curr.participants || 0), 0)
  const totalLlegaron = invitados.filter(inv => inv.ishere).reduce((acc, curr) => acc + 1 + (curr.participants || 0), 0)


  return (
    <div className="admin-page">
      <GoldenParticles />
      <div className="admin-card admin-card--wide">
        <div className="admin-header">
          <h1>Listado de Invitados Confirmados</h1>
        </div>

        {loading && <p className="loading-text">Cargando...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="admin-content">
            <div className="stats-bar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', color: 'var(--inv-gold)', flexWrap: 'wrap' }}>
              <span><strong>Total Invitaciones:</strong> {invitados.length}</span>
              <span>|</span>
              <span><strong>Total Personas:</strong> {totalPersonas}</span>
              <span>|</span>
              <span><strong>Han llegado:</strong> {totalLlegaron}</span>
            </div>
            
            <div className="table-wrap">
              <table className="invit-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Mesa</th>
                    <th>Acompañantes</th>
                    <th>Asistencia</th>
                  </tr>
                </thead>
                <tbody>
                  {invitados.map((invitado) => (
                    <tr key={invitado.id} style={{ opacity: invitado.ishere ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                      <td>{invitado.nombre}</td>
                      <td>{invitado.apellido}</td>
                      <td>{invitado.table}</td>
                      <td>{invitado.participants}</td>
                      <td>
                        <button
                          onClick={() => toggleAsistencia(invitado.id, invitado.ishere)}
                          className="icon-btn"
                          style={{ 
                            color: invitado.ishere ? '#2ecc71' : 'rgba(255,255,255,0.5)', 
                            border: invitado.ishere ? '1px solid #2ecc71' : '1px solid rgba(255,255,255,0.2)',
                            background: invitado.ishere ? 'rgba(46, 204, 113, 0.1)' : 'transparent',
                            margin: '0 auto'
                          }}
                          title={invitado.ishere ? 'Marcar como ausente' : 'Marcar como presente'}
                        >
                          {invitado.ishere ? <CheckIcon /> : <SquareIcon />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invitados.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No hay invitados confirmados aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
