import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { useAuth } from "../../context/AuthContext";

export default function ModalAgendarCita({ paciente, onClose, citaAReagendar = null }) {
  const { user } = useAuth();
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedNotesAdmin, setBlockedNotesAdmin] = useState({});
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [blockedHoursCitas, setBlockedHoursCitas] = useState({});
  
  const [selectedDate, setSelectedDate] = useState(citaAReagendar ? citaAReagendar.fechaCitaStr : null);
  const [selectedHour, setSelectedHour] = useState(citaAReagendar ? citaAReagendar.horaCita : null);
  const [availableHours, setAvailableHours] = useState([]);
  const [showHours, setShowHours] = useState(!!citaAReagendar);

  const allHours = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ];

  const toLocalISODate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateDDMMYYYY = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  const calculateAvailableHours = (iso) => {
    const bloqueadasAdmin = blockedHoursAdmin[iso] || [];
    const bloqueadasPacientes = blockedHoursCitas[iso] || [];
    const bloqueadasPacientesFiltered = citaAReagendar && citaAReagendar.fechaCitaStr === iso
      ? bloqueadasPacientes.filter(h => h !== citaAReagendar.horaCita)
      : bloqueadasPacientes;
    const bloqueadas = [...new Set([...bloqueadasAdmin, ...bloqueadasPacientesFiltered])];

    const ahora = new Date();
    const hoy = toLocalISODate(ahora);
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

  useEffect(() => {
    if (!paciente || !paciente.area) return;
    const fetchBlockedDates = async () => {
      try {
        const { data } = await api.get(`/horarios/${paciente.area}`);
        setBlockedDatesAdmin(data.blockedDatesAdmin || []);
        setBlockedHoursAdmin(data.blockedHoursAdmin || {});
        setBlockedNotesAdmin(data.blockedNotesAdmin || {});
        setBlockedDatesPaciente(data.blockedDatesPaciente || []);
        setBlockedHoursCitas(data.blockedHoursCitas || {});
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      }
    };
    fetchBlockedDates();
  }, [paciente]);

  useEffect(() => {
    if (selectedDate && Object.keys(blockedHoursAdmin).length >= 0) {
      calculateAvailableHours(selectedDate);
    }
  }, [selectedDate, blockedHoursAdmin, blockedHoursCitas]);

  const isDayFullyBlocked = (iso) => {
    const bloqueadasAdmin = blockedHoursAdmin[iso] || [];
    const bloqueadasPacientes = blockedHoursCitas[iso] || [];
    const bloqueadasPacientesFiltered = citaAReagendar && citaAReagendar.fechaCitaStr === iso
      ? bloqueadasPacientes.filter(h => h !== citaAReagendar.horaCita)
      : bloqueadasPacientes;
    const bloqueadas = [...new Set([...bloqueadasAdmin, ...bloqueadasPacientesFiltered])];
    return bloqueadas.length >= allHours.length;
  };

  const handleDateSelect = (date) => {
    const iso = toLocalISODate(date);
    const hoy = toLocalISODate(new Date());

    if (iso < hoy) {
      showError("Fecha inválida", "No puedes seleccionar fechas anteriores a hoy.");
      return;
    }

    setSelectedDate(iso);
    setSelectedHour(null);
    setShowHours(true);
  };

  const handleGuardarCita = async () => {
    if (!selectedDate || !selectedHour) {
      return showError("Campos incompletos", "Selecciona fecha y hora antes de guardar.");
    }

    try {
      if (citaAReagendar) {
        const payload = {
          fechaCitaStr: selectedDate,
          horaCita: selectedHour,
          area: paciente.area
        };
        await api.put(`/citas/${citaAReagendar._id}`, payload);
        showSuccess("Cita reprogramada", `Se reagendó la cita para el ${formatDateDDMMYYYY(selectedDate)} a las ${selectedHour}.`);
      } else if (paciente.identificadorPaciente) {
        // Usar la nueva función manual para evitar duplicar pacientes existentes
        const payload = {
          identificadorPaciente: paciente.identificadorPaciente,
          fechaCitaStr: selectedDate,
          horaCita: selectedHour,
          area: paciente.area
        };
        await api.post("/citas/manual", payload);
        showSuccess("Cita guardada", `Se agendó la cita para el ${formatDateDDMMYYYY(selectedDate)} a las ${selectedHour}.`);
      } else {
        const parts = (paciente.apellidos || "").trim().split(/\s+/);
        const paternal = paciente.apellidoPaterno || parts[0] || "";
        const maternal = paciente.apellidoMaterno || parts.slice(1).join(" ") || "";

        const payload = {
          nombres: paciente.nombres,
          apellidoPaterno: paternal,
          apellidoMaterno: maternal,
          apellidos: paciente.apellidos || `${paternal} ${maternal}`.trim(),
          edad: paciente.edad,
          telefono: paciente.telefono,
          email: paciente.email || "",
          fechaCitaStr: selectedDate,
          horaCita: selectedHour,
          area: paciente.area
        };
        await api.post("/citas", payload);
        showSuccess("Cita guardada", `Se agendó la cita para el ${formatDateDDMMYYYY(selectedDate)} a las ${selectedHour}.`);
      }

      onClose();
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo guardar la cita.");
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px", width: "100%" }}>
        <button 
          className="close-btn" 
          onClick={onClose} 
          aria-label="Cerrar modal"
        >
          ✕
        </button>
        
        <h4 className="logo-agendar" style={{ marginBottom: "1.5rem" }}>
          {citaAReagendar ? "Reprogramar Cita" : "Agendar Nueva Cita"}
        </h4>
        <hr style={{ marginBottom: "1.5rem" }} />
        
        <p className="text-muted text-center mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
          Paciente: <strong>{paciente?.nombres} {paciente?.apellidos}</strong><br/>
          Área: <strong style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{paciente?.area}</strong>
        </p>
        <hr style={{ marginBottom: "1.5rem" }} />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Calendar
            onClickDay={handleDateSelect}
            value={selectedDate ? new Date(selectedDate + "T12:00:00") : null}
            tileDisabled={({ date }) => {
              const iso = toLocalISODate(date);
              const hoy = toLocalISODate(new Date());
              if (user?.client?.blockSundays && date.getDay() === 0) return true;
              return iso < hoy || isDayFullyBlocked(iso);
            }}
            tileClassName={({ date }) => {
              const iso = toLocalISODate(date);
              const hoy = toLocalISODate(new Date());
              if (user?.client?.blockSundays && date.getDay() === 0) return "sunday-blocked";
              if (iso < hoy) return "past-day";
              if (blockedDatesAdmin.includes(iso)) return "blocked-admin";
              if (blockedDatesPaciente.includes(iso)) return "blocked-paciente";
              return null;
            }}
          />
        </div>

        {showHours && selectedDate && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <h4 className="text-muted mb-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
              Horas disponibles para el {formatDateDDMMYYYY(selectedDate)}
            </h4>
            <hr style={{ marginBottom: "1rem" }} />

            {blockedNotesAdmin[selectedDate] && (
              <div 
                style={{
                  background: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '6px',
                  padding: '0.6rem 0.75rem',
                  marginBottom: '1rem',
                  color: 'var(--danger, #ef4444)',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>📝</span>
                <span><strong>Nota:</strong> {blockedNotesAdmin[selectedDate]}</span>
              </div>
            )}
            {availableHours.length > 0 ? (
              <div className="hours-grid-modern">
                {allHours.map((hour) => {
                  const isBlockedAdmin = blockedHoursAdmin[selectedDate]?.includes(hour);
                  const isBlockedPaciente = blockedHoursCitas[selectedDate]?.includes(hour);
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
              <p className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>No hay horas disponibles para esta fecha.</p>
            )}
          </div>
        )}

        {selectedDate && selectedHour && (
          <div style={{ marginTop: '25px', display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="save-btn" 
              style={{ background: "#64748b", margin: 0, flex: 1 }} 
              onClick={onClose}
            >
              Cancelar
            </button>
            <button 
              type="button"
              className="save-btn" 
              onClick={handleGuardarCita}
              style={{ margin: 0, flex: 2 }}
            >
              {citaAReagendar ? "Confirmar Reprogramación" : "Confirmar Cita"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
