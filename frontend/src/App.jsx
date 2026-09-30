import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import Login from "./pages/Login";
import Result from "./pages/Result";

export default function App() {
  const { token, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Interview Coach</Link>
        {token && (
          <button className="ghost" onClick={logout}>Log out</button>
        )}
      </header>
      <main className="page">
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/interview/:id" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
