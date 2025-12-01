import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import api from "../../api";
import "../../styles/calendary.css";

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
    } catch (err) {
      console.error("Error al guardar bloqueos:", err);
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
    <div className="auth-wrapper-content">
      <div className="auth-card card flex flex-col items-center justify-center p-6">
        <h2 className="logo-agendar mb-2">Control de horarios</h2>

        <Calendar
          onClickDay={handleDayClick}
          tileDisabled={tileDisabled}
          tileClassName={tileClassName}
        />

        {selectedDay && (
          <div className="card mt-3">
            <h4 className="text-muted text-center mb-2">
              Bloquear horas para {selectedDay}
            </h4>
            <div className="hours-grid">
              {WORK_HOURS.map((hour) => {
                const bloqueadasPorPaciente =
                  blockedHoursCitas[selectedDay]?.includes(hour);
                const bloqueadasPorAdmin =
                  selectedHours.includes(hour);

                return (
                  <button
                    key={hour}
                    className={`hour-btn ${
                      bloqueadasPorAdmin ? "blocked-admin-hour" : ""
                    } ${
                      bloqueadasPorPaciente ? "blocked-paciente-hour" : ""
                    }`}
                    onClick={() =>
                      !bloqueadasPorPaciente && toggleHour(hour)
                    }
                    disabled={bloqueadasPorPaciente}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>

            <button className="save-btn mt-3" onClick={saveHours}>
              Guardar horas
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner">Cargando...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarioBloqueo;
