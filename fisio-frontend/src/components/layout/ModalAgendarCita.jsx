import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";

export default function ModalAgendarCita({ paciente, onClose }) {
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [blockedHoursCitas, setBlockedHoursCitas] = useState({});
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [showHours, setShowHours] = useState(false);

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

  useEffect(() => {
    if (!paciente || !paciente.area) return;
    const fetchBlockedDates = async () => {
      try {
        const { data } = await api.get(`/horarios/${paciente.area}`);
        setBlockedDatesAdmin(data.blockedDatesAdmin || []);
        setBlockedHoursAdmin(data.blockedHoursAdmin || {});
        setBlockedDatesPaciente(data.blockedDatesPaciente || []);
        setBlockedHoursCitas(data.blockedHoursCitas || {});
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      }
    };
    fetchBlockedDates();
  }, [paciente]);

  const isDayFullyBlocked = (iso) => {
    const bloqueadasAdmin = blockedHoursAdmin[iso] || [];
    const bloqueadasPacientes = blockedHoursCitas[iso] || [];
    const bloqueadas = [...new Set([...bloqueadasAdmin, ...bloqueadasPacientes])];
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

    const bloqueadasAdmin = blockedHoursAdmin[iso] || [];
    const bloqueadasPacientes = blockedHoursCitas[iso] || [];
    const bloqueadas = [...new Set([...bloqueadasAdmin, ...bloqueadasPacientes])];

    const ahora = new Date();
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
    if (!selectedDate || !selectedHour) {
      return showError("Campos incompletos", "Selecciona fecha y hora antes de guardar.");
    }

    try {
      const payload = {
        nombres: paciente.nombres,
        apellidos: paciente.apellidos,
        edad: paciente.edad,
        telefono: paciente.telefono,
        fechaCitaStr: selectedDate,
        horaCita: selectedHour,
        area: paciente.area
      };

      await api.post("/citas", payload);
      showSuccess("Cita guardada", `Se agendó la cita para el ${formatDateDDMMYYYY(selectedDate)} a las ${selectedHour}.`);
      onClose();
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo guardar la cita.");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button 
          className="close-btn" 
          onClick={onClose} 
        >
          X
        </button>
        
        <h4 className="logo-agendar">
          Agendar Nueva Cita
        </h4>
        
        <p className="text-muted text-center mb-2">
          Paciente: <strong>{paciente?.nombres} {paciente?.apellidos}</strong><br/>
          Área: <strong style={{ textTransform: 'capitalize' }}>{paciente?.area}</strong>
        </p>

        <Calendar
          onClickDay={handleDateSelect}
          value={selectedDate ? new Date(selectedDate + "T12:00:00") : null}
          tileDisabled={({ date }) => {
            const iso = toLocalISODate(date);
            const hoy = toLocalISODate(new Date());
            return iso < hoy || isDayFullyBlocked(iso);
          }}
          tileClassName={({ date }) => {
            const iso = toLocalISODate(date);
            const hoy = toLocalISODate(new Date());
            if (iso < hoy) return "past-day";
            if (blockedDatesAdmin.includes(iso)) return "blocked-admin";
            if (blockedDatesPaciente.includes(iso)) return "blocked-paciente";
            return null;
          }}
        />

        {showHours && selectedDate && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <h4 className="text-muted mb-2">
              Horas disponibles para el {formatDateDDMMYYYY(selectedDate)}
            </h4>
            {availableHours.length > 0 ? (
              <div className="hours-grid-modern">
                {allHours.map((hour) => {
                  const isBlockedAdmin = blockedHoursAdmin[selectedDate]?.includes(hour);
                  const isBlockedPaciente = blockedHoursCitas[selectedDate]?.includes(hour);
                  const isAvailable = availableHours.includes(hour);

                  return (
                    <button
                      key={hour}
                      className={`hour-btn 
                        ${isBlockedAdmin ? "blocked-admin-hour" : ""} 
                        ${isBlockedPaciente ? "blocked-paciente-hour" : ""} 
                        ${isAvailable ? "" : "disabled"}
                        ${selectedHour === hour ? "selected-hour" : ""}`}
                      disabled={!isAvailable}
                      onClick={() => isAvailable && setSelectedHour(hour)}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted mt-2">No hay horas disponibles para esta fecha.</p>
            )}
          </div>
        )}

        {selectedDate && selectedHour && (
          <div style={{ marginTop: '25px', textAlign: 'center' }}>
            <button className="save-btn" onClick={handleGuardarCita}>
              Confirmar Cita
            </button>
          </div>
        )}
        
        {/* Spacer para asegurar scroll completo en móviles */}
        <div style={{ height: '20px', width: '100%' }}></div>
      </div>
    </div>
  );
}
