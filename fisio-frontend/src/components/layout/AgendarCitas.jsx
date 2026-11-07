import { getUsuarioRol, formatDateDDMMYYYY, toLocalISODate, isHourPassed } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "react-calendar/dist/Calendar.css";
import Calendar from "react-calendar";
import "../../styles/calendary.css";
import api from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";
import { FaPlus, FaClock, FaStar, FaStickyNote, FaLock } from "react-icons/fa";

import ModalAgendarManual from "./ModalAgendarManual.jsx";
import CalendarLegend from "./CalendarLegend.jsx";

export default function AgendaCitas() {
  const { user: authUser } = useAuth();
  const [citas, setCitas] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [citasDelDia, setCitasDelDia] = useState([]);
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedNotesAdmin, setBlockedNotesAdmin] = useState({});
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [showAgendarManualModal, setShowAgendarManualModal] = useState(false);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  const user = authUser || storedUser;
  const rolUsuario = getUsuarioRol(user);
  const clientId = user?.client?._id || (typeof user?.client === "string" ? user.client : "");
  const hoyStr = toLocalISODate(new Date());
  const navigate = useNavigate();

  const fetchCitas = async () => {
    try {
      const endpoint = rolUsuario ? `/citas?area=${rolUsuario}` : "/citas";
      const { data } = await api.get(endpoint);
      setCitas(data || []);

      const query = clientId ? `?clientId=${clientId}` : "";

      let adminDays = [];
      let adminHours = {};
      let adminNotes = {};
      let pacienteDays = [
        ...new Set((data || []).filter(c => c.area !== "administrador" && c.estado !== "Cancelado").map(c => c.fechaCitaStr))
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
      let citasDia = (data || []).filter(c => c.fechaCitaStr === targetDay && c.estado !== "Cancelado");

      // Quitar de la lista las citas de hoy cuya hora ya transcurrió
      if (targetDay === hoyStr) {
        citasDia = citasDia.filter(c => !isHourPassed(c.horaCita, targetDay));
      }

      citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));

      if (!selectedDay) {
        setSelectedDay(hoyStr);
      }
      setCitasDelDia(citasDia);
    } catch (err) {
      console.error("Error al cargar citas:", err);
    }
  };

  // Cargar citas por rol, clínica o cambio de día
  useEffect(() => {
    fetchCitas();
  }, [rolUsuario, clientId, selectedDay]);

  const handleDayClick = (date) => {
    const iso = toLocalISODate(date);
    const hoy = toLocalISODate(new Date());
    if (iso < hoy) return;

    setSelectedDay(iso);
  };

  const selectedDayBlockedHours = selectedDay ? (blockedHoursAdmin[selectedDay] || []) : [];
  const selectedDayBlockNote = selectedDay ? (blockedNotesAdmin[selectedDay] || "") : "";

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card">

        <h2 className="logo-agendar mb-4">Agenda de citas</h2>

        <div className="agenda-columns">
          {/* Calendario */}
          <div className="agenda-left">
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
            <div className="text-muted text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <h4>
                {selectedDay
                  ? selectedDay === hoyStr
                    ? "Citas para hoy"
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
                      <span><strong>Nota:</strong> {selectedDayBlockNote}</span>
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
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary, #5e50a1)',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: 'auto'
                  }}
                >
                  <FaPlus size={12} style={{ marginRight: "6px" }} /> Agendar Cita Manual
                </button>
              )}
            </div>

            <div className="right-body">
              {selectedDay ? (
                citasDelDia.length > 0 ? (
                  <div className="appointments-list">
                    {citasDelDia.map((cita, i) => {
                      const esNuevo = cita.esNuevoPaciente;

                      return (
                        <div key={cita._id || i} className={`appointment-card ${esNuevo ? "nuevo-paciente-card" : ""}`}
                          onClick={() => {
                            const rolePath = user?.role || user?.rol || 'fisioterapeuta';
                            navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="appointment-time" style={{ display: "flex", alignItems: "center", gap: "4px" }}><FaClock size={11} /> {cita.horaCita}</div>
                          <div className="appointment-info">
                            <div className="appointment-name">
                              <strong>{cita.nombres} {cita.apellidos}</strong>
                            </div>
                            <div className="appointment-area">Área: {cita.area}</div>
                            {cita.especialistaNombre && (
                              <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600" }}>
                                Atiende: {cita.especialistaNombre}
                              </div>
                            )}
                            {esNuevo && <span className="nuevo-paciente" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaStar size={10} /> Nuevo</span>}
                          </div>
                        </div>
                      );
                    })}
                    {/* Spacer para scroll */}
                    <div style={{ height: '15px' }}></div>
                  </div>
                ) : (
                  <p className="no-appointments">No hay citas registradas este día.</p>
                )
              ) : (
                <p className="no-appointments">
                  Selecciona un día del calendario para ver sus citas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {showAgendarManualModal && (
        <ModalAgendarManual
          selectedDateInitial={selectedDay}
          onClose={() => setShowAgendarManualModal(false)}
          onSaveSuccess={() => {
            fetchCitas();
          }}
        />
      )}
    </div>
  );
}
