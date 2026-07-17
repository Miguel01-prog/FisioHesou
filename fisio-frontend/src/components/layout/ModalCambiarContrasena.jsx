import React, { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function ModalCambiarContrasena({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return showError("Campos incompletos", "Por favor completa todos los campos.");
    }

    if (newPassword.length < 6) {
      return showError("Contraseña insegura", "La nueva contraseña debe tener al menos 6 caracteres.");
    }

    if (newPassword !== confirmPassword) {
      return showError("Error de coincidencia", "La nueva contraseña y su confirmación no coinciden.");
    }

    setLoading(true);
    try {
      const { data } = await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      showSuccess("Contraseña cambiada", data.message || "Tu contraseña ha sido actualizada con éxito.");
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Ocurrió un error al intentar cambiar la contraseña.";
      showError("Error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "450px", width: "100%", borderRadius: "18px" }}>
        {loading && <div className="spinner-overlay" style={{ borderRadius: "18px" }}><LoadingSpinner /></div>}
        <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
          ✕
        </button>

        <h4 className="logo-agendar" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FiLock style={{ color: "var(--primary)" }} /> Cambiar Contraseña
        </h4>
        <hr style={{ marginBottom: "1.5rem" }} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Contraseña Actual */}
          <div className="form-group-modern" style={{ position: "relative" }}>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.9rem" }}>
              Contraseña Actual
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showCurrent ? "text" : "password"}
                className="input-field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Escribe tu contraseña actual"
                style={{ width: "100%", paddingRight: "2.5rem" }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
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
                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña */}
          <div className="form-group-modern">
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.9rem" }}>
              Nueva Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showNew ? "text" : "password"}
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: "100%", paddingRight: "2.5rem" }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
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
                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div className="form-group-modern">
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.9rem" }}>
              Confirmar Nueva Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                style={{ width: "100%", paddingRight: "2.5rem" }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
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
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              className="save-btn"
              style={{ background: "#64748b", margin: 0, flex: 1 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="save-btn"
              style={{ margin: 0, flex: 2 }}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
