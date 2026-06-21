import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../../api";
import "../../styles/calendary.css";
import LoadingSpinner from "./LoadingSpinner";
import { showSuccess, showError } from "../../utils/alerts";
import { formatDateDDMMYYYY } from "../../utils/utils";

const WORK_HOURS = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00"
];

const CalendarioBloqueo = ({ role }) => {
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [blockedHoursCitas, setBlockedHoursCitas] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHours, setSelectedHours] = useState([]);
  const [loading, setLoading] = useState(false);

  // Obtener bloqueos
  useEffect(() => {
    const fetchBlockedData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/horarios/${role}`);
        setBlockedDatesAdmin(data.blockedDatesAdmin || []);
        setBlockedHoursAdmin(data.blockedHoursAdmin || {});
        setBlockedDatesPaciente(data.blockedDatesPaciente || []);
        setBlockedHoursCitas(data.blockedHoursCitas || {});
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlockedData();
  }, [role]);

  // Día lleno
  const isDayFullyBlocked = (fechaStr) => {
    const bloqueadas = blockedHoursAdmin[fechaStr] || [];
    const citas = blockedHoursCitas[fechaStr] || [];
    const totalOcupadas = new Set([...bloqueadas, ...citas]);
    return totalOcupadas.size >= WORK_HOURS.length;
  };

  // Clic en día
  const handleDayClick = (date) => {
    const fechaStr = date.toISOString().split("T")[0];
    const hoyStr = new Date().toISOString().split("T")[0];
    if (fechaStr < hoyStr) return; // no días pasados
    if (isDayFullyBlocked(fechaStr)) return; // día lleno

    setSelectedDay(fechaStr);
    setSelectedHours(blockedHoursAdmin[fechaStr] || []);
  };

  // Alternar hora
  const toggleHour = (hour) => {
    let updated;
    if (selectedHours.includes(hour)) {
      updated = selectedHours.filter((h) => h !== hour);
    } else {
      updated = [...selectedHours, hour];
    }
    setSelectedHours(updated);
  };

  // Guardar cambios
  const saveHours = async () => {
    if (!selectedDay) return;

    const newBlockedHours = { ...blockedHoursAdmin, [selectedDay]: selectedHours };
    const newBlockedDates = Object.entries(newBlockedHours)
      .filter(([_, hours]) => hours.length > 0)
      .map(([day]) => day);

    try {
      await api.post(`/horarios/${role}`, {
        blockedDates: newBlockedDates,
        blockedHours: newBlockedHours,
      });

      setBlockedDatesAdmin(newBlockedDates);
      setBlockedHoursAdmin(newBlockedHours);
      setSelectedDay(null);
      setSelectedHours([]);
      showSuccess("Horario guardado", "Los bloqueos de horario se guardaron correctamente en la base de datos.");
    } catch (err) {
      console.error("Error al guardar bloqueos:", err);
      showError("Error al guardar", "No se pudieron guardar los bloqueos de horario.");
    }
  };

  // Eliminar todos los bloqueos de un día
  const deleteDayBlocks = async (fechaStr) => {
    const newBlockedHours = { ...blockedHoursAdmin };
    delete newBlockedHours[fechaStr];
    const newBlockedDates = blockedDatesAdmin.filter((day) => day !== fechaStr);

    try {
      setLoading(true);
      await api.post(`/horarios/${role}`, {
        blockedDates: newBlockedDates,
        blockedHours: newBlockedHours,
      });

      setBlockedDatesAdmin(newBlockedDates);
      setBlockedHoursAdmin(newBlockedHours);
      showSuccess("Bloqueos eliminados", "Se eliminaron los bloqueos para este día en la base de datos.");
    } catch (err) {
      console.error("Error al eliminar bloqueos del día:", err);
      showError("Error al eliminar", "No se pudieron eliminar los bloqueos.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Clases visuales del calendario ----
  const tileClassName = ({ date }) => {
    const fechaStr = date.toISOString().split("T")[0];
    const hoyStr = new Date().toISOString().split("T")[0];

    // Días pasados → gris
    if (fechaStr < hoyStr) return "past-day";

    if (isDayFullyBlocked(fechaStr)) return "blocked-admin";
    if (blockedDatesAdmin.includes(fechaStr)) return "blocked-admin";
    if (blockedDatesPaciente.includes(fechaStr)) return "blocked-paciente";
    return "";
  };

  const tileDisabled = ({ date }) => {
    const fechaStr = date.toISOString().split("T")[0];
    const hoyStr = new Date().toISOString().split("T")[0];
    return fechaStr < hoyStr || isDayFullyBlocked(fechaStr);
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '1100px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', padding: '1rem 0' }}>
        
        {/* Left Card: Calendar */}
        <div className="auth-card" style={{ marginTop: 0, padding: '2rem' }}>
          <div className="card-header-split" style={{ marginBottom: "1rem" }}>
            <h2 className="title_card" style={{ margin: 0 }}>Control de Horarios</h2>
            <span className="subtitle-card-badge">Bloqueo de Calendario</span>
          </div>
          <hr style={{ marginBottom: "1.5rem" }} />

          <Calendar
            onClickDay={handleDayClick}
            tileDisabled={tileDisabled}
            tileClassName={tileClassName}
          />
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger, #ef4444)' }}></span>
              <span>Día con horas bloqueadas por ti</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(13, 148, 136, 0.15)', border: '1px solid rgb(13, 148, 136)' }}></span>
              <span>Día con citas agendadas por pacientes</span>
            </div>
          </div>
        </div>

        {/* Right Card: Hours Selector & Blocked Days Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {selectedDay && (
            <div className="auth-card" style={{ marginTop: 0, padding: '2rem' }}>
              <div className="card-header-split" style={{ marginBottom: "1rem" }}>
                <h3 className="title_card" style={{ margin: 0, fontSize: '1.2rem' }}>
                  Bloquear horas para {formatDateDDMMYYYY(selectedDay)}
                </h3>
              </div>
              <hr style={{ marginBottom: "1.2rem" }} />
              
              <div className="hours-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {WORK_HOURS.map((hour) => {
                  const hoyStr = new Date().toISOString().split("T")[0];
                  const bloqueadasPorPaciente = blockedHoursCitas[selectedDay]?.includes(hour);
                  const bloqueadasPorAdmin = selectedHours.includes(hour);

                  const isPastLimit = (() => {
                    if (selectedDay !== hoyStr) return false;
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    const currentDecimal = currentHour + currentMinute / 60;

                    const [sHour, sMin] = hour.split(":").map(Number);
                    const slotDecimal = sHour + sMin / 60;

                    return slotDecimal < (currentDecimal - 2);
                  })();

                  const isDisabled = bloqueadasPorPaciente || isPastLimit;

                  return (
                    <button
                      key={hour}
                      type="button"
                      className={`hour-btn ${
                        bloqueadasPorAdmin ? "blocked-admin-hour" : ""
                      } ${
                        bloqueadasPorPaciente ? "blocked-paciente-hour" : ""
                      }`}
                      style={{
                        padding: '0.6rem 0.5rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        background: bloqueadasPorAdmin 
                          ? 'var(--primary, #5e50a1)' 
                          : bloqueadasPorPaciente 
                            ? 'rgba(239, 68, 68, 0.1)' 
                            : isPastLimit
                              ? 'rgba(226, 232, 240, 0.4)'
                              : 'transparent',
                        color: bloqueadasPorAdmin 
                          ? '#ffffff' 
                          : bloqueadasPorPaciente 
                            ? 'var(--danger, #ef4444)' 
                            : isPastLimit
                              ? 'var(--text-muted, #94a3b8)'
                              : 'var(--text-main)',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: bloqueadasPorAdmin || bloqueadasPorPaciente ? '600' : 'normal',
                      }}
                      onClick={() => !isDisabled && toggleHour(hour)}
                      disabled={isDisabled}
                    >
                      {hour} {bloqueadasPorPaciente ? "(Cita)" : isPastLimit ? "(Pasada)" : ""}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="save-btn" 
                  style={{ background: "#64748b", margin: 0, flex: 1 }} 
                  onClick={() => { setSelectedDay(null); setSelectedHours([]); }}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  className="save-btn" 
                  onClick={saveHours} 
                  disabled={loading} 
                  style={{ margin: 0, flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {loading ? <LoadingSpinner size="small" color="#fff" /> : "Guardar Cambios"}
                </button>
              </div>
            </div>
          )}

          {/* Blocked Days Summary Card */}
          <div className="auth-card" style={{ marginTop: 0, padding: '2rem', flex: 1 }}>
            {(() => {
              const hoyStr = new Date().toISOString().split("T")[0];
              const activeBlockedDates = blockedDatesAdmin
                .filter((dateStr) => dateStr >= hoyStr)
                .sort();

              return (
                <>
                  <div className="card-header-split" style={{ marginBottom: "1rem" }}>
                    <h3 className="title_card" style={{ margin: 0, fontSize: '1.2rem' }}>
                      Resumen de Bloqueos
                    </h3>
                    <span className="subtitle-card-badge">
                      {activeBlockedDates.length} días bloqueados
                    </span>
                  </div>
                  <hr style={{ marginBottom: "1.2rem" }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                    {activeBlockedDates.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
                        No tienes días futuros con bloqueos activos.
                      </p>
                    ) : (
                      activeBlockedDates.map((dateStr) => {
                        const hours = blockedHoursAdmin[dateStr] || [];
                        const isFull = hours.length === WORK_HOURS.length;
                        return (
                    <div 
                      key={dateStr} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '0.85rem 1rem', 
                        borderRadius: '8px', 
                        background: 'rgba(94, 80, 161, 0.03)', 
                        border: '1px solid var(--border-light, #e2e8f0)' 
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{formatDateDDMMYYYY(dateStr)}</span>
                        <span style={{ fontSize: '0.8rem', color: isFull ? 'var(--danger, #ef4444)' : 'var(--text-muted)' }}>
                          {isFull ? "🔒 Día Completo Bloqueado" : `⏰ Horas: ${hours.join(", ")}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteDayBlocks(dateStr)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--danger, #ef4444)',
                          border: 'none',
                          borderRadius: '6px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s'
                        }}
                        title="Eliminar bloqueos de este día"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CalendarioBloqueo;
