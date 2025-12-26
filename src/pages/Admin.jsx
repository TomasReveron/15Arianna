import { useState, useEffect } from 'react'
import { registerAdmin, loginAdmin, logout, getSession, getAdmin, isAuthenticated } from '../utils/auth'
import '../assets/css/admin.css'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import GoldenParticles from '../components/GoldenParticles'

const LoginIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
)

const RegisterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

export default function Admin() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  const toast = useToast()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } catch { return 'light' }
  })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const session = await getSession()
      if (mounted && session) {
        setUser(session.user ?? session)
        // si ya hay sesión, redirigir a invitaciones
        try { navigate('/invitaciones') } catch {}
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', theme)
    } catch (e) { }
  }, [theme])

  function clearForm() {
    setEmail('')
    setPassword('')
    setConfirm('')
    setError(null)
    setMessage(null)
  }

  async function handleRegister(e) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    if (password !== confirm) {
      setLoading(false)
      return setError('Las contraseñas no coinciden.')
    }
    const res = await registerAdmin({ email: email.trim(), password })
    setLoading(false)
    if (!res.ok) {
      setError(res.message)
      toast.add({ title: 'Error', message: res.message, type: 'error' })
      return
    }
    setMessage(res.message)
    toast.add({ title: 'OK', message: res.message, type: 'success' })
    clearForm()
    setMode('login')
  }

  async function handleLogin(e) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    const res = await loginAdmin(email.trim(), password)
    setLoading(false)
    if (!res.ok) {
      setError(res.message)
      toast.add({ title: 'Error', message: res.message, type: 'error' })
      return
    }
    // res.session es un objeto con access_token y user
    setUser(res.session.user ?? res.session)
    setMessage(res.message)
    toast.add({ title: 'OK', message: res.message, type: 'success' })
    clearForm()
    // redirigir a /invitaciones
    navigate('/invitaciones')
  }

  async function handleLogout() {
    await logout()
    setUser(null)
    setMessage('Sesión cerrada.')
    toast.add({ title: 'OK', message: 'Sesión cerrada', type: 'info' })
  }

  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [adminExists, setAdminExists] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const a = await getAdmin()
      if (!mounted) return
      setAdminExists(!!a)
      setCheckingAdmin(false)
    })()
    return () => { mounted = false }
  }, [])

  const [loading, setLoading] = useState(false)

  return (
    <main className="admin-page">
      <GoldenParticles />
      <div className="admin-card">
        <div className="admin-header">
          <h1>
            <span>Panel de administrador</span>
          </h1>
        </div>
          <div className="panel">
            {user ? (
              <div className="sessionBox">
                <h2>Bienvenido</h2>
                <p className="small">Conectado como <strong>{user.email}</strong></p>
                <div className="buttons">
                  <button className="btn-primary" onClick={handleLogout}>
                    <span className="btn-icon"><LogoutIcon /></span>
                    <span className="btn-text">Cerrar sesión</span>
                  </button>
                </div>
                <div style={{marginTop:8}} className="small">Sesión iniciada: {new Date(user.startedAt).toLocaleString()}</div>
              </div>
            ) : (
              <>
                <div className="toggle">
                  <button onClick={() => { setMode('login'); setError(null); setMessage(null) }} disabled={mode==='login'}>Iniciar sesión</button>
                  <button onClick={() => { setMode('register'); setError(null); setMessage(null) }} disabled={mode==='register'}>Registrarse</button>
                </div>

                {error && <div className="msg msg--error">{error}</div>}
                {message && <div className="msg msg--ok">{message}</div>}

                {mode === 'register' ? (
                  <form onSubmit={handleRegister}>
                    <label>
                      Email
                      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ejemplo.com" />
                    </label>
                    <label>
                      Contraseña
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
                    </label>
                    <label>
                      Confirmar contraseña
                      <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmar contraseña" />
                    </label>
                    <div className="buttons">
                      <button className="btn-primary" type="submit" disabled={loading}>
                        <span className="btn-icon"><RegisterIcon /></span>
                        <span className="btn-text">{loading ? 'Creando...' : 'Crear administrador'}</span>
                      </button>
                      <button className="btn-ghost" type="button" onClick={() => { setMode('login'); clearForm() }}>
                        <span className="btn-icon"><BackIcon /></span>
                        <span className="btn-text">Volver</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLogin}>
                    <label>
                      Email
                      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ejemplo.com" />
                    </label>
                    <label>
                      Contraseña
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" />
                    </label>
                    <div className="buttons">
                      <button className="btn-primary" type="submit" disabled={loading}>
                        <span className="btn-icon"><LoginIcon /></span>
                        <span className="btn-text">{loading ? 'Entrando...' : 'Entrar'}</span>
                      </button>
                      <button className="btn-ghost" type="button" onClick={() => { setMode('register'); clearForm() }} disabled={checkingAdmin ? true : undefined}>
                        <span className="btn-icon"><RegisterIcon /></span>
                        <span className="btn-text">Crear cuenta</span>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
    </main>
  )
}
