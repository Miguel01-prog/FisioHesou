import React, { useState, useEffect } from "react";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { FiUser, FiMail, FiLock, FiKey, FiEye, FiEyeOff, FiSave, FiRefreshCw, FiCopy } from "react-icons/fi";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { capitalizeWords } from "../../utils/utils.js";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load active user profile details
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/auth/me");
        // Get full details from backend if needed, or initialize from /me
        setName(data.name || "");
        setRole(data.role || "");
        setEmail(data.email || "");
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        showError("Error", "No se pudieron obtener los detalles del usuario.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Generate a strong random password
  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let passwordLength = 12;
    let password = "";
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    setNewPassword(password);
    setShowPassword(true);
    showSuccess("Contraseña Generada", "Se generó una contraseña segura. Recuerda copiarla antes de guardar.");
  };

  const handleCopyToClipboard = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    showSuccess("Copiado", "Contraseña copiada al portapapeles.");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      return showError("Datos requeridos", "El nombre y el correo electrónico son obligatorios.");
    }

    if (newPassword && newPassword.length < 6) {
      return showError("Contraseña corta", "La contraseña debe tener al menos 6 caracteres.");
    }

    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", {
        name,
        email,
        newPassword: newPassword || undefined
      });

      // Update user details in Local Storage
      const storedUser = JSON.parse(localStorage.getItem("user")) || {};
      storedUser.name = name;
      storedUser.email = email;
      localStorage.setItem("user", JSON.stringify(storedUser));

      showSuccess("Perfil Guardado", "Tus datos han sido actualizados con éxito.");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Ocurrió un error al actualizar tu perfil.";
      showError("Error", errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="auth-wrapper-content fade-in-up" style={{ padding: "1.5rem" }}>
      <div style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}>
        
        <div className="auth-card" style={{ position: "relative", padding: "2.5rem", borderRadius: "18px" }}>
          {saving && <div className="spinner-overlay" style={{ borderRadius: "18px" }}><LoadingSpinner /></div>}

          <div className="card-header-split" style={{ marginBottom: "1.5rem" }}>
            <h2 className="title_card" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiUser style={{ color: "var(--primary)" }} /> Mi Perfil
            </h2>
          </div>
          <hr style={{ marginBottom: "1.5rem", border: "0", borderTop: "1px solid var(--border-light)" }} />

          <form className="form" onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Nombre */}
            <div className="col">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <FiUser size={14} /> Nombre Completo
              </label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingresa tu nombre"
                required
                disabled={saving}
              />
            </div>

            {/* Correo Electrónico */}
            <div className="col">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <FiMail size={14} /> Correo Electrónico
              </label>
              <input
                type="email"
                className="input"
                value={email}
                readOnly
                style={{ background: "rgba(226, 232, 240, 0.45)", cursor: "default" }}
                title="El correo de inicio de sesión no se puede modificar"
              />
            </div>

            {/* Rol de usuario */}
            <div className="col">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <FiKey size={14} /> Rol en el Sistema
              </label>
              <input
                type="text"
                className="input"
                value={capitalizeWords(role)}
                readOnly
                style={{ background: "rgba(226, 232, 240, 0.45)" }}
              />
            </div>

            <hr style={{ margin: "0.5rem 0", border: "0", borderTop: "1px solid var(--border-light)" }} />
            
            {/* Sección de Contraseña */}
            <div className="col" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0 }}>
                <FiLock size={14} /> Cambiar Contraseña (Dejar en blanco para conservar la actual)
              </label>

              <div style={{ display: "flex", gap: "0.5rem", position: "relative" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Escribe la nueva contraseña o genérala abajo"
                    style={{ width: "100%", paddingRight: "2.5rem" }}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 0,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>

                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="save-btn"
                    title="Copiar contraseña"
                    style={{ background: "var(--accent)", margin: 0, width: "42px", padding: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                  >
                    <FiCopy size={16} />
                  </button>
                )}
              </div>

              {/* Botón Generar Contraseña */}
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="save-btn"
                style={{
                  background: "transparent",
                  color: "var(--primary)",
                  border: "1px dashed var(--primary)",
                  alignSelf: "flex-start",
                  margin: 0,
                  padding: "0.4rem 1rem",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
                disabled={saving}
              >
                <FiRefreshCw size={14} /> Generar Contraseña Segura
              </button>
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                type="submit"
                className="save-btn"
                style={{ margin: 0, flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
                disabled={saving}
              >
                <FiSave size={16} /> {saving ? "Guardando..." : "Guardar Perfil"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
