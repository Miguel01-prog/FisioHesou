import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api.js";
import LoadingSpinner from "../../components/layout/LoadingSpinner.jsx";
import { showError } from "../../utils/alerts.js";
import { FiSettings, FiUsers, FiLayers, FiCalendar, FiPlusCircle, FiArrowRight } from "react-icons/fi";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get("/clients/stats");
      setStats(res.data.stats);
    } catch (err) {
      console.error("Error al obtener estadísticas del dashboard:", err);
      showError("Error", "No se pudieron cargar las estadísticas generales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-admin-container" style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Cabecera */}
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "var(--primary)", fontSize: "1.8rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
          🚀 Panel de Control General
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Supervisión global de consultorios, clínicas, barberías y especialistas del ecosistema.
        </p>
      </header>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* KPI 1: Clínicas */}
        <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "rgba(94, 80, 161, 0.15)", color: "var(--primary)", padding: "1rem", borderRadius: "10px", fontSize: "1.5rem" }}>
            <FiSettings />
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>Clínicas / Negocios</span>
            <span style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", display: "block", lineHeight: "1" }}>
              {stats?.totalClients || 0}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: "600" }}>
              {stats?.activeClients || 0} Activos
            </span>
          </div>
        </div>

        {/* KPI 2: Especialistas */}
        <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "1rem", borderRadius: "10px", fontSize: "1.5rem" }}>
            <FiUsers />
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>Especialistas Totales</span>
            <span style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-main)", display: "block", lineHeight: "1" }}>
              {stats?.totalSpecialists || 0}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Asociados a cuentas locales
            </span>
          </div>
        </div>

        {/* KPI 3: Plataforma */}
        <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "1rem", borderRadius: "10px", fontSize: "1.5rem" }}>
            <FiLayers />
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block" }}>Estado del Servidor</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#22c55e", display: "block", marginTop: "4px" }}>
              🟢 En Línea (SaaS)
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Aislamiento de base activo
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="auth-card card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "1rem", fontWeight: "600" }}>Accesos Directos de Administración</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link to="/admin/clinicas" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <FiPlusCircle /> Administrar Clínicas
          </Link>
          <Link to="/admin/users" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <FiPlusCircle /> Registrar Especialista
          </Link>
        </div>
      </div>

      {/* Grid Listas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
        
        {/* Clínicas Recientes */}
        <div className="auth-card card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: "600", margin: 0 }}>Negocios Registrados Recientemente</h2>
            <Link to="/admin/clinicas" style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              Ver todos <FiArrowRight />
            </Link>
          </div>

          {stats?.recentClients?.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>No hay clínicas registradas aún.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {stats?.recentClients?.map((c) => (
                <div key={c._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <span style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.95rem", display: "block" }}>{c.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Subdominio: <code style={{ color: "var(--primary)" }}>{c.subdomain}</code>
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {(c.services || []).map((s, i) => (
                      <span key={i} title={s.name} style={{ fontSize: "0.9rem" }}>{s.icon}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Especialistas Recientes */}
        <div className="auth-card card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: "600", margin: 0 }}>Últimos Especialistas Registrados</h2>
            <Link to="/admin/users" style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              Ver todos <FiArrowRight />
            </Link>
          </div>

          {stats?.recentSpecialists?.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>No hay especialistas creados aún.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {stats?.recentSpecialists?.map((u) => (
                <div key={u._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <span style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.95rem", display: "block" }}>{u.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Email: {u.email}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "6px",
                      background: "rgba(94, 80, 161, 0.15)",
                      color: "var(--primary)",
                      fontWeight: "600",
                      display: "block",
                      marginBottom: "2px"
                    }}>
                      {u.role === "fisioterapeuta" ? "Fisio" : "Nutri"}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {u.clientId?.name || "Sin clínica"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
