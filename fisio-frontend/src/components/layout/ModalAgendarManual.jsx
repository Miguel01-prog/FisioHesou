import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { FiCalendar, FiClock, FiPlusCircle, FiUsers, FiUserPlus, FiSearch, FiCheckCircle, FiX, FiUser } from "react-icons/fi";
import { FaExclamationTriangle } from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { getUsuarioRol, isHourPassed } from "../../utils/utils.js";

export default function ModalAgendarManual({ selectedDateInitial, onClose, onSaveSuccess }) {
  // Selector de Modo: 'registrado' (paciente existente) | 'nuevo' (escribir nombre/datos manualmente)
  const [modo, setModo] = useState("registrado");

  // Pacientes registrados
  const [pacientes, setPacientes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("listaPacientes")) || [];
    } catch {
      return [];
    }
  });
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [searchPacienteQuery, setSearchPacienteQuery] = useState("");

  // Campos para Registro Manual / Nuevo Paciente
  const [nombres, setNombres] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [edad, setEdad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  // Datos del usuario en sesión actual
  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = user?.role || user?.rol || "fisioterapeuta";
  const defaultArea = getUsuarioRol(user) || (userRole === "nutriologa" ? "nutriologa" : "fisioterapia");

  // Si es superadmin o administrador, dejamos elegir área. Si es especialista, lo tomamos de su sesión
  const esEspecialista = userRole === "fisioterapeuta" || userRole === "nutriologa";
  const [area, setArea] = useState(esEspecialista ? defaultArea : "fisioterapia");

  const [selectedHour, setSelectedHour] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [loading, setLoading] = useState(false);

  // Blockages states
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedHoursCitas, setBlockedHoursCitas] = useState({});

  const allHours = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  const formatDateDDMMYYYY = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  // Cargar lista de pacientes registrados
  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        setLoadingPacientes(true);
        const { data } = await api.get("/pacientes");
        if (Array.isArray(data)) {
          setPacientes(data);
          localStorage.setItem("listaPacientes", JSON.stringify(data));
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setPacientes([]);
        } else {
          console.error("Error al cargar pacientes en agendar manual:", err);
        }
      } finally {
        setLoadingPacientes(false);
      }
    };
    fetchPacientes();
  }, []);

  useEffect(() => {
    if (!area) return;
    const fetchBlockedDates = async () => {
      try {
        const clientId = user?.client?._id || (typeof user?.client === "string" ? user.client : "");
        const query = clientId ? `?clientId=${clientId}` : "";
        const { data } = await api.get(`/horarios/${area}${query}`);
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

    const disponibles = allHours.filter((h) => {
      if (bloqueadas.includes(h)) return false;
      if (isHourPassed(h, iso)) return false;
      return true;
    });

    setAvailableHours(disponibles);
  };

  // Filtrado de pacientes registrados
  const pacientesFiltrados = pacientes.filter((p) => {
    if (!searchPacienteQuery.trim()) return true;
    const q = searchPacienteQuery.toLowerCase().trim();
    const nombreCompleto = `${p.nombres || ""} ${p.apellidoPaterno || ""} ${p.apellidoMaterno || ""} ${p.apellidos || ""}`.toLowerCase();
    const tel = (p.telefono || "").toLowerCase();
    const id = (p.identificadorPaciente || "").toLowerCase();
    return nombreCompleto.includes(q) || tel.includes(q) || id.includes(q);
  });

  const handleGuardarCita = async () => {
    if (!selectedDateInitial || !selectedHour) {
      return showError("Hora requerida", "Selecciona una hora antes de confirmar.");
    }

    // Tomar automáticamente el especialista de la sesión actual
    const especialistaId = user?._id || user?.id || undefined;
    const especialistaNombre = user?.name || user?.nombre || "";

    let payload = {};

    if (modo === "registrado") {
      if (!selectedPaciente) {
        return showError("Paciente requerido", "Por favor selecciona un paciente registrado de la lista.");
      }

      const parts = (selectedPaciente.apellidos || "").trim().split(/\s+/);
      const paternal = selectedPaciente.apellidoPaterno || parts[0] || "Sin Apellido";
      const maternal = selectedPaciente.apellidoMaterno || parts.slice(1).join(" ") || "";

      payload = {
        identificadorPaciente: selectedPaciente.identificadorPaciente,
        nombres: selectedPaciente.nombres,
        apellidoPaterno: paternal,
        apellidoMaterno: maternal,
        edad: selectedPaciente.edad ? Number(selectedPaciente.edad) : undefined,
        telefono: selectedPaciente.telefono || undefined,
        email: selectedPaciente.email || undefined,
        fechaCitaStr: selectedDateInitial,
        horaCita: selectedHour,
        area,
        especialistaId,
        especialistaNombre
      };
    } else {
      // Modo Nuevo / Manual
      if (telefono && telefono.replace(/\D/g, "").length !== 10) {
        return showError("Teléfono inválido", "El número de teléfono debe constar exactamente de 10 dígitos.");
      }

      payload = {
        nombres: nombres || undefined,
        apellidoPaterno: apellidoPaterno || undefined,
        apellidoMaterno: apellidoMaterno || undefined,
        edad: edad ? Number(edad) : undefined,
        telefono: telefono || undefined,
        email: email || undefined,
        fechaCitaStr: selectedDateInitial,
        horaCita: selectedHour,
        area,
        especialistaId,
        especialistaNombre
      };
    }

    setLoading(true);
    try {
      const { data } = await api.post("/citas/manual-completa", payload);

      if (modo === "registrado") {
        const nom = selectedPaciente.nombres || "el paciente";
        showSuccess("Cita agendada", `Se agendó la cita con éxito para ${nom}.`);
      } else if (data.datosIncompletos) {
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
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: "520px",
          width: "95%",
          padding: "1.5rem",
          borderRadius: "16px",
          maxHeight: "92vh",
          overflowY: "auto"
        }}
      >
        {loading && <div className="spinner-overlay" style={{ borderRadius: "16px" }}><LoadingSpinner /></div>}
        <button className="close-btn" onClick={onClose} aria-label="Cerrar modal" disabled={loading}>✕</button>

        <h4 className="logo-agendar" style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem" }}>
          <FiPlusCircle style={{ color: "var(--primary)" }} /> Agendar Cita Manual
        </h4>

        {/* Pestañas para alternar entre Paciente Registrado y Registro Manual */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            background: "rgba(99, 102, 241, 0.08)",
            padding: "4px",
            borderRadius: "10px",
            marginBottom: "0.9rem"
          }}
        >
          <button
            type="button"
            onClick={() => setModo("registrado")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 10px",
              fontSize: "0.82rem",
              fontWeight: modo === "registrado" ? "700" : "500",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: modo === "registrado" ? "var(--primary, #6366f1)" : "transparent",
              color: modo === "registrado" ? "#ffffff" : "var(--text-main, #334155)",
              boxShadow: modo === "registrado" ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none"
            }}
          >
            <FiUsers size={15} /> Pacientes Registrados
          </button>
          <button
            type="button"
            onClick={() => setModo("nuevo")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 10px",
              fontSize: "0.82rem",
              fontWeight: modo === "nuevo" ? "700" : "500",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: modo === "nuevo" ? "var(--primary, #6366f1)" : "transparent",
              color: modo === "nuevo" ? "#ffffff" : "var(--text-main, #334155)",
              boxShadow: modo === "nuevo" ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none"
            }}
          >
            <FiUserPlus size={15} /> Poner Nombre (Manual)
          </button>
        </div>

        {/* Día seleccionado fijo */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--primary-glow, rgba(99, 102, 241, 0.08))",
          padding: "0.45rem 0.75rem",
          borderRadius: "8px",
          color: "var(--primary)",
          fontWeight: "600",
          fontSize: "0.84rem",
          marginBottom: "0.9rem"
        }}>
          <FiCalendar size={15} />
          <span>Fecha de la cita: {formatDateDDMMYYYY(selectedDateInitial)}</span>
        </div>

        <div className="form" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {/* ======================================================== */}
          {/* OPCIÓN 1: PACIENTE YA REGISTRADO                         */}
          {/* ======================================================== */}
          {modo === "registrado" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {!selectedPaciente ? (
                <>
                  <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: "600", margin: 0 }}>
                    Buscar Paciente Registrado:
                  </label>
                  <div style={{ position: "relative" }}>
                    <FiSearch
                      size={15}
                      style={{
                        position: "absolute",
                        left: "11px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        pointerEvents: "none"
                      }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Escribe nombre, apellido, teléfono o expediente..."
                      value={searchPacienteQuery}
                      onChange={(e) => setSearchPacienteQuery(e.target.value)}
                      style={{
                        paddingLeft: "32px",
                        paddingRight: searchPacienteQuery ? "32px" : "12px",
                        height: "38px",
                        fontSize: "0.85rem",
                        width: "100%"
                      }}
                    />
                    {searchPacienteQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchPacienteQuery("")}
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <FiX size={14} />
                      </button>
                    )}
                  </div>

                  {/* Listado de resultados */}
                  <div
                    style={{
                      maxHeight: "175px",
                      overflowY: "auto",
                      border: "1px solid var(--border-light, #e2e8f0)",
                      borderRadius: "8px",
                      padding: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      background: "rgba(248, 250, 252, 0.5)"
                    }}
                  >
                    {loadingPacientes ? (
                      <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", padding: "1rem 0", margin: 0 }}>
                        Cargando pacientes...
                      </p>
                    ) : pacientesFiltrados.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1rem 0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {pacientes.length === 0
                          ? "No hay pacientes registrados en tu clínica aún. Puedes usar la pestaña 'Poner Nombre (Manual)'."
                          : "No se encontraron pacientes que coincidan con la búsqueda."}
                      </div>
                    ) : (
                      pacientesFiltrados.slice(0, 30).map((p) => {
                        const fullName = `${p.nombres || ""} ${p.apellidoPaterno || ""} ${p.apellidoMaterno || ""}`.trim() || p.apellidos || "Sin Nombre";
                        return (
                          <div
                            key={p._id || p.identificadorPaciente}
                            onClick={() => {
                              setSelectedPaciente(p);
                              if (p.area && !esEspecialista) {
                                setArea(p.area);
                              }
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.45rem 0.65rem",
                              borderRadius: "6px",
                              cursor: "pointer",
                              transition: "background 0.15s ease",
                              background: "#ffffff",
                              border: "1px solid rgba(226, 232, 240, 0.8)"
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: "rgba(99, 102, 241, 0.12)",
                                  color: "var(--primary)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: "700",
                                  flexShrink: 0
                                }}
                              >
                                {p.nombres?.charAt(0)?.toUpperCase() || <FiUser size={12} />}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {fullName}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                  {p.telefono && <span>📞 {p.telefono}</span>}

                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              style={{
                                background: "var(--primary, #6366f1)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "3px 8px",
                                fontSize: "0.72rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                flexShrink: 0
                              }}
                            >
                              Elegir
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                /* Tarjeta de Paciente Seleccionado */
                <div
                  style={{
                    border: "1.5px solid var(--primary, #6366f1)",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.05)",
                    padding: "0.75rem 0.85rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#10b981", fontWeight: "700" }}>
                      <FiCheckCircle size={14} /> Paciente Seleccionado
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPaciente(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0
                      }}
                    >
                      Cambiar paciente
                    </button>
                  </div>

                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)" }}>
                    {`${selectedPaciente.nombres || ""} ${selectedPaciente.apellidoPaterno || ""} ${selectedPaciente.apellidoMaterno || ""}`.trim() || selectedPaciente.apellidos}
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <div><strong>Tel:</strong> {selectedPaciente.telefono || "Sin teléfono"}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* OPCIÓN 2: NUEVO PACIENTE / PONER NOMBRE MANUALMENTE      */}
          {/* ======================================================== */}
          {modo === "nuevo" && (
            <>
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
            </>
          )}

          {/* Selector de Área visible solo para administradores */}
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
            {availableHours.length > 0 ? (
              <div className="hours-grid-modern">
                {allHours.filter((h) => !isHourPassed(h, selectedDateInitial)).map((hour) => {
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

          {/* Advertencias según el modo */}
          {modo === "nuevo" && (!nombres.trim() || !apellidoPaterno.trim() || !telefono.trim()) && (
            <p style={{ color: "var(--warning)", fontSize: "0.75rem", margin: "0.15rem 0", fontWeight: "600", lineHeight: "1.3", display: "flex", alignItems: "center", gap: "4px" }}>
              <FaExclamationTriangle size={11} /> Faltan datos relevantes. Se generarán datos provisionales.
            </p>
          )}

          {modo === "registrado" && !selectedPaciente && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: "0.15rem 0", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
              ℹ️ Selecciona un paciente de la lista para continuar con la cita.
            </p>
          )}

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
            disabled={
              loading ||
              !selectedHour ||
              (modo === "registrado" && !selectedPaciente)
            }
          >
            {loading
              ? "Confirmando..."
              : modo === "registrado" && !selectedPaciente
                ? "Selecciona un paciente"
                : !selectedHour
                  ? "Selecciona una hora"
                  : "Confirmar Cita"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
