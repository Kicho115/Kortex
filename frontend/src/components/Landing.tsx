import { Link } from "react-router-dom";
import type { UserRead } from "../types/user";
import KortexIcon from "./icons/KortexIcon";
import "./Landing.css";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 10h12m0 0l-4-4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LandingProps {
  user: UserRead | null;
  onLogin: () => void;
  onRegister: () => void;
}

export default function Landing({ user, onLogin, onRegister }: LandingProps) {
  return (
    <section className="landing" aria-label="Inicio">
      <header className="landing__header">
        <Link
          to="/home"
          className="landing__brand"
          aria-label="Ir al chat de Kortex"
        >
          <span className="landing__brand-pill">
            <KortexIcon className="landing__logo-icon" />
            <span>Kortex</span>
          </span>
        </Link>

        <button type="button" className="landing__login" onClick={onLogin}>
          Log In
        </button>
      </header>

      <main className="landing__hero">
        <p className="landing__eyebrow">INTELIGENCIA ARTIFICIAL EMPRESARIAL</p>

        <h1 className="landing__headline">
          La IA que conoce <em>TODO</em> de tu empresa
        </h1>

        <p className="landing__subtext">
          Centraliza el conocimiento de tu organización y obtén respuestas
          precisas al instante. Sin configuraciones complejas.
        </p>

        {user && (
          <p className="landing__welcome">
            Bienvenido, <strong>{user.name}</strong>
          </p>
        )}

        <button type="button" className="landing__cta" onClick={onRegister}>
          Probar Ahora GRATIS
          <span className="landing__cta-arrow">
            <ArrowIcon />
          </span>
        </button>
      </main>

      <div className="landing__glow" aria-hidden="true" />
    </section>
  );
}
