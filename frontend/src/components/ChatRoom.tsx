import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getChat, listMessages, sendMessage } from "../api/chats";
import { getUser } from "../api/users";
import type { ChatRead, MessageRead } from "../types/chat";
import type { UserRead } from "../types/user";
import "./ChatRoom.css";

interface ChatRoomProps {
  user: UserRead | null;
  onLogin: () => void;
  onRegister: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const WS_BASE = (() => {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicit) return explicit;
  try {
    const url = new URL(API_BASE);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${url.host}`;
  } catch {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
  }
})();

export default function ChatRoom({ user, onLogin, onRegister }: ChatRoomProps) {
  const params = useParams();
  const chatId = useMemo(() => Number(params.chatId), [params.chatId]);
  const [chat, setChat] = useState<ChatRead | null>(null);
  const [messages, setMessages] = useState<MessageRead[]>([]);
  const [userMap, setUserMap] = useState<Record<number, UserRead>>({});
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user) {
      setUserMap((prev) => ({ ...prev, [user.id]: user }));
    }
  }, [user]);

  useEffect(() => {
    if (!Number.isFinite(chatId)) return;
    void loadChat();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!Number.isFinite(chatId)) return;

    let cancelled = false;
    let reconnectTimeout: number | null = null;

    const connect = () => {
      if (cancelled) return;

      const socket = new WebSocket(`${WS_BASE}/ws/chats/${chatId}`);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as
            | MessageRead
            | { error?: string };
          if ("id" in data) {
            setMessages((prev) =>
              prev.some((message) => message.id === data.id)
                ? prev
                : [...prev, data],
            );
          }
        } catch {
          /* ignore malformed payloads */
        }
      };

      socket.onclose = () => {
        if (wsRef.current === socket) {
          wsRef.current = null;
        }
        if (!cancelled) {
          reconnectTimeout = window.setTimeout(connect, 1000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeout !== null) {
        window.clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [chatId]);

  useEffect(() => {
    const uniqueIds = Array.from(
      new Set(messages.map((message) => message.sender_id)),
    );
    const missing = uniqueIds.filter((id) => !userMap[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(
      missing.map(async (id) => {
        try {
          return await getUser(id);
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setUserMap((prev) => {
        const next = { ...prev };
        for (const fetched of results) {
          if (fetched) next[fetched.id] = fetched;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [messages, userMap]);

  async function loadChat() {
    setLoading(true);
    setError(null);
    try {
      const [chatData, messageData] = await Promise.all([
        getChat(chatId),
        listMessages(chatId),
      ]);
      setChat(chatData);
      setMessages(messageData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el chat.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    if (!user?.id) {
      setError("Inicia sesión para enviar mensajes.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      const socket = wsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            sender_id: user.id,
            content: trimmed,
          }),
        );
        setContent("");
      } else {
        const message = await sendMessage(chatId, {
          sender_id: user.id,
          content: trimmed,
        });
        setMessages((prev) => [...prev, message]);
        setContent("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el mensaje.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-room">
      <header className="chat-room__header">
        <Link to="/chats" className="chat-room__back">
          ← Chats
        </Link>
        <div className="chat-room__title">
          <h1>{chat?.name ?? "Cargando…"}</h1>
          <p>
            {chat
              ? `Chat #${chat.id} · creado el ${new Date(chat.created_at).toLocaleDateString("es-ES")}`
              : "Preparando conversación"}
          </p>
        </div>
        <div className="chat-room__auth">
          {user ? (
            <div>
              <p className="chat-room__user">{user.name}</p>
              <span>{user.email}</span>
            </div>
          ) : (
            <div className="chat-room__auth-buttons">
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

      <main className="chat-room__main">
        <section className="chat-room__messages">
          {loading && <p className="chat-room__muted">Cargando mensajes…</p>}
          {!loading && messages.length === 0 && (
            <div className="chat-room__empty">
              <p>No hay mensajes todavía.</p>
              <span>Inicia la conversación con el primer mensaje.</span>
            </div>
          )}

          <div className="chat-room__list">
            {messages.map((message) => (
              <article key={message.id} className="chat-room__bubble">
                <div className="chat-room__bubble-meta">
                  <span>
                    {userMap[message.sender_id]?.name ??
                      `Usuario ${message.sender_id}`}
                  </span>
                  <time>
                    {new Date(message.created_at).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p>{message.content}</p>
              </article>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </section>

        <aside className="chat-room__composer">
          <h2>Enviar mensaje</h2>
          <p>Este chat es público: cualquiera puede escribir.</p>
          <p className="chat-room__identity">
            Enviando como {user?.name ?? "Invitado"}
          </p>

          <form onSubmit={handleSend} className="chat-room__form">
            <label>
              <span>Mensaje</span>
              <textarea
                rows={4}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Escribe tu mensaje aquí…"
                required
              />
            </label>
            {error && (
              <p className="chat-room__error" role="alert">
                {error}
              </p>
            )}
            <div className="chat-room__actions">
              <button type="button" onClick={loadChat} disabled={loading}>
                Recargar
              </button>
              <button type="submit" disabled={sending || !user}>
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </form>
        </aside>
      </main>
    </div>
  );
}
