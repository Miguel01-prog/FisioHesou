import React, { useState, useEffect } from "react";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { FiUser, FiMail, FiLock, FiKey, FiEye, FiEyeOff, FiSave, FiRefreshCw, FiCopy } from "react-icons/fi";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { capitalizeWords } from "../../utils/utils.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [signature, setSignature] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load active user profile details
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/auth/me");
        setName(data.name || "");
        setRole(data.role || "");
        setEmail(data.email || "");
        setSignature(data.signature || "");
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        showError("Error", "No se pudieron obtener los detalles del usuario.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#1e1b4b"; // Indigo stroke
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (signature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = signature;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [signature, loading]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e) => {
    if (e.type === "touchstart") {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.type === "touchmove") {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignature(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };

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
        newPassword: newPassword || undefined,
        signature
      });

      // Update user details in Local Storage and Context
      updateUser({
        name,
        email,
        signature
      });

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
        
        <div className="auth-card card" style={{ position: "relative", padding: "2.5rem", borderRadius: "18px" }}>
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

            <hr style={{ margin: "0.5rem 0", border: "0", borderTop: "1px solid var(--border-light)" }} />

            {/* Firma Profesional Pregrabada */}
            <div className="col" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontWeight: "700", color: "var(--primary)" }}>
                🩺 Mi Firma Profesional Pregrabada
              </label>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Dibuja tu firma en el recuadro de abajo. Esta firma se colocará automáticamente en los consentimientos informados de todos tus expedientes.
              </p>

              <div className="canvas-wrapper" style={{ position: "relative", background: "#ffffff", border: "1px dashed rgba(139, 92, 246, 0.25)", borderRadius: "8px", overflow: "hidden", height: "160px", width: "100%", maxWidth: "400px" }}>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={160}
                  style={{ width: "100%", height: "100%", cursor: "crosshair", touchAction: "none" }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "var(--danger)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Limpiar
                </button>
              </div>
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
