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
  const [blockedDates, setBlockedDates] = useState([]); // ["2025-11-12", ...]
  const [blockedHours, setBlockedHours] = useState({}); // { "2025-11-12": ["08:00"] }

  const [selectedDay, setSelectedDay] = useState(null); 
  const [selectedHours, setSelectedHours] = useState([]);

  // Obtener bloqueos desde backend
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const { data } = await api.get(`/horarios/${role}`);
        setBlockedDates(data.blockedDates || []);
        setBlockedHours(data.blockedHours || {});
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      }
    };
    fetchBlockedDates();
  }, [role]);

  // Click en un día
  const handleDayClick = (date) => {
    const fechaStr = date.toISOString().split("T")[0];
    setSelectedDay(fechaStr);
    setSelectedHours(blockedHours[fechaStr] || []);
  };

  // Toggle hora
  const toggleHour = (hour) => {
    let updated;
    if (selectedHours.includes(hour)) {
      updated = selectedHours.filter(h => h !== hour);
    } else {
      updated = [...selectedHours, hour];
    }
    setSelectedHours(updated);
  };

  // Guardar cambios en backend
  const saveHours = async () => {
    if (!selectedDay) return;

    const newBlockedHours = { ...blockedHours, [selectedDay]: selectedHours };

    // Si se desmarcaron todas las horas, eliminamos el día
    const newBlockedDates = Object.entries(newBlockedHours)
      .filter(([day, hours]) => hours.length > 0)
      .map(([day]) => day);

    try {
      await api.post(`/horarios/${role}`, {
        blockedDates: newBlockedDates,
        blockedHours: newBlockedHours
      });

      setBlockedDates(newBlockedDates);
      setBlockedHours(newBlockedHours);
      setSelectedDay(null);
      setSelectedHours([]);
    } catch (err) {
      console.error("Error al guardar bloqueos:", err);
    }
  };

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card card flex flex-col items-center justify-center p-6">
        <h2 className="logo-agendar mb-2">Control horarios</h2>
        <Calendar onClickDay={handleDayClick} tileClassName={({ date }) => {
            const fechaStr = date.toISOString().split("T")[0];
            return blockedDates.includes(fechaStr) ? "blocked" : "";
          }}
        />
        {selectedDay && (
          <div className="card ">
            <h4 className="text-muted text-center mb-2">Bloquear horas para {selectedDay}</h4>
            <div className="hours-grid">
              {WORK_HOURS.map(hour => (
                <button
                  key={hour}
                  className={`hour-btn ${selectedHours.includes(hour) ? 'selected' : ''}`}
                  onClick={() => toggleHour(hour)}
                >
                  {hour}
                </button>
              ))}
            </div>
            <button className="save-btn" onClick={saveHours}>Guardar horas</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarioBloqueo;
