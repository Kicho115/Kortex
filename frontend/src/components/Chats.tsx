import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createChat, listChats } from '../api/chats'
import type { ChatRead } from '../types/chat'
import type { UserRead } from '../types/user'
import './Chats.css'

interface ChatsProps {
  user: UserRead | null
  onLogin: () => void
  onRegister: () => void
}

export default function Chats({ user, onLogin, onRegister }: ChatsProps) {
  const [chats, setChats] = useState<ChatRead[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const sortedChats = useMemo(() => {
    return [...chats].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [chats])

  useEffect(() => {
    void loadChats()
  }, [])

  async function loadChats() {
    setLoading(true)
    setError(null)
    try {
      const data = await listChats()
      setChats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar los chats.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || creating) return

    setCreating(true)
    setError(null)
    try {
      const created = await createChat({ name: trimmed })
      setChats((prev) => [created, ...prev])
      setName('')
      navigate(`/chats/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el chat.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="chats">
      <header className="chats__header">
        <Link to="/" className="chats__brand">
          <span className="chats__brand-mark">K</span>
          <div>
            <p className="chats__eyebrow">Chats</p>
            <h1 className="chats__title">Sala de conversaciones</h1>
          </div>
        </Link>
        <div className="chats__user">
          {user ? (
            <div>
              <p className="chats__user-name">{user.name}</p>
              <p className="chats__user-email">{user.email}</p>
            </div>
          ) : (
            <div className="chats__auth">
              <button type="button" onClick={onLogin}>
                Iniciar sesión
              </button>
              <button type="button" onClick={onRegister}>
                Registrarse
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="chats__main">
        <section className="chats__create">
          <h2>Crea un nuevo chat</h2>
          <p>Los chats son públicos: cualquiera puede enviar mensajes.</p>
          <form onSubmit={handleCreate} className="chats__form">
            <input
              type="text"
              placeholder="Nombre del chat"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={60}
            />
            <button type="submit" disabled={creating}>
              {creating ? 'Creando…' : 'Crear'}
            </button>
          </form>
          {error && (
            <p className="chats__error" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="chats__list">
          <div className="chats__list-header">
            <h2>Chats disponibles</h2>
            <button type="button" onClick={loadChats} disabled={loading}>
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>

          {loading && <p className="chats__muted">Cargando chats…</p>}

          {!loading && sortedChats.length === 0 && (
            <div className="chats__empty">
              <p>No hay chats todavía.</p>
              <span>Crea el primero y empieza la conversación.</span>
            </div>
          )}

          <div className="chats__grid">
            {sortedChats.map((chat) => (
              <article key={chat.id} className="chats__card">
                <div>
                  <h3>{chat.name}</h3>
                  <p>
                    Creado el{' '}
                    {new Date(chat.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Link to={`/chats/${chat.id}`} className="chats__enter">
                  Abrir chat
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
