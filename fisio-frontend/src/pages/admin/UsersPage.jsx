import React, { useState, useEffect } from "react";
import api from "../../api.js";
import LoadingSpinner from "../../components/layout/LoadingSpinner.jsx";
import { showError, showSuccess } from "../../utils/alerts.js";
import { FiPlus, FiX } from "react-icons/fi";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("fisioterapeuta");
  const [clientId, setClientId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, clinicasRes] = await Promise.all([
        api.get("/auth/users"),
        api.get("/clients")
      ]);
      setUsers(usersRes.data || []);
      const clients = clinicasRes.data?.clients || [];
      setClinicas(clients);
      
      // Auto-select the first clinic if available
      if (clients.length > 0) {
        setClientId(clients[0]._id);
      }
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudieron cargar los datos del sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !role || !clientId) {
      return showError("Campos vacíos", "Por favor ingresa todos los campos obligatorios");
    }

    setGuardando(true);
    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        clientId
      });

      showSuccess("Éxito", "Especialista registrado correctamente");
      setName("");
      setEmail("");
      setPassword("");
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showError("Error", err.response?.data?.message || "Ocurrió un error al registrar al especialista");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="users-container" style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "var(--primary)", fontSize: "1.8rem", fontWeight: "700" }}>Gestión de Especialistas</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Crea cuentas de terapeutas y nutriólogas y asócialas a una clínica específica.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* Formulario de registro en Ventana Modal */}
        {showFormModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem"
          }}>
            <section className="auth-card card" style={{
              width: "100%",
              maxWidth: "500px",
              padding: "2.2rem",
              position: "relative",
              animation: "fadeInUp 0.25s ease-out",
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              {/* Close Button X */}
              <button
                type="button"
                onClick={() => {
                  setShowFormModal(false);
                  setName("");
                  setEmail("");
                  setPassword("");
                }}
                style={{
                  position: "absolute",
                  top: "1.25rem",
                  right: "1.25rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  borderRadius: "50%",
                  transition: "all 0.2s"
                }}
                title="Cerrar"
              >
                <FiX size={18} />
              </button>

              <h2 style={{ fontSize: "1.2rem", color: "var(--text-main)", marginBottom: "1.5rem", fontWeight: "600" }}>Registrar Nuevo Especialista</h2>
              
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                  <label htmlFor="user-name" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Nombre Completo *</label>
                  <input
                    id="user-name"
                    type="text"
                    className="input"
                    placeholder="Ej. Dr. Juan Pérez"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    disabled={guardando}
                  />
                </div>

                <div>
                  <label htmlFor="user-email" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Correo Electrónico *</label>
                  <input
                    id="user-email"
                    type="email"
                    className="input"
                    placeholder="Ej. juan.perez@hesou.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={guardando}
                  />
                </div>

                <div>
                  <label htmlFor="user-password" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Contraseña Temporal *</label>
                  <input
                    id="user-password"
                    type="password"
                    className="input"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={guardando}
                  />
                </div>

                <div>
                  <label htmlFor="user-role" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Especialidad / Rol *</label>
                  <select
                    id="user-role"
                    className="input"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    disabled={guardando}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="fisioterapeuta">Fisioterapeuta</option>
                    <option value="nutriologa">Nutrióloga / Nutrición</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="user-clinic" className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>Asociar a Clínica *</label>
                  {clinicas.length === 0 ? (
                    <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>
                      ⚠️ Debes crear al menos una clínica en la sección "Clínicas SaaS" antes de poder registrar un especialista.
                    </p>
                  ) : (
                    <select
                      id="user-clinic"
                      className="input"
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      disabled={guardando}
                      style={{ cursor: "pointer" }}
                    >
                      {clinicas.map((c) => (
                        <option key={c._id} value={c._id}>{c.name} ({c.subdomain})</option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  style={{ marginTop: "1rem", height: "45px" }}
                  disabled={guardando || clinicas.length === 0}
                >
                  {guardando ? <LoadingSpinner size="small" color="#fff" /> : "Registrar Especialista"}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* Listado de Especialistas */}
        <section className="auth-card card" style={{ padding: "2rem", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", color: "var(--text-main)", fontWeight: "600", margin: 0 }}>Especialistas Registrados ({users.length})</h2>
            <button
              onClick={() => setShowFormModal(true)}
              className="btn btn-primary"
              style={{ padding: "6px 12px", fontSize: "0.85rem", height: "36px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <FiPlus size={16} /> Registrar Especialista
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><LoadingSpinner /></div>
          ) : users.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0" }}>No hay especialistas registrados en el sistema.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {users.map((u) => (
                <div
                  key={u._id}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "between", alignItems: "center" }}>
                    <span style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "1rem" }}>{u.name}</span>
                    <span style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "12px",
                      background: u.role === "fisioterapeuta" ? "rgba(94, 80, 161, 0.15)" : "rgba(34, 197, 94, 0.15)",
                      color: u.role === "fisioterapeuta" ? "var(--primary)" : "#22c55e",
                      fontWeight: "600",
                      textTransform: "capitalize"
                    }}>
                      {u.role === "fisioterapeuta" ? "Fisioterapeuta" : "Nutrióloga"}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Email: <span style={{ color: "var(--text-main)" }}>{u.email}</span>
                  </div>

                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Clínica: <span style={{ color: "var(--primary)", fontWeight: "600" }}>{u.clientId?.name || "Sin clínica asociada"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
