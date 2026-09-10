import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { FiCalendar, FiClock, FiPlusCircle } from "react-icons/fi";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function ModalAgendarManual({ selectedDateInitial, onClose, onSaveSuccess }) {
  // Form Fields
  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [edad, setEdad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  
  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = user?.role || "fisioterapeuta";
  
  // Si es superadmin o administrador, dejamos elegir. Si es especialista, lo tomamos del rol
  const esEspecialista = userRole === "fisioterapeuta" || userRole === "nutriologa";
  const [area, setArea] = useState(esEspecialista ? userRole : "fisioterapeuta");

  const [selectedHour, setSelectedHour] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [loading, setLoading] = useState(false);

  // Blockages states
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedHoursCitas, setBlockedHoursCitas] = useState({});

  const allHours = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ];

  const formatDateDDMMYYYY = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!area) return;
    const fetchBlockedDates = async () => {
      try {
        const { data } = await api.get(`/horarios/${area}`);
        setBlockedHoursAdmin(data.blockedHoursAdmin || {});
        setBlockedHoursCitas(data.blockedHoursCitas || {});
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      }
    };
    fetchBlockedDates();
  }, [area]);

  useEffect(() => {
    if (selectedDateInitial) {
      calculateAvailableHours(selectedDateInitial);
    }
  }, [selectedDateInitial, blockedHoursAdmin, blockedHoursCitas]);

  const calculateAvailableHours = (iso) => {
    const bloqueadasAdmin = blockedHoursAdmin[iso] || [];
    const bloqueadasPacientes = blockedHoursCitas[iso] || [];
    const bloqueadas = [...new Set([...bloqueadasAdmin, ...bloqueadasPacientes])];

    const ahora = new Date();
    const hoy = ahora.getFullYear() + "-" + String(ahora.getMonth() + 1).padStart(2, "0") + "-" + String(ahora.getDate()).padStart(2, "0");
    const esHoy = iso === hoy;

    const disponibles = allHours.filter((h) => {
      if (bloqueadas.includes(h)) return false;
      if (esHoy) {
        const [hNum, mNum] = h.split(":").map(Number);
        const horaCita = new Date(ahora);
        horaCita.setHours(hNum, mNum, 0, 0);
        const diffHoras = (horaCita - ahora) / (1000 * 60 * 60);
        if (diffHoras < 2) return false;
      }
      return true;
    });

    setAvailableHours(disponibles);
  };

  const handleGuardarCita = async () => {
    if (!selectedDateInitial || !selectedHour) {
      return showError("Hora requerida", "Selecciona una hora antes de confirmar.");
    }

    if (telefono && telefono.replace(/\D/g, "").length !== 10) {
      return showError("Teléfono inválido", "El número de teléfono debe constar exactamente de 10 dígitos.");
    }

    const payload = {
      nombres: nombres || undefined,
      apellidoPaterno: apellidoPaterno || undefined,
      apellidoMaterno: apellidoMaterno || undefined,
      edad: edad ? Number(edad) : undefined,
      telefono: telefono || undefined,
      email: email || undefined,
      fechaCitaStr: selectedDateInitial,
      horaCita: selectedHour,
      area
    };

    setLoading(true);
    try {
      const { data } = await api.post("/citas/manual-completa", payload);
      
      if (data.datosIncompletos) {
        showSuccess(
          "Cita guardada (Incompleta)", 
          `Se creó la cita con datos provisionales para el expediente debido a la falta de información.`
        );
      } else {
        showSuccess("Cita manual agendada", `Se agendó la cita con éxito.`);
      }

      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "No se pudo agendar la cita manual.";
      showError("Error", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "480px", width: "95%", padding: "1.5rem", borderRadius: "14px" }}>
        {loading && <div className="spinner-overlay" style={{ borderRadius: "14px" }}><LoadingSpinner /></div>}
        <button className="close-btn" onClick={onClose} aria-label="Cerrar modal" disabled={loading}>✕</button>

        <h4 className="logo-agendar" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem" }}>
          <FiPlusCircle style={{ color: "var(--primary)" }} /> Agendar Cita Manual
        </h4>
        <hr style={{ marginBottom: "1rem", border: "0", borderTop: "1px solid var(--border-light)" }} />

        {/* Día seleccionado fijo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--primary-glow, rgba(99, 102, 241, 0.08))",
          padding: "0.5rem 0.75rem",
          borderRadius: "8px",
          color: "var(--primary)",
          fontWeight: "600",
          fontSize: "0.85rem",
          marginBottom: "1rem"
        }}>
          <FiCalendar size={16} />
          <span>Fecha de la cita: {formatDateDDMMYYYY(selectedDateInitial)}</span>
        </div>

        <div className="form" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          
          {/* Fila 1: Nombres y Apellido Paterno */}
          <div className="form-row" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.15rem" }}>Nombre(s)</label>
              <input
                type="text"
                className="input"
                placeholder="Ej. Juan"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                style={{ height: "38px", fontSize: "0.85rem" }}
              />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.15rem" }}>Apellido paterno</label>
              <input
                type="text"
                className="input"
                placeholder="Ej. Pérez"
                value={apellidoPaterno}
                onChange={(e) => setApellidoPaterno(e.target.value)}
                style={{ height: "38px", fontSize: "0.85rem" }}
              />
            </div>
          </div>

          {/* Fila 2: Apellido Materno y Edad */}
          <div className="form-row" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.15rem" }}>Apellido materno (Opcional)</label>
              <input
                type="text"
                className="input"
                placeholder="Ej. Ruiz"
                value={apellidoMaterno}
                onChange={(e) => setApellidoMaterno(e.target.value)}
                style={{ height: "38px", fontSize: "0.85rem" }}
              />
            </div>
            <div style={{ flex: "1 1 80px" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.15rem" }}>Edad</label>
              <input
                type="number"
                className="input"
                placeholder="Ej. 25"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                style={{ height: "38px", fontSize: "0.85rem" }}
              />
            </div>
          </div>

          {/* Fila 3: Teléfono y Email */}
          <div className="form-row" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.15rem" }}>Teléfono</label>
              <input
                type="tel"
                className="input"
                placeholder="Ej. 4421234567 (10 dígitos)"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
                style={{ height: "38px", fontSize: "0.85rem" }}
              />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.15rem" }}>Email (Opcional)</label>
              <input
                type="email"
                className="input"
                placeholder="Ej. correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ height: "38px", fontSize: "0.85rem" }}
              />
            </div>
          </div>

          {/* Selector de Área visible solo para administradores, oculto para especialistas */}
          {!esEspecialista && (
            <div className="form-row" style={{ display: "flex", flexDirection: "column" }}>
              <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.15rem" }}>Área de Especialidad</label>
              <select
                className="input"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                style={{ width: "100%", height: "38px", fontSize: "0.85rem" }}
              >
                <option value="fisioterapeuta">Fisioterapia</option>
                <option value="nutriologa">Nutrición</option>
              </select>
            </div>
          )}

          {/* Horas del día */}
          <div className="form-row" style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}>
              <FiClock size={12} /> Seleccionar Hora
            </label>
            {availableHours.length > 0 || allHours.length > 0 ? (
              <div className="hours-grid-modern">
                {allHours.map((hour) => {
                  const isBlockedAdmin = blockedHoursAdmin[selectedDateInitial]?.includes(hour);
                  const isBlockedPaciente = blockedHoursCitas[selectedDateInitial]?.includes(hour);
                  const isAvailable = availableHours.includes(hour);
                  const isSelected = selectedHour === hour;

                  return (
                    <button
                      key={hour}
                      type="button"
                      className={`hour-btn 
                        ${isBlockedAdmin ? "blocked-admin-hour" : ""} 
                        ${isBlockedPaciente ? "blocked-paciente-hour" : ""} 
                        ${isAvailable ? "" : "disabled"}
                        ${isSelected ? "selected-hour" : ""}`}
                      disabled={!isAvailable}
                      onClick={() => isAvailable && setSelectedHour(hour)}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "var(--danger)", fontSize: "0.8rem", fontWeight: "500", margin: "0.15rem 0" }}>
                No hay horarios disponibles para esta fecha.
              </p>
            )}
          </div>

          {!nombres.trim() || !apellidoPaterno.trim() || !telefono.trim() ? (
            <p style={{ color: "var(--warning)", fontSize: "0.75rem", margin: "0.15rem 0", fontWeight: "600", lineHeight: "1.3" }}>
              ⚠️ Faltan datos relevantes. Se generarán datos provisionales.
            </p>
          ) : null}

        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            type="button"
            className="save-btn"
            style={{ background: "#64748b", margin: 0, flex: 1, height: "38px", fontSize: "0.85rem" }}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="save-btn"
            onClick={handleGuardarCita}
            style={{ margin: 0, flex: 2, height: "38px", fontSize: "0.85rem" }}
            disabled={!selectedHour || loading}
          >
            {loading ? "Confirmando..." : "Confirmar Cita"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
