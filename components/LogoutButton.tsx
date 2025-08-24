"use client";
import * as React from "react";

export function LogoutButton() {
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("No se pudo cerrar la sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn btn-stop" onClick={handleLogout} disabled={loading}>
      {loading ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  );
}
