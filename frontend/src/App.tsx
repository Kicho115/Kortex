import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Auth from "./components/Auth";
import ChatRoom from "./components/ChatRoom";
import Chats from "./components/Chats";
import Home from "./components/Home";
import Landing from "./components/Landing";
import type { UserRead } from "./types/user";

export default function App() {
  const [user, setUser] = useState<UserRead | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

  if (authMode) {
    return (
      <Auth
        initialMode={authMode}
        onBack={() => setAuthMode(null)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setAuthMode(null);
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Landing
              user={user}
              onLogin={() => setAuthMode("login")}
              onRegister={() => setAuthMode("register")}
            />
          }
        />
        <Route path="/home" element={<Home user={user} />} />
        <Route
          path="/chats"
          element={
            user ? (
              <Chats
                user={user}
                onLogin={() => setAuthMode("login")}
                onRegister={() => setAuthMode("register")}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/chats/:chatId"
          element={
            user ? (
              <ChatRoom
                user={user}
                onLogin={() => setAuthMode("login")}
                onRegister={() => setAuthMode("register")}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
