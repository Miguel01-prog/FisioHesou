import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api.js";
import LoadingSpinner from "../../components/layout/LoadingSpinner.jsx";
import { showError } from "../../utils/alerts.js";
import { FiPlus, FiSearch, FiEdit2, FiExternalLink, FiSettings } from "react-icons/fi";

export default function ClinicasPage() {
  const navigate = useNavigate();
  const [clinicas, setClinicas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const fetchClinicas = async () => {
    try {
      const res = await api.get("/clients");
      setClinicas(res.data.clients || []);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudieron cargar las clínicas registradas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicas();
  }, []);

  // Filter clinics based on search query
  const filteredClinicas = clinicas.filter((c) => {
    const nameMatch = c.name.toLowerCase().includes(searchText.toLowerCase());
    const subdomainMatch = c.subdomain.toLowerCase().includes(searchText.toLowerCase());
    return nameMatch || subdomainMatch;
  });

  return (
    <div className="clinicas-list-container" style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>

      {/* Cabecera */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: "var(--primary)", fontSize: "1.8rem", fontWeight: "700", margin: 0 }}>
            🏢 Directorio de Clínicas SaaS
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "5px 0 0 0" }}>
            Administra los consultorios independientes, sus módulos habilitados y sus etiquetas de marca blanca.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/clinicas/crear")}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "45px" }}
        >
          <FiPlus /> Registrar Nueva Clínica
        </button>
      </div>

      {/* Contenedor Unificado (Fondo de Tarjeta Principal) */}
      <div className="auth-card card" style={{ padding: "2rem", width: "100%" }}>

        {/* Buscador Integrado */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.75rem 1.25rem", background: "rgba(0,0,0,0.15)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1.5rem" }}>
          <FiSearch style={{ color: "var(--text-muted)", fontSize: "1.1rem" }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre o subdominio..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ background: "transparent", border: "none", outline: "none", boxShadow: "none", margin: 0, padding: 0, color: "var(--text-main)", width: "100%", fontSize: "0.9rem" }}
          />
        </div>

        {/* Tabla de Registros */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <LoadingSpinner size="large" />
            </div>
          ) : filteredClinicas.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0", margin: 0 }}>
              No se encontraron negocios registrados que coincidan con la búsqueda.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "left" }}>
                  <th style={{ padding: "12px", color: "var(--primary)", fontSize: "0.85rem", fontWeight: "600" }}>NEGOCIO</th>
                  <th style={{ padding: "12px", color: "var(--primary)", fontSize: "0.85rem", fontWeight: "600" }}>SUBDOMINIO</th>
                  <th style={{ padding: "12px", color: "var(--primary)", fontSize: "0.85rem", fontWeight: "600" }}>PALETA DE COLORES</th>
                  <th style={{ padding: "12px", color: "var(--primary)", fontSize: "0.85rem", fontWeight: "600" }}>ETIQUETAS</th>
                  <th style={{ padding: "12px", color: "var(--primary)", fontSize: "0.85rem", fontWeight: "600" }}>ESTATUS</th>
                  <th style={{ padding: "12px", color: "var(--primary)", fontSize: "0.85rem", fontWeight: "600", textAlign: "center" }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredClinicas.map((c) => (
                  <tr
                    key={c._id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.015)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Negocio */}
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {c.logo ? (
                          <img src={c.logo} alt="Logo" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "contain" }} />
                        ) : (
                          <div className="brand-logo-sphere" style={{ width: "30px", height: "30px", fontSize: "0.8rem", margin: 0, background: c.theme?.primaryColor || undefined }}>
                            <span>{(c.sidebarName || c.name).substring(0, 1).toUpperCase()}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "0.9rem" }}>{c.sidebarName || c.name}</span>
                          {c.sidebarSubtitle && <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>{c.sidebarSubtitle}</span>}
                        </div>
                      </div>
                    </td>

                    {/* Subdominio */}
                    <td style={{ padding: "14px 12px" }}>
                      <code style={{ color: "var(--primary)", fontSize: "0.85rem" }}>{c.subdomain}</code>
                    </td>

                    {/* Paleta de Colores */}
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title="Colores: Primario, Acento y Fondo de Sidebar">
                        <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: c.theme?.primaryColor || "#5e50a1", border: "1px solid rgba(255,255,255,0.2)" }}></span>
                        <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: c.theme?.accentColor || "#10b981", border: "1px solid rgba(255,255,255,0.2)" }}></span>
                        <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: c.theme?.sidebarBg || "#0f172a", border: "1px solid rgba(255,255,255,0.2)" }}></span>
                      </div>
                    </td>

                    {/* Etiquetas */}
                    <td style={{ padding: "14px 12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {c.patientLabelPlural || "Pacientes"} / {c.specialistLabelPlural || "Especialistas"}
                    </td>

                    {/* Estatus */}
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        padding: "3px 8px",
                        borderRadius: "10px",
                        background: c.active ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: c.active ? "#22c55e" : "#ef4444",
                        fontWeight: "700"
                      }}>
                        {c.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: "14px 12px", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => navigate(`/admin/clinicas/editar/${c._id}`)}
                          className="btn btn-outline"
                          style={{ padding: "4px 8px", height: "28px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "3px" }}
                          title="Editar configuración"
                        >
                          <FiEdit2 /> Editar
                        </button>
                        <a
                          href={`/citas/${c.subdomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{ padding: "4px 8px", height: "28px", fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px" }}
                        >
                          <FiExternalLink /> Reservas
                        </a>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>      </div>
    </div>
  );
}
