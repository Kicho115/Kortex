import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import DocumentsPanel, { type UploadedDocument } from "./DocumentsPanel";
import KortexIcon from "./icons/KortexIcon";
import type { UserRead } from "../types/user";
import "./Home.css";

type HomeView = "chat" | "documents";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface HomeProps {
  user: UserRead | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function SidebarIcon({
  children,
  active = false,
  label,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={
        active
          ? "home__sidebar-btn home__sidebar-btn--active"
          : "home__sidebar-btn"
      }
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SidebarLink({
  children,
  label,
  to,
}: {
  children: ReactNode;
  label: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="home__sidebar-btn"
      aria-label={label}
      title={label}
    >
      {children}
    </Link>
  );
}

export default function Home({ user }: HomeProps) {
  const [view, setView] = useState<HomeView>("chat");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLLIElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const greeting = useMemo(() => getGreeting(), []);
  const hasMessages = messages.length > 0;

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);
    scrollToBottom();

    await new Promise((resolve) => setTimeout(resolve, 700));

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        documents.length > 0
          ? `Tienes ${documents.length} documento(s) cargado(s). Pronto Kortex usará ese contexto para responder con precisión.`
          : "Gracias por tu mensaje. Carga documentos en la sección Documentos para obtener respuestas con contexto de tu empresa.",
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsThinking(false);
    scrollToBottom();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  function handleQuickAttach(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;

    const newDocs: UploadedDocument[] = [];
    for (const file of Array.from(files)) {
      const name = file.name.toLowerCase();
      if (![".csv", ".txt", ".pdf"].some((ext) => name.endsWith(ext))) continue;
      if (
        documents.some(
          (d) => d.file.name === file.name && d.file.size === file.size,
        )
      ) {
        continue;
      }
      newDocs.push({ id: crypto.randomUUID(), file, status: "ready" });
    }

    if (newDocs.length > 0) {
      setDocuments((prev) => [...prev, ...newDocs]);
      setView("documents");
    }
    event.target.value = "";
  }

  return (
    <div className="home">
      <aside className="home__sidebar" aria-label="Navegación">
        <Link
          to="/home"
          className="home__sidebar-logo"
          aria-label="Kortex inicio"
        >
          <span className="home__sidebar-logo-mark">
            <KortexIcon />
          </span>
        </Link>

        <nav className="home__sidebar-nav">
          <SidebarIcon
            label="Chat"
            active={view === "chat"}
            onClick={() => setView("chat")}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 9h10M7 13h6M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </SidebarIcon>
          {user && (
            <SidebarLink label="Chats" to="/chats">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 6h10a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9l-4 3v-3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </SidebarLink>
          )}
          <SidebarIcon label="Historial">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="8"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M12 8v4l2.5 2.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </SidebarIcon>
          <SidebarIcon
            label="Documentos"
            active={view === "documents"}
            onClick={() => setView("documents")}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 4h8l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M16 4v4h4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </SidebarIcon>
          <SidebarIcon label="Conocimiento">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <ellipse
                cx="12"
                cy="6"
                rx="7"
                ry="3"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </SidebarIcon>
        </nav>

        <div className="home__sidebar-footer">
          <SidebarIcon label="Ajustes">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </SidebarIcon>
          <div className="home__sidebar-avatar" aria-hidden="true" />
        </div>
      </aside>

      <div className="home__main">
        <header className="home__header">
          <Link to="/home" className="home__brand">
            <span className="home__brand-mark">
              <KortexIcon />
            </span>
            <span className="home__brand-name">Kortex</span>
          </Link>
          {view === "documents" && (
            <span className="home__header-badge">Documentos</span>
          )}
        </header>

        <div
          className={`home__content ${view === "chat" && hasMessages ? "home__content--chat" : ""} ${view === "documents" ? "home__content--docs" : ""}`}
        >
          {view === "documents" ? (
            <DocumentsPanel
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          ) : !hasMessages ? (
            <div className="home__empty">
              <div className="home__empty-icon-wrap">
                <div className="home__empty-glow" aria-hidden="true" />
                <div className="home__empty-icon">
                  <KortexIcon />
                </div>
              </div>
              <p className="home__greeting">
                {greeting}, <span>ahí</span>
              </p>
              <h1 className="home__headline">
                ¿Qué vamos a <em>analizar</em> hoy?
              </h1>
            </div>
          ) : (
            <ul className="home__messages" aria-live="polite">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "home__message home__message--user"
                      : "home__message home__message--assistant"
                  }
                >
                  <div className="home__message-bubble">{message.content}</div>
                </li>
              ))}
              {isThinking && (
                <li className="home__message home__message--assistant">
                  <div className="home__message-bubble home__message-bubble--typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </li>
              )}
              <li ref={messagesEndRef} className="home__messages-anchor" />
            </ul>
          )}
        </div>

        {view === "chat" && (
          <div className="home__composer-wrap">
            <form className="home__composer" onSubmit={handleSubmit}>
              <div className="home__composer-top">
                <svg
                  className="home__sparkle"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10 2l1.2 4.2L15.5 7.5 11.2 8.8 10 13l-1.2-4.2L4.5 7.5 8.8 6.2 10 2Z"
                    fill="currentColor"
                  />
                  <path
                    d="M16 12l.6 2.1 2.1.6-2.1.6-.6 2.1-.6-2.1-2.1-.6 2.1-.6.6-2.1 2.1-.6-2.1-.6Z"
                    fill="currentColor"
                    opacity="0.7"
                  />
                </svg>
                <textarea
                  className="home__input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Carga tus datos y analízalos como un profesional en segundos"
                  rows={hasMessages ? 2 : 1}
                  aria-label="Mensaje para Kortex"
                />
              </div>
              <div className="home__composer-bottom">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="home__file-input"
                  accept=".csv,.txt,.pdf"
                  multiple
                  onChange={handleQuickAttach}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  className="home__attach"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M12.5 4.5l-5 5a2.12 2.12 0 1 0 3 3l5.5-5.5a3.12 3.12 0 0 0-4.5-4.5l-6 6a4.62 4.62 0 0 0 6.5 6.5l5.5-5.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Adjuntar</span>
                  <span className="home__attach-hint">CSV, TXT o PDF</span>
                  {documents.length > 0 && (
                    <span className="home__attach-count">
                      {documents.length}
                    </span>
                  )}
                </button>
                <button
                  type="submit"
                  className="home__send"
                  disabled={!input.trim() || isThinking}
                  aria-label="Enviar mensaje"
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M4 10l12-5v10l-12-5Zm0 0h8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
