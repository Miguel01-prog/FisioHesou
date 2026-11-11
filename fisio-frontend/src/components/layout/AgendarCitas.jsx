import { getUsuarioRol, formatDateDDMMYYYY, toLocalISODate, isHourPassed, capitalizeWords } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import "react-calendar/dist/Calendar.css";
import Calendar from "react-calendar";
import "../../styles/calendary.css";
import api from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FaPlus,
  FaClock,
  FaStar,
  FaStickyNote,
  FaLock,
  FaCalendarAlt,
  FaCalendarTimes,
  FaRedoAlt,
  FaTimesCircle,
  FaFolderOpen,
  FaSearch,
  FaPhoneAlt,
  FaChevronDown,
  FaChevronUp,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaCheck
} from "react-icons/fa";
import { showConfirm, showSuccess, showError } from "../../utils/alerts.js";

import ModalAgendarManual from "./ModalAgendarManual.jsx";
import ModalAgendarCita from "./ModalAgendarCita.jsx";
import ModalCancelarCita from "./ModalCancelarCita.jsx";
import CalendarLegend from "./CalendarLegend.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function AgendaCitas() {
  const { user: authUser } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [citasDelDia, setCitasDelDia] = useState([]);
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedNotesAdmin, setBlockedNotesAdmin] = useState({});
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [showAgendarManualModal, setShowAgendarManualModal] = useState(false);

  // Vista activa: "calendario" | "canceladas"
  const [activeView, setActiveView] = useState("calendario");
  const [searchCanceladas, setSearchCanceladas] = useState("");
  const [fechaFiltroCanceladas, setFechaFiltroCanceladas] = useState("");
  const [currentPageCanceladas, setCurrentPageCanceladas] = useState(1);
  const itemsPerPageCanceladas = 6;

  // Estado de acordeón desplegable y panel emergente (Bottom Sheet) para citas en modo responsivo
  const [expandedCitaId, setExpandedCitaId] = useState(null);
  const [expandedCanceladaId, setExpandedCanceladaId] = useState(null);
  const [showMobileDaySheet, setShowMobileDaySheet] = useState(false);

  // Modales de Cancelar y Reagendar
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);
  const [citaParaReagendar, setCitaParaReagendar] = useState(null);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const user = authUser || storedUser;
  const rolUsuario = getUsuarioRol(user);
  const rolePath = user?.role || user?.rol || "fisioterapeuta";
  const clientId = user?.client?._id || (typeof user?.client === "string" ? user.client : "");
  const hoyStr = toLocalISODate(new Date());
  const navigate = useNavigate();

  const fetchCitas = async () => {
    try {
      setLoadingCitas(true);
      const endpoint = rolUsuario ? `/citas?area=${rolUsuario}` : "/citas";
      const { data } = await api.get(endpoint);
      setCitas(data || []);

      const query = clientId ? `?clientId=${clientId}` : "";

      let adminDays = [];
      let adminHours = {};
      let adminNotes = {};
      let pacienteDays = [
        ...new Set((data || []).filter((c) => c.area !== "administrador" && c.estado !== "Cancelado").map((c) => c.fechaCitaStr))
      ];

      if (rolUsuario) {
        try {
          const { data: horariosData } = await api.get(`/horarios/${rolUsuario}${query}`);
          adminDays = horariosData.blockedDatesAdmin || [];
          adminHours = horariosData.blockedHoursAdmin || {};
          adminNotes = horariosData.blockedNotesAdmin || {};
        } catch (errHorarios) {
          console.error("Error al obtener bloqueos de horario en agenda:", errHorarios);
        }
      }

      setBlockedDatesAdmin(adminDays);
      setBlockedHoursAdmin(adminHours);
      setBlockedNotesAdmin(adminNotes);
      setBlockedDatesPaciente(pacienteDays);

      const targetDay = selectedDay || hoyStr;
      let citasDia = (data || []).filter((c) => c.fechaCitaStr === targetDay && c.estado !== "Cancelado");

      // Quitar de la lista las citas de hoy cuya hora ya transcurrió
      if (targetDay === hoyStr) {
        citasDia = citasDia.filter((c) => !isHourPassed(c.horaCita, targetDay));
      }

      citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));

      if (!selectedDay) {
        setSelectedDay(hoyStr);
      }
      setCitasDelDia(citasDia);
    } catch (err) {
      console.error("Error al cargar citas:", err);
    } finally {
      setLoadingCitas(false);
    }
  };

  useEffect(() => {
    fetchCitas();
  }, [rolUsuario, clientId, selectedDay]);

  const handleDayClick = (date) => {
    const iso = toLocalISODate(date);
    const hoy = toLocalISODate(new Date());
    if (iso < hoy) return;

    setSelectedDay(iso);
    setExpandedCitaId(null);
    if (typeof window !== "undefined" && window.innerWidth <= 960) {
      setShowMobileDaySheet(true);
    }
  };

  const toggleExpandCita = (id) => {
    setExpandedCitaId((prev) => (prev === id ? null : id));
  };

  const toggleExpandCancelada = (id) => {
    setExpandedCanceladaId((prev) => (prev === id ? null : id));
  };

  const handleCobrarAdeudo = async (cita) => {
    const pacienteNombre = `${cita.nombres || ""} ${cita.apellidos || cita.apellidoPaterno || ""}`.trim();
    const confirmed = await showConfirm(
      "¿Marcar Adeudo como Cobrado?",
      `¿Confirmas que se recibió el pago del adeudo por cancelación tardía de ${pacienteNombre}?`
    );
    if (!confirmed) return;

    try {
      await api.put(`/citas/${cita._id}/adeudo/pagar`);
      showSuccess("Adeudo Cobrado", `Se registró el cobro del adeudo de ${pacienteNombre}.`);
      fetchCitas();
    } catch (err) {
      console.error("Error al cobrar adeudo:", err);
      const msg = err?.response?.data?.message || "No se pudo registrar el cobro del adeudo.";
      showError("Error", msg);
    }
  };

  const selectedDayBlockedHours = selectedDay ? blockedHoursAdmin[selectedDay] || [] : [];
  const selectedDayBlockNote = selectedDay ? blockedNotesAdmin[selectedDay] || "" : "";

  // Lista de citas canceladas ordenadas de la más reciente a la más antigua
  const citasCanceladas = useMemo(() => {
    return (citas || [])
      .filter((c) => c.estado === "Cancelado")
      .sort((a, b) => {
        const dateA = a.fechaCancelacion ? new Date(a.fechaCancelacion).getTime() : new Date(`${a.fechaCitaStr}T${a.horaCita || "00:00"}`).getTime();
        const dateB = b.fechaCancelacion ? new Date(b.fechaCancelacion).getTime() : new Date(`${b.fechaCitaStr}T${b.horaCita || "00:00"}`).getTime();
        return dateB - dateA;
      });
  }, [citas]);

  const citasCanceladasFiltradas = useMemo(() => {
    return citasCanceladas.filter((c) => {
      const nombreCompleto = `${c.nombres || ""} ${c.apellidos || c.apellidoPaterno || ""}`.toLowerCase();
      const tel = String(c.telefono || "").toLowerCase();
      const motivo = String(c.motivoCancelacion || "").toLowerCase();
      const exp = String(c.identificadorPaciente || "").toLowerCase();
      const q = searchCanceladas.trim().toLowerCase();

      const matchesSearch = !q || nombreCompleto.includes(q) || tel.includes(q) || motivo.includes(q) || exp.includes(q);
      const matchesDate = !fechaFiltroCanceladas || c.fechaCitaStr === fechaFiltroCanceladas;
      return matchesSearch && matchesDate;
    });
  }, [citasCanceladas, searchCanceladas, fechaFiltroCanceladas]);

  useEffect(() => {
    setCurrentPageCanceladas(1);
    setExpandedCanceladaId(null);
  }, [searchCanceladas, fechaFiltroCanceladas]);

  const totalPagesCanceladas = Math.max(1, Math.ceil(citasCanceladasFiltradas.length / itemsPerPageCanceladas));
  const safePageCanceladas = Math.min(currentPageCanceladas, totalPagesCanceladas);
  const startIndexCanceladas = (safePageCanceladas - 1) * itemsPerPageCanceladas;
  const endIndexCanceladas = Math.min(startIndexCanceladas + itemsPerPageCanceladas, citasCanceladasFiltradas.length);

  const citasCanceladasPaginadas = useMemo(() => {
    return citasCanceladasFiltradas.slice(startIndexCanceladas, startIndexCanceladas + itemsPerPageCanceladas);
  }, [citasCanceladasFiltradas, startIndexCanceladas, itemsPerPageCanceladas]);

  const canceladasHoyCount = useMemo(() => {
    return citasCanceladas.filter((c) => {
      if (c.fechaCancelacion) {
        return toLocalISODate(new Date(c.fechaCancelacion)) === hoyStr;
      }
      return c.fechaCitaStr === hoyStr;
    }).length;
  }, [citasCanceladas, hoyStr]);

  const adeudosPendientesCount = useMemo(() => {
    return citasCanceladas.filter((c) => c.tieneAdeudo && !c.adeudoPagado).length;
  }, [citasCanceladas]);

  return (
    <div className="auth-wrapper-content">
      <style>{`
        /* Vistas escritorio vs responsivo para Citas del Día y Citas Canceladas */
        .citas-dia-desktop {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          width: 100%;
        }
        .citas-dia-mobile-accordion {
          display: none;
        }
        .mobile-day-quickbar {
          display: none;
        }
        .canceladas-desktop-table {
          display: block;
          width: 100%;
          overflow-x: auto;
        }
        .canceladas-mobile-cards {
          display: none;
        }
        @keyframes slideUpSheet {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 960px) {
          .agenda-right-citas {
            display: none !important;
          }
          .mobile-day-quickbar {
            display: flex !important;
            align-items: center;
            justify-content: space-between;
            gap: 0.6rem;
            flex-wrap: wrap;
            width: 100%;
            background: rgba(99, 102, 241, 0.08);
            border: 1px solid rgba(99, 102, 241, 0.22);
            border-radius: 12px;
            padding: 0.7rem 0.9rem;
            margin-bottom: 0.85rem;
          }
          .citas-dia-desktop {
            display: none !important;
          }
          .citas-dia-mobile-accordion {
            display: flex !important;
            flex-direction: column;
            gap: 0.65rem;
            width: 100%;
          }
          .canceladas-desktop-table {
            display: none !important;
          }
          .canceladas-mobile-cards {
            display: flex !important;
            flex-direction: column;
            gap: 0.65rem;
            width: 100%;
          }
        }
      `}</style>

      <div className="auth-card">
        {/* Header con selector de vista: Calendario de Citas vs Vista de Citas Canceladas */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          <h2 className="logo-agendar" style={{ margin: 0 }}>
            {activeView === "calendario" ? "Agenda de Citas" : "Vista de Citas Canceladas"}
          </h2>

          <div
            style={{
              display: "inline-flex",
              background: "rgba(99, 102, 241, 0.08)",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid rgba(99, 102, 241, 0.18)",
              gap: "4px",
              flexWrap: "wrap"
            }}
          >
            <button
              type="button"
              onClick={() => setActiveView("calendario")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "9px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                background: activeView === "calendario" ? "var(--primary, #6366f1)" : "transparent",
                color: activeView === "calendario" ? "#ffffff" : "var(--text-main)",
                transition: "all 0.2s ease"
              }}
            >
              <FaCalendarAlt size={13} /> Calendario de Citas
            </button>

            <button
              type="button"
              onClick={() => setActiveView("canceladas")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "9px",
                border: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                background: activeView === "canceladas" ? "#ef4444" : "transparent",
                color: activeView === "canceladas" ? "#ffffff" : "var(--text-main)",
                transition: "all 0.2s ease"
              }}
            >
              <FaCalendarTimes size={13} /> Citas Canceladas
              <span
                style={{
                  background: activeView === "canceladas" ? "rgba(255,255,255,0.22)" : "rgba(239, 68, 68, 0.15)",
                  color: activeView === "canceladas" ? "#ffffff" : "#ef4444",
                  padding: "1px 8px",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: 800
                }}
              >
                {citasCanceladas.length}
              </span>
            </button>
          </div>
        </div>

        {/* ==================== VISTA 1: CALENDARIO DE CITAS ==================== */}
        {activeView === "calendario" ? (
          <div className="agenda-columns">
            {/* Calendario */}
            <div className="agenda-left">
              {/* Barra rápida superior en móvil para ver citas o agendar sin tener que bajar */}
              <div className="mobile-day-quickbar">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <span
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "var(--primary, #6366f1)",
                      color: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <FaCalendarAlt size={14} />
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      {selectedDay === hoyStr ? "Citas de Hoy" : "Día seleccionado"}
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "var(--text-main)" }}>
                      {selectedDay ? formatDateDDMMYYYY(selectedDay) : formatDateDDMMYYYY(hoyStr)} ({citasDelDia.length})
                    </strong>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setShowMobileDaySheet(true)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--primary, #6366f1)",
                      background: "var(--primary, #6366f1)",
                      color: "#ffffff",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Ver Citas ({citasDelDia.length})
                  </button>
                  {selectedDay && (
                    <button
                      type="button"
                      onClick={() => setShowAgendarManualModal(true)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(99, 102, 241, 0.35)",
                        background: "rgba(255, 255, 255, 0.85)",
                        color: "var(--primary, #6366f1)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <FaPlus size={10} /> Agendar
                    </button>
                  )}
                </div>
              </div>

              <Calendar
                onClickDay={handleDayClick}
                tileDisabled={({ date }) => {
                  const iso = toLocalISODate(date);
                  const hoy = toLocalISODate(new Date());
                  if (user?.client?.blockSundays && date.getDay() === 0) return true;
                  return iso < hoy;
                }}
                tileClassName={({ date }) => {
                  const iso = toLocalISODate(date);
                  const hoy = toLocalISODate(new Date());
                  if (user?.client?.blockSundays && date.getDay() === 0) return "sunday-blocked";
                  if (iso < hoy) return "past-day";
                  if (blockedDatesPaciente.includes(iso)) return "blocked-paciente";
                  if (blockedDatesAdmin.includes(iso)) return "blocked-admin";
                  return null;
                }}
              />
              <CalendarLegend showSundays={!!user?.client?.blockSundays} />
            </div>

            {/* Citas del día */}
            <div className="agenda-right-citas" style={{ marginTop: "20px" }}>
              <div
                className="text-muted text-center"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}
              >
                <h4>
                  {selectedDay
                    ? selectedDay === hoyStr
                      ? `Citas para hoy (${formatDateDDMMYYYY(selectedDay)})`
                      : `Citas para ${formatDateDDMMYYYY(selectedDay)}`
                    : "Selecciona un día"}
                </h4>

                {(selectedDayBlockedHours.length > 0 || selectedDayBlockNote) && (
                  <div
                    style={{
                      width: "100%",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: "8px",
                      padding: "0.65rem 0.85rem",
                      color: "var(--danger, #ef4444)",
                      fontSize: "0.82rem",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px"
                    }}
                  >
                    {selectedDayBlockedHours.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <FaLock size={12} />
                        <span>
                          {selectedDayBlockedHours.length >= 12
                            ? "Día completo bloqueado"
                            : `Horas bloqueadas: ${selectedDayBlockedHours.join(", ")}`}
                        </span>
                      </div>
                    )}
                    {selectedDayBlockNote && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                        <FaStickyNote size={12} style={{ color: "var(--danger, #ef4444)" }} />
                        <span>
                          <strong>Nota:</strong> {selectedDayBlockNote}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedDay && (
                  <button
                    type="button"
                    className="btn-primary-action hover-grow"
                    onClick={() => setShowAgendarManualModal(true)}
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "0.9rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--primary, #5e50a1)",
                      color: "#ffffff",
                      fontWeight: "600",
                      cursor: "pointer",
                      width: "auto"
                    }}
                  >
                    <FaPlus size={12} style={{ marginRight: "6px" }} /> Agendar Cita Manual
                  </button>
                )}
              </div>

              <div className="right-body">
                {loadingCitas ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: "160px",
                      padding: "1.5rem 0"
                    }}
                  >
                    <LoadingSpinner text="Cargando citas..." />
                  </div>
                ) : selectedDay ? (
                  citasDelDia.length > 0 ? (
                    <>
                      {/* 1. VISTA ESCRITORIO (> 960px): Tarjeta completa alineada */}
                      <div className="citas-dia-desktop">
                        {citasDelDia.map((cita, i) => {
                          const esNuevo = cita.esNuevoPaciente;
                          const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();

                          return (
                            <div
                              key={cita._id || i}
                              className={`appointment-card ${esNuevo ? "nuevo-paciente-card" : ""}`}
                              style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0.65rem" }}
                            >
                              <div
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.85rem", cursor: "pointer" }}
                                onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                              >
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    background: "rgba(99, 102, 241, 0.1)",
                                    color: "var(--primary)",
                                    padding: "5px 10px",
                                    borderRadius: "8px",
                                    fontWeight: 800,
                                    fontSize: "0.92rem",
                                    flexShrink: 0
                                  }}
                                >
                                  <FaClock size={12} /> {cita.horaCita}
                                </div>

                                <div style={{ flex: 1, textAlign: "left", display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                                    <strong style={{ color: "var(--text-main)", fontSize: "0.95rem" }}>
                                      {nombreCompleto}
                                    </strong>
                                    {esNuevo && (
                                      <span className="nuevo-paciente" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <FaStar size={10} /> Nuevo
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                    {cita.telefono && (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <FaPhoneAlt size={10} style={{ color: "var(--primary)" }} /> {cita.telefono}
                                      </span>
                                    )}
                                    <span style={{ textTransform: "capitalize" }}>
                                      Área: <strong style={{ color: "var(--primary)" }}>{cita.area}</strong>
                                    </span>
                                  </div>

                                  {cita.especialistaNombre && (
                                    <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600" }}>
                                      Atiende: {cita.especialistaNombre}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(3, 1fr)",
                                  gap: "6px",
                                  borderTop: "1px solid var(--border-light, rgba(148,163,184,0.18))",
                                  paddingTop: "0.55rem"
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(99, 102, 241, 0.25)",
                                    background: "rgba(99, 102, 241, 0.1)",
                                    color: "var(--primary)",
                                    fontSize: "0.76rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <FaFolderOpen size={11} /> Expediente
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCitaParaReagendar(cita)}
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(16, 185, 129, 0.3)",
                                    background: "rgba(16, 185, 129, 0.1)",
                                    color: "#10b981",
                                    fontSize: "0.76rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <FaRedoAlt size={11} /> Reagendar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCitaParaCancelar(cita)}
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    color: "#ef4444",
                                    fontSize: "0.76rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <FaTimesCircle size={11} /> Cancelar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ height: "15px" }}></div>
                      </div>

                      {/* 2. VISTA RESPONSIVA (<= 960px): Acordeón desplegable compacto */}
                      <div className="citas-dia-mobile-accordion">
                        {citasDelDia.map((cita, i) => {
                          const citaKey = cita._id || `cita-${i}`;
                          const isExpanded = expandedCitaId === citaKey;
                          const esNuevo = cita.esNuevoPaciente;
                          const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();

                          return (
                            <div
                              key={citaKey}
                              className={`appointment-card ${esNuevo ? "nuevo-paciente-card" : ""}`}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "stretch",
                                padding: "0.85rem 1rem",
                                borderRadius: "12px",
                                border: isExpanded ? "1.5px solid var(--primary)" : "1px solid var(--card-border)",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {/* Cabecera compacta (siempre visible): Hora + Nombre + Chevron */}
                              <div
                                onClick={() => toggleExpandCita(citaKey)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "0.65rem",
                                  cursor: "pointer",
                                  userSelect: "none"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      background: "rgba(99, 102, 241, 0.12)",
                                      color: "var(--primary)",
                                      padding: "4px 9px",
                                      borderRadius: "8px",
                                      fontWeight: 800,
                                      fontSize: "0.85rem",
                                      flexShrink: 0
                                    }}
                                  >
                                    <FaClock size={11} /> {cita.horaCita}
                                  </span>

                                  <strong
                                    style={{
                                      color: "var(--text-main)",
                                      fontSize: "0.92rem",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis"
                                    }}
                                  >
                                    {nombreCompleto}
                                  </strong>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                  {esNuevo && (
                                    <span className="nuevo-paciente" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                      <FaStar size={9} /> Nuevo
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      width: "26px",
                                      height: "26px",
                                      borderRadius: "50%",
                                      background: isExpanded ? "var(--primary)" : "rgba(99, 102, 241, 0.08)",
                                      color: isExpanded ? "#fff" : "var(--primary)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.2s ease"
                                    }}
                                  >
                                    {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                                  </span>
                                </div>
                              </div>

                              {/* Contenido desplegable al tocar la cita */}
                              {isExpanded && (
                                <div
                                  style={{
                                    marginTop: "0.75rem",
                                    paddingTop: "0.75rem",
                                    borderTop: "1px dashed var(--border-light, rgba(148,163,184,0.25))",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.75rem"
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "1fr 1fr",
                                      gap: "0.5rem",
                                      background: "rgba(99, 102, 241, 0.04)",
                                      padding: "0.65rem 0.75rem",
                                      borderRadius: "8px",
                                      fontSize: "0.82rem",
                                      textAlign: "left"
                                    }}
                                  >
                                    <div>
                                      <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                        Teléfono
                                      </span>
                                      <strong style={{ color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                        <FaPhoneAlt size={10} style={{ color: "var(--primary)" }} />
                                        {cita.telefono || "No registrado"}
                                      </strong>
                                    </div>

                                    <div>
                                      <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                        Área
                                      </span>
                                      <strong style={{ color: "var(--primary)", textTransform: "capitalize" }}>
                                        {cita.area}
                                      </strong>
                                    </div>

                                    {cita.especialistaNombre && (
                                      <div style={{ gridColumn: "1 / -1" }}>
                                        <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                          Especialista
                                        </span>
                                        <strong style={{ color: "var(--text-main)" }}>{cita.especialistaNombre}</strong>
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                      style={{
                                        padding: "7px 6px",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(99, 102, 241, 0.3)",
                                        background: "rgba(99, 102, 241, 0.1)",
                                        color: "var(--primary)",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FaFolderOpen size={11} /> Expediente
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setCitaParaReagendar(cita)}
                                      style={{
                                        padding: "7px 6px",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(16, 185, 129, 0.35)",
                                        background: "rgba(16, 185, 129, 0.1)",
                                        color: "#10b981",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FaRedoAlt size={11} /> Reagendar
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setCitaParaCancelar(cita)}
                                      style={{
                                        padding: "7px 6px",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(239, 68, 68, 0.35)",
                                        background: "rgba(239, 68, 68, 0.1)",
                                        color: "#ef4444",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "4px"
                                      }}
                                    >
                                      <FaTimesCircle size={11} /> Cancelar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="no-appointments">No hay citas programadas para este día.</p>
                  )
                ) : (
                  <p className="no-appointments">Selecciona un día del calendario para ver sus citas.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ==================== VISTA 2: CITAS CANCELADAS (ESCRITORIO + ACORDEÓN RESPONSIVO) ==================== */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Resumen KPIs de Cancelaciones */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem"
              }}
            >
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.06)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
                    Total Citas Canceladas
                  </span>
                  <strong style={{ fontSize: "1.6rem", color: "#ef4444" }}>{citasCanceladas.length}</strong>
                </div>
                <FaCalendarTimes size={26} style={{ color: "#ef4444", opacity: 0.8 }} />
              </div>

              <div
                style={{
                  background: "rgba(245, 158, 11, 0.06)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
                    Canceladas Hoy ({formatDateDDMMYYYY(hoyStr)})
                  </span>
                  <strong style={{ fontSize: "1.6rem", color: "#f59e0b" }}>{canceladasHoyCount}</strong>
                </div>
                <FaClock size={26} style={{ color: "#f59e0b", opacity: 0.8 }} />
              </div>

              <div
                style={{
                  background: adeudosPendientesCount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.06)",
                  border: adeudosPendientesCount > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, display: "block" }}>
                    Adeudos Pendientes (&lt;24 hrs)
                  </span>
                  <strong style={{ fontSize: "1.6rem", color: adeudosPendientesCount > 0 ? "#ef4444" : "#10b981" }}>
                    {adeudosPendientesCount}
                  </strong>
                </div>
                <FaMoneyBillWave size={26} style={{ color: adeudosPendientesCount > 0 ? "#ef4444" : "#10b981", opacity: 0.85 }} />
              </div>
            </div>

            {/* Buscador y filtro de fecha */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                alignItems: "center",
                background: "rgba(255,255,255,0.02)",
                padding: "0.85rem",
                borderRadius: "12px",
                border: "1px solid var(--border-light, rgba(148,163,184,0.2))"
              }}
            >
              <div style={{ position: "relative", flex: "1 1 260px" }}>
                <FaSearch
                  size={13}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Buscar por paciente, teléfono, expediente o motivo..."
                  value={searchCanceladas}
                  onChange={(e) => setSearchCanceladas(e.target.value)}
                  style={{ paddingLeft: "34px", margin: 0, width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  Fecha de cita:
                </label>
                <input
                  type="date"
                  className="input"
                  value={fechaFiltroCanceladas}
                  onChange={(e) => setFechaFiltroCanceladas(e.target.value)}
                  style={{ width: "auto", margin: 0, padding: "0.45rem 0.75rem" }}
                />
                {(searchCanceladas || fechaFiltroCanceladas) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearchCanceladas("");
                      setFechaFiltroCanceladas("");
                    }}
                    style={{ height: "38px", padding: "0 12px", fontSize: "0.8rem" }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {loadingCitas ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  minHeight: "180px",
                  padding: "2rem 0"
                }}
              >
                <LoadingSpinner text="Cargando citas canceladas..." />
              </div>
            ) : citasCanceladasFiltradas.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 1.5rem",
                  borderRadius: "12px",
                  border: "1px dashed var(--border-light, rgba(148,163,184,0.3))",
                  color: "var(--text-muted)"
                }}
              >
                <FaCalendarTimes size={36} style={{ color: "var(--text-muted)", opacity: 0.5, marginBottom: "0.75rem" }} />
                <p style={{ margin: "0 0 4px 0", fontWeight: 700, color: "var(--text-main)", fontSize: "1rem" }}>
                  No hay citas canceladas para mostrar
                </p>
                <span style={{ fontSize: "0.85rem" }}>
                  Todas las citas que se cancelen quedarán registradas en este historial para su seguimiento o reprogramación.
                </span>
              </div>
            ) : (
              <>
                {/* 1. TABLA DE ESCRITORIO (>= 960px) */}
                <div className="canceladas-desktop-table">
                  <table className="clinical-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Teléfono</th>
                        <th>Área</th>
                        <th>Fecha y Hora Cita</th>
                        <th>Cancelada el</th>
                        <th>Motivo / Autor</th>
                        <th style={{ textAlign: "right" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasCanceladasPaginadas.map((cita) => {
                        const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();
                        const fechaCancelStr = cita.fechaCancelacion
                          ? `${formatDateDDMMYYYY(cita.fechaCancelacion)} • ${new Date(cita.fechaCancelacion).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : formatDateDDMMYYYY(cita.fechaCitaStr);
                        const motivoTexto = cita.motivoCancelacion || "Cancelación registrada en sistema";
                        const autorTexto = cita.canceladoPor ? capitalizeWords(cita.canceladoPor) : "Especialista";
                        const tieneAdeudoPendiente = cita.tieneAdeudo && !cita.adeudoPagado;
                        const adeudoCobrado = cita.tieneAdeudo && cita.adeudoPagado;

                        return (
                          <tr key={cita._id} style={{ background: tieneAdeudoPendiente ? "rgba(239, 68, 68, 0.03)" : "transparent" }}>
                            <td>
                              <div
                                style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                                onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                              >
                                <div className="identity-avatar">
                                  {(cita.nombres || "P").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <strong style={{ color: "var(--text-main)", display: "block", fontSize: "0.9rem" }}>
                                    {nombreCompleto}
                                  </strong>
                                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                                    Exp: {cita.identificadorPaciente}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.85rem", fontWeight: 600 }}>
                                <FaPhoneAlt size={11} style={{ color: "var(--primary)" }} />
                                {cita.telefono || "No registrado"}
                              </span>
                            </td>

                            <td>
                              <span style={{ textTransform: "capitalize", fontWeight: 600, color: "var(--primary)", fontSize: "0.85rem" }}>
                                {cita.area}
                              </span>
                              {cita.especialistaNombre && (
                                <span style={{ display: "block", fontSize: "0.73rem", color: "var(--text-muted)" }}>
                                  {cita.especialistaNombre}
                                </span>
                              )}
                            </td>

                            <td>
                              <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.86rem" }}>
                                {formatDateDDMMYYYY(cita.fechaCitaStr)}
                              </div>
                              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <FaClock size={11} /> {cita.horaCita} hrs
                              </div>
                            </td>

                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  fontWeight: 600,
                                  fontSize: "0.78rem"
                                }}
                              >
                                {fechaCancelStr}
                              </span>
                            </td>

                            <td style={{ maxWidth: "240px" }}>
                              {tieneAdeudoPendiente && (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "2px 7px",
                                    borderRadius: "6px",
                                    background: "rgba(239, 68, 68, 0.15)",
                                    color: "#dc2626",
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    marginBottom: "4px"
                                  }}
                                  title="Cancelada con menos de 24 hrs. Cobrar en su próxima cita"
                                >
                                  <FaExclamationCircle size={10} /> Adeudo Pendiente (&lt;24h)
                                </div>
                              )}
                              {adeudoCobrado && (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "2px 7px",
                                    borderRadius: "6px",
                                    background: "rgba(16, 185, 129, 0.12)",
                                    color: "#059669",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    marginBottom: "4px"
                                  }}
                                >
                                  <FaCheck size={9} /> Adeudo Cobrado
                                </div>
                              )}
                              <div style={{ fontSize: "0.83rem", color: "var(--text-main)", fontWeight: 500, wordBreak: "break-word" }}>
                                {motivoTexto}
                              </div>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                Por: <strong>{autorTexto}</strong>
                              </span>
                            </td>

                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {tieneAdeudoPendiente && (
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() => handleCobrarAdeudo(cita)}
                                    style={{
                                      height: "32px",
                                      padding: "0 10px",
                                      fontSize: "0.78rem",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      width: "auto",
                                      background: "rgba(16, 185, 129, 0.15)",
                                      color: "#059669",
                                      border: "1px solid rgba(16, 185, 129, 0.35)",
                                      fontWeight: 700
                                    }}
                                    title="Marcar como cobrado el adeudo de esta cita cancelada"
                                  >
                                    <FaMoneyBillWave size={12} /> Cobrar Adeudo
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => setCitaParaReagendar(cita)}
                                  style={{
                                    height: "32px",
                                    padding: "0 10px",
                                    fontSize: "0.78rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    width: "auto"
                                  }}
                                  title="Reprogramar esta cita"
                                >
                                  <FaRedoAlt size={11} /> Reagendar
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                  style={{
                                    height: "32px",
                                    padding: "0 10px",
                                    fontSize: "0.78rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    width: "auto"
                                  }}
                                  title="Abrir expediente del paciente"
                                >
                                  <FaFolderOpen size={11} /> Expediente
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. TARJETAS ACORDEÓN RESPONSIVAS (< 960px) CON EL MISMO CONTENIDO EXACTO */}
                <div className="canceladas-mobile-cards">
                  {citasCanceladasPaginadas.map((cita, idx) => {
                    const cancelKey = cita._id || `canc-${idx}`;
                    const isExpanded = expandedCanceladaId === cancelKey;
                    const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();
                    const fechaCancelStr = cita.fechaCancelacion
                      ? `${formatDateDDMMYYYY(cita.fechaCancelacion)} • ${new Date(cita.fechaCancelacion).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : formatDateDDMMYYYY(cita.fechaCitaStr);
                    const motivoTexto = cita.motivoCancelacion || "Cancelación registrada en sistema";
                    const autorTexto = cita.canceladoPor ? capitalizeWords(cita.canceladoPor) : "Especialista";
                    const tieneAdeudoPendiente = cita.tieneAdeudo && !cita.adeudoPagado;
                    const adeudoCobrado = cita.tieneAdeudo && cita.adeudoPagado;

                    return (
                      <div
                        key={cancelKey}
                        className="mobile-row-card glass-card"
                        style={{
                          border: tieneAdeudoPendiente
                            ? "2px solid #ef4444"
                            : isExpanded
                            ? "1.5px solid #ef4444"
                            : "1px solid rgba(239, 68, 68, 0.22)",
                          borderRadius: "12px",
                          padding: "0.9rem 1rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.65rem",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {/* Cabecera compacta: Fecha/Hora + Nombre + Chevron */}
                        <div
                          onClick={() => toggleExpandCancelada(cancelKey)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            userSelect: "none"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                            <div className="identity-avatar" style={{ flexShrink: 0 }}>
                              {(cita.nombres || "P").charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0, textAlign: "left" }}>
                              <strong
                                style={{
                                  color: "var(--text-main)",
                                  fontSize: "0.92rem",
                                  display: "block",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {nombreCompleto}
                              </strong>
                              <span style={{ fontSize: "0.76rem", color: "#ef4444", fontWeight: 700 }}>
                                {formatDateDDMMYYYY(cita.fechaCitaStr)} • {cita.horaCita} hrs
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            {tieneAdeudoPendiente && (
                              <span
                                style={{
                                  padding: "2px 7px",
                                  borderRadius: "999px",
                                  background: "rgba(239, 68, 68, 0.2)",
                                  color: "#dc2626",
                                  fontWeight: 800,
                                  fontSize: "0.68rem"
                                }}
                              >
                                Adeudo
                              </span>
                            )}
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background: "rgba(239, 68, 68, 0.14)",
                                color: "#ef4444",
                                fontWeight: 700,
                                fontSize: "0.68rem",
                                textTransform: "uppercase"
                              }}
                            >
                              Cancelada
                            </span>
                            <span
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                background: isExpanded ? "#ef4444" : "rgba(239, 68, 68, 0.1)",
                                color: isExpanded ? "#fff" : "#ef4444",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                            </span>
                          </div>
                        </div>

                        {/* Detalle desplegable */}
                        {isExpanded && (
                          <div
                            style={{
                              paddingTop: "0.65rem",
                              borderTop: "1px dashed rgba(239, 68, 68, 0.25)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.65rem"
                            }}
                          >
                            <div className="mobile-card-details" style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.83rem" }}>
                              <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                                <span className="detail-label" style={{ color: "var(--text-muted)", fontWeight: 600 }}>Teléfono:</span>
                                <span className="detail-value" style={{ fontWeight: 600 }}>
                                  <FaPhoneAlt size={11} style={{ color: "var(--primary)", marginRight: "4px" }} />
                                  {cita.telefono || "No registrado"}
                                </span>
                              </div>

                              <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                                <span className="detail-label" style={{ color: "var(--text-muted)", fontWeight: 600 }}>Área:</span>
                                <span className="detail-value" style={{ color: "var(--primary)", fontWeight: 700, textTransform: "capitalize" }}>
                                  {cita.area} {cita.especialistaNombre ? `(${cita.especialistaNombre})` : ""}
                                </span>
                              </div>

                              <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                                <span className="detail-label" style={{ color: "var(--text-muted)", fontWeight: 600 }}>Fecha y Hora Cita:</span>
                                <strong style={{ color: "var(--text-main)" }}>
                                  {formatDateDDMMYYYY(cita.fechaCitaStr)} • {cita.horaCita} hrs
                                </strong>
                              </div>

                              <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                                <span className="detail-label" style={{ color: "var(--text-muted)", fontWeight: 600 }}>Cancelada el:</span>
                                <span style={{ color: "#ef4444", fontWeight: 600 }}>{fechaCancelStr}</span>
                              </div>

                              <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                                <span className="detail-label" style={{ color: "var(--text-muted)", fontWeight: 600 }}>Cancelado por:</span>
                                <strong style={{ color: "var(--text-main)" }}>{autorTexto}</strong>
                              </div>

                              <div
                                style={{
                                  marginTop: "0.2rem",
                                  padding: "0.55rem 0.75rem",
                                  borderRadius: "8px",
                                  background: "rgba(239, 68, 68, 0.05)",
                                  border: "1px dashed rgba(239, 68, 68, 0.22)",
                                  textAlign: "left"
                                }}
                              >
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, display: "block" }}>
                                  Motivo de cancelación:
                                </span>
                                <span style={{ fontSize: "0.83rem", color: "var(--text-main)", fontWeight: 500 }}>
                                  {motivoTexto}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: tieneAdeudoPendiente ? "1fr" : "1fr 1fr", gap: "8px" }}>
                              {tieneAdeudoPendiente && (
                                <button
                                  type="button"
                                  className="btn"
                                  onClick={() => handleCobrarAdeudo(cita)}
                                  style={{
                                    height: "36px",
                                    fontSize: "0.82rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    width: "100%",
                                    background: "rgba(16, 185, 129, 0.15)",
                                    color: "#059669",
                                    border: "1px solid rgba(16, 185, 129, 0.35)",
                                    fontWeight: 700
                                  }}
                                >
                                  <FaMoneyBillWave size={12} /> Marcar Adeudo como Cobrado
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setCitaParaReagendar(cita)}
                                style={{ height: "36px", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%" }}
                              >
                                <FaRedoAlt size={11} /> Reagendar
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`)}
                                style={{ height: "36px", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%" }}
                              >
                                <FaFolderOpen size={11} /> Expediente
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Controles de Paginación para Citas Canceladas */}
                <div className="pagination-container-modern">
                  <span className="pagination-stats">
                    Mostrando <strong>{startIndexCanceladas + 1}</strong> - <strong>{endIndexCanceladas}</strong> de{" "}
                    <strong>{citasCanceladasFiltradas.length}</strong> citas canceladas
                  </span>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={safePageCanceladas <= 1}
                      onClick={() => {
                        setExpandedCanceladaId(null);
                        setCurrentPageCanceladas((prev) => Math.max(1, prev - 1));
                      }}
                    >
                      Anterior
                    </button>

                    {Array.from({ length: totalPagesCanceladas }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`pagination-btn ${safePageCanceladas === pageNum ? "active" : ""}`}
                        onClick={() => {
                          setExpandedCanceladaId(null);
                          setCurrentPageCanceladas(pageNum);
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={safePageCanceladas >= totalPagesCanceladas}
                      onClick={() => {
                        setExpandedCanceladaId(null);
                        setCurrentPageCanceladas((prev) => Math.min(totalPagesCanceladas, prev + 1));
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Panel Emergente (Modal centrado en pantalla) para Citas del Día en Móvil (<= 960px) */}
      {showMobileDaySheet && !showAgendarManualModal && !citaParaCancelar && !citaParaReagendar &&
        createPortal(
          <div
            className="mobile-day-modal-overlay"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 9990,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "520px",
                maxHeight: "82vh",
                background: "var(--card-bg, #ffffff)",
                borderRadius: "20px",
                border: "1px solid var(--card-border, rgba(148,163,184,0.25))",
                boxShadow: "0 20px 50px rgba(15, 23, 42, 0.32)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                animation: "slideUpSheet 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              {/* Cabecera fija del Modal */}
              <div
                style={{
                  padding: "1rem 1.15rem 0.9rem",
                  borderBottom: "1px solid var(--border-light, rgba(148,163,184,0.2))",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem"
                }}
              >

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      {selectedDay === hoyStr ? "Agenda de Hoy" : "Agenda del Día"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text-main)" }}>
                        {selectedDay ? formatDateDDMMYYYY(selectedDay) : "Selecciona un día"}
                      </h4>
                      <span
                        style={{
                          background: "rgba(99, 102, 241, 0.12)",
                          color: "var(--primary, #6366f1)",
                          padding: "2px 9px",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          fontWeight: 800
                        }}
                      >
                        {citasDelDia.length} {citasDelDia.length === 1 ? "cita" : "citas"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {selectedDay && (
                      <button
                        type="button"
                        onClick={() => setShowAgendarManualModal(true)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: "9px",
                          border: "none",
                          background: "var(--primary, #5e50a1)",
                          color: "#ffffff",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <FaPlus size={11} /> Agendar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowMobileDaySheet(false)}
                      aria-label="Cerrar panel de citas"
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        border: "1px solid var(--border-light, rgba(148,163,184,0.3))",
                        background: "rgba(148, 163, 184, 0.12)",
                        color: "var(--text-main)",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {(selectedDayBlockedHours.length > 0 || selectedDayBlockNote) && (
                  <div
                    style={{
                      width: "100%",
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: "8px",
                      padding: "0.55rem 0.75rem",
                      color: "var(--danger, #ef4444)",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px"
                    }}
                  >
                    {selectedDayBlockedHours.length > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                        <FaLock size={11} />
                        <span>
                          {selectedDayBlockedHours.length >= 12
                            ? "Día completo bloqueado"
                            : `Horas bloqueadas: ${selectedDayBlockedHours.join(", ")}`}
                        </span>
                      </div>
                    )}
                    {selectedDayBlockNote && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                        <FaStickyNote size={11} style={{ color: "var(--danger, #ef4444)" }} />
                        <span>
                          <strong>Nota:</strong> {selectedDayBlockNote}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cuerpo desplazable con el acordeón compacto de citas */}
              <div
                style={{
                  padding: "1rem 1.15rem 1.5rem",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem"
                }}
              >
                {loadingCitas ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      minHeight: "150px",
                      padding: "1.5rem 0"
                    }}
                  >
                    <LoadingSpinner text="Cargando citas..." />
                  </div>
                ) : citasDelDia.length > 0 ? (
                  citasDelDia.map((cita, i) => {
                    const citaKey = cita._id || `sheet-cita-${i}`;
                    const isExpanded = expandedCitaId === citaKey;
                    const esNuevo = cita.esNuevoPaciente;
                    const nombreCompleto = `${capitalizeWords(cita.nombres || "")} ${capitalizeWords(cita.apellidos || cita.apellidoPaterno || "")}`.trim();

                    return (
                      <div
                        key={citaKey}
                        className={`appointment-card ${esNuevo ? "nuevo-paciente-card" : ""}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          padding: "0.85rem 1rem",
                          borderRadius: "12px",
                          border: isExpanded ? "1.5px solid var(--primary)" : "1px solid var(--card-border)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {/* Cabecera compacta: Hora + Nombre + Insignia Nuevo + Chevron */}
                        <div
                          onClick={() => toggleExpandCita(citaKey)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.65rem",
                            cursor: "pointer",
                            userSelect: "none"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "rgba(99, 102, 241, 0.12)",
                                color: "var(--primary)",
                                padding: "4px 9px",
                                borderRadius: "8px",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                flexShrink: 0
                              }}
                            >
                              <FaClock size={11} /> {cita.horaCita}
                            </span>

                            <strong
                              style={{
                                color: "var(--text-main)",
                                fontSize: "0.92rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              {nombreCompleto}
                            </strong>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            {esNuevo && (
                              <span className="nuevo-paciente" style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                <FaStar size={9} /> Nuevo
                              </span>
                            )}
                            <span
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                background: isExpanded ? "var(--primary)" : "rgba(99, 102, 241, 0.08)",
                                color: isExpanded ? "#fff" : "var(--primary)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                            </span>
                          </div>
                        </div>

                        {/* Contenido desplegable */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: "0.75rem",
                              paddingTop: "0.75rem",
                              borderTop: "1px dashed var(--border-light, rgba(148,163,184,0.25))",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem"
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "0.5rem",
                                background: "rgba(99, 102, 241, 0.04)",
                                padding: "0.65rem 0.75rem",
                                borderRadius: "8px",
                                fontSize: "0.82rem",
                                textAlign: "left"
                              }}
                            >
                              <div>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                  Teléfono
                                </span>
                                <strong style={{ color: "var(--text-main)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <FaPhoneAlt size={10} style={{ color: "var(--primary)" }} />
                                  {cita.telefono || "No registrado"}
                                </strong>
                              </div>

                              <div>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                  Área
                                </span>
                                <strong style={{ color: "var(--primary)", textTransform: "capitalize" }}>
                                  {cita.area}
                                </strong>
                              </div>

                              {cita.especialistaNombre && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 600, display: "block" }}>
                                    Especialista
                                  </span>
                                  <strong style={{ color: "var(--text-main)" }}>{cita.especialistaNombre}</strong>
                                </div>
                              )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowMobileDaySheet(false);
                                  navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`);
                                }}
                                style={{
                                  padding: "7px 6px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(99, 102, 241, 0.3)",
                                  background: "rgba(99, 102, 241, 0.1)",
                                  color: "var(--primary)",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px"
                                }}
                              >
                                <FaFolderOpen size={11} /> Expediente
                              </button>

                              <button
                                type="button"
                                onClick={() => setCitaParaReagendar(cita)}
                                style={{
                                  padding: "7px 6px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(16, 185, 129, 0.35)",
                                  background: "rgba(16, 185, 129, 0.1)",
                                  color: "#10b981",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px"
                                }}
                              >
                                <FaRedoAlt size={11} /> Reagendar
                              </button>

                              <button
                                type="button"
                                onClick={() => setCitaParaCancelar(cita)}
                                style={{
                                  padding: "7px 6px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(239, 68, 68, 0.35)",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px"
                                }}
                              >
                                <FaTimesCircle size={11} /> Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    No hay citas programadas para este día.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Agendar Manual */}
      {showAgendarManualModal && (
        <ModalAgendarManual
          selectedDateInitial={selectedDay}
          onClose={() => setShowAgendarManualModal(false)}
          onSaveSuccess={() => {
            setShowMobileDaySheet(false);
            setShowAgendarManualModal(false);
            fetchCitas();
          }}
        />
      )}

      {/* Modal Cancelar Cita (con validación de 24 hrs y vista de cancelada) */}
      {citaParaCancelar && (
        <ModalCancelarCita
          cita={citaParaCancelar}
          onClose={() => setCitaParaCancelar(null)}
          onCancelSuccess={() => {
            setShowMobileDaySheet(false);
            setCitaParaCancelar(null);
            fetchCitas();
          }}
          onReagendar={(citaCancelada) => {
            setCitaParaCancelar(null);
            setCitaParaReagendar(citaCancelada);
          }}
        />
      )}

      {/* Modal Reagendar Cita */}
      {citaParaReagendar && (
        <ModalAgendarCita
          paciente={{
            identificadorPaciente: citaParaReagendar.identificadorPaciente,
            nombres: citaParaReagendar.nombres,
            apellidoPaterno: citaParaReagendar.apellidoPaterno || "",
            apellidoMaterno: citaParaReagendar.apellidoMaterno || "",
            apellidos: citaParaReagendar.apellidos || "",
            telefono: citaParaReagendar.telefono || "",
            edad: citaParaReagendar.edad || 0,
            email: citaParaReagendar.email || "",
            area: citaParaReagendar.area || rolUsuario || rolePath
          }}
          citaAReagendar={citaParaReagendar}
          onSaveSuccess={() => {
            setShowMobileDaySheet(false);
            setCitaParaReagendar(null);
          }}
          onClose={() => {
            setCitaParaReagendar(null);
            fetchCitas();
          }}
        />
      )}
    </div>
  );
}
