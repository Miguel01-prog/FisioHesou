import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api.js";
import LoadingSpinner from "../../components/layout/LoadingSpinner.jsx";
import { showError } from "../../utils/alerts.js";
import { 
  FiSettings, 
  FiUsers, 
  FiLayers, 
  FiCalendar, 
  FiPlusCircle, 
  FiArrowRight, 
  FiFileText, 
  FiActivity, 
  FiClock, 
  FiCheckCircle, 
  FiTrendingUp,
  FiSearch,
  FiGrid
} from "react-icons/fi";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStats = async () => {
    try {
      const res = await api.get("/clients/stats");
      setStats(res.data.stats);
    } catch (err) {
      console.error("Error al obtener estadísticas del dashboard:", err);
      showError("Error", "No se pudieron cargar las estadísticas generales de la base de datos");
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

  // Filter recent patients or appointments based on search query
  const filteredPatients = (stats?.recentPatients || []).filter(p => {
    const fullName = `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || (p.area || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredAppointments = (stats?.recentAppointments || []).filter(c => {
    const fullName = `${c.nombres || ''} ${c.apellidoPaterno || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || (c.area || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate area distribution percentages
  const totalAreaAppts = (stats?.appointmentsByArea?.fisioterapia || 0) + (stats?.appointmentsByArea?.nutricion || 0);
  const fisioPct = totalAreaAppts > 0 ? Math.round(((stats?.appointmentsByArea?.fisioterapia || 0) / totalAreaAppts) * 100) : 50;
  const nutriPct = totalAreaAppts > 0 ? 100 - fisioPct : 50;

  return (
    <div className="dashboard-admin-container" style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      
      {/* 🚀 Header Principal con saludo y estado del motor */}
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.8rem" }}>⚡</span>
            <h1 style={{ color: "var(--primary)", fontSize: "1.8rem", fontWeight: "700", margin: 0 }}>
              Panel de Control General
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem", margin: 0 }}>
            Resumen en tiempo real de clínicas, pacientes, citas agendadas e historiales en MongoDB.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
            padding: "0.4rem 0.85rem",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.825rem",
            color: "#22c55e",
            fontWeight: "600"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }}></span>
            Base de Datos Conectada
          </div>
        </div>
      </header>

      {/* 📊 1. Tarjetas de Métricas Principal (KPIs Ejecutivos con Datos Reales) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        
        {/* KPI 1: Expedientes de Pacientes */}
        <div className="glass-card" style={{ padding: "1.35rem", borderRadius: "14px", display: "flex", alignItems: "center", gap: "1.1rem" }}>
          <div style={{ background: "rgba(99, 102, 241, 0.12)", color: "var(--primary)", padding: "0.95rem", borderRadius: "12px", fontSize: "1.6rem" }}>
            <FiUsers />
          </div>
          <div>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "block", fontWeight: "500" }}>Pacientes Totales</span>
            <span style={{ fontSize: "1.85rem", fontWeight: "700", color: "var(--text-main)", display: "block", lineHeight: "1.1" }}>
              {stats?.totalPatients || 0}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
              <FiTrendingUp style={{ color: "#22c55e" }} /> Expedientes activos
            </span>
          </div>
        </div>

        {/* KPI 2: Citas Agendadas */}
        <div className="glass-card" style={{ padding: "1.35rem", borderRadius: "14px", display: "flex", alignItems: "center", gap: "1.1rem" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981", padding: "0.95rem", borderRadius: "12px", fontSize: "1.6rem" }}>
            <FiCalendar />
          </div>
          <div>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "block", fontWeight: "500" }}>Citas Agendadas</span>
            <span style={{ fontSize: "1.85rem", fontWeight: "700", color: "var(--text-main)", display: "block", lineHeight: "1.1" }}>
              {stats?.totalAppointments || 0}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "600", marginTop: "4px", display: "block" }}>
              {stats?.todayAppointments || 0} Programadas para Hoy
            </span>
          </div>
        </div>

        {/* KPI 3: Notas SOAP & Historiales */}
        <div className="glass-card" style={{ padding: "1.35rem", borderRadius: "14px", display: "flex", alignItems: "center", gap: "1.1rem" }}>
          <div style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", padding: "0.95rem", borderRadius: "12px", fontSize: "1.6rem" }}>
            <FiFileText />
          </div>
          <div>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "block", fontWeight: "500" }}>Notas SOAP & Historiales</span>
            <span style={{ fontSize: "1.85rem", fontWeight: "700", color: "var(--text-main)", display: "block", lineHeight: "1.1" }}>
              {(stats?.totalSoapNotes || 0) + (stats?.totalHistories || 0)}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              {stats?.totalSoapNotes || 0} Notas | {stats?.totalHistories || 0} Anamnesis
            </span>
          </div>
        </div>

        {/* KPI 4: Clínicas / SaaS Multitenant */}
        <div className="glass-card" style={{ padding: "1.35rem", borderRadius: "14px", display: "flex", alignItems: "center", gap: "1.1rem" }}>
          <div style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6", padding: "0.95rem", borderRadius: "12px", fontSize: "1.6rem" }}>
            <FiSettings />
          </div>
          <div>
            <span style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "block", fontWeight: "500" }}>Clínicas & Especialistas</span>
            <span style={{ fontSize: "1.85rem", fontWeight: "700", color: "var(--text-main)", display: "block", lineHeight: "1.1" }}>
              {stats?.totalClients || 0}
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              {stats?.totalSpecialists || 0} Especialistas activos
            </span>
          </div>
        </div>

      </div>

      {/* 📈 2. Desglose Estadístico y Distribución de Áreas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        
        {/* Distribución por Especialidad */}
        <div className="auth-card card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
          <h2 style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: "600", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <FiActivity style={{ color: "var(--primary)" }} /> Distribución de Consultas por Área
          </h2>
          
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
              <span style={{ color: "var(--text-main)", fontWeight: "600" }}>Fisioterapia</span>
              <span style={{ color: "var(--primary)", fontWeight: "700" }}>{stats?.appointmentsByArea?.fisioterapia || 0} citas ({fisioPct}%)</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${fisioPct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "4px", transition: "width 0.5s ease" }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
              <span style={{ color: "var(--text-main)", fontWeight: "600" }}>Nutrición</span>
              <span style={{ color: "#10b981", fontWeight: "700" }}>{stats?.appointmentsByArea?.nutricion || 0} citas ({nutriPct}%)</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${nutriPct}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #06b6d4)", borderRadius: "4px", transition: "width 0.5s ease" }}></div>
            </div>
          </div>
        </div>

        {/* Estatus de Citas */}
        <div className="auth-card card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
          <h2 style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: "600", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <FiCheckCircle style={{ color: "#10b981" }} /> Estatus de las Citas Agendadas
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ padding: "0.85rem", background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: "10px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Programadas</span>
              <span style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--primary)" }}>
                {stats?.appointmentsByStatus?.programado || 0}
              </span>
            </div>

            <div style={{ padding: "0.85rem", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "10px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Completadas / Asistió</span>
              <span style={{ fontSize: "1.4rem", fontWeight: "700", color: "#10b981" }}>
                {(stats?.appointmentsByStatus?.completado || 0) + (stats?.appointmentsByStatus?.asistio || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="auth-card card" style={{ padding: "1.5rem", borderRadius: "14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: "600", marginBottom: "1rem" }}>
            Accesos Rápidos
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Link to="/admin/clinicas" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", height: "40px" }}>
              <FiPlusCircle /> Administrar Clínicas
            </Link>
            <Link to="/admin/users" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", height: "40px" }}>
              <FiUsers /> Registrar Especialista
            </Link>
          </div>
        </div>

      </div>

      {/* 🔍 Barra de Búsqueda para Filtrar Actividad en Vivo */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", maxWidth: "420px" }}>
          <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre de paciente o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ paddingLeft: "40px", height: "42px", borderRadius: "10px" }}
          />
        </div>
      </div>

      {/* 📋 3. Listas Detalladas de Datos Reales en MongoDB */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Expedientes de Pacientes Recientes */}
        <div className="auth-card card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FiUsers style={{ color: "var(--primary)" }} /> Expedientes de Pacientes Reales
            </h2>
          </div>

          {filteredPatients.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>
              No se encontraron expedientes registrados.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {filteredPatients.map((p) => (
                <div 
                  key={p._id} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "0.85rem 1rem", 
                    background: "rgba(255,255,255,0.02)", 
                    borderRadius: "10px", 
                    border: "1px solid rgba(255,255,255,0.05)" 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "0.9rem"
                    }}>
                      {(p.nombres || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.925rem", display: "block" }}>
                        {p.nombres} {p.apellidos}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        ID: <code style={{ color: "var(--primary)" }}>{p.identificadorPaciente}</code>
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: "0.75rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "6px",
                    background: (p.area || '').includes("fisio") ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    color: (p.area || '').includes("fisio") ? "var(--primary)" : "#10b981",
                    fontWeight: "600",
                    textTransform: "capitalize"
                  }}>
                    {p.area || "Fisioterapia"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas Citas Agendadas */}
        <div className="auth-card card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <FiCalendar style={{ color: "#10b981" }} /> Citas Registradas en Sistema
            </h2>
          </div>

          {filteredAppointments.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>
              No hay citas que coincidan con la búsqueda.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {filteredAppointments.map((c) => (
                <div 
                  key={c._id} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "0.85rem 1rem", 
                    background: "rgba(255,255,255,0.02)", 
                    borderRadius: "10px", 
                    border: "1px solid rgba(255,255,255,0.05)" 
                  }}
                >
                  <div>
                    <span style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.925rem", display: "block" }}>
                      {c.nombres} {c.apellidoPaterno}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FiClock size={12} /> {c.fechaCitaStr} | {c.horaCita} hrs
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      background: "rgba(34, 197, 94, 0.15)",
                      color: "#22c55e",
                      fontWeight: "600",
                      display: "inline-block",
                      marginBottom: "2px"
                    }}>
                      {c.estado || "Programado"}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", textTransform: "capitalize" }}>
                      {c.area}
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
