import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../styles/globalStyles.css";
import api from "../../api.js";

export default function AppointmentForm() {
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedHours, setBlockedHours] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHours, setShowHours] = useState(false);

  const allHours = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ];

  // Obtener bloqueos por tipo de consulta
  useEffect(() => {
    if (!tipoConsulta) return;

    const fetchBlockedDates = async () => {
      try {
        const { data } = await api.get(`/horarios/${tipoConsulta}`);
        setBlockedDates(data.blockedDates || []);
        setBlockedHours(data.blockedHours || {});
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      }
    };

    fetchBlockedDates();
  }, [tipoConsulta]);

  const handleTipoChange = (e) => {
    setTipoConsulta(e.target.value);
    setShowCalendar(false);
    setShowHours(false);
    setSelectedDate(null);
  };

  // Al seleccionar fecha
  const handleDateSelect = (date) => {
    const iso = date.toISOString().split("T")[0];
    setSelectedDate(iso);
    setShowHours(true);

    const bloqueadas = blockedHours[iso] || [];
    const ahora = new Date();
    const esHoy = iso === ahora.toISOString().split("T")[0];

    const disponibles = allHours.filter((h) => {
      if (bloqueadas.includes(h)) return false; // hora bloqueada

      if (esHoy) {
        const [hNum, mNum] = h.split(":").map(Number);
        const horaCita = new Date(ahora);
        horaCita.setHours(hNum, mNum, 0, 0);
        const diffHoras = (horaCita - ahora) / (1000 * 60 * 60);
        if (diffHoras < 2) return false; // menos de 2h de margen
      }

      return true;
    });

    setAvailableHours(disponibles);
  };

  return (
    <div className="auth-wrapper-public">
      <div className="auth-card card" style={{ maxWidth: "600px", width: "100%" }}>
        <h2 className="logo-agendar mb-2">Agendar Cita</h2>
        <p className="text-muted text-center mb-2">
          Llena el formulario para agendar tu cita
        </p>

        {/* Datos personales */}
        <form className="form">
          <div className="form-row">
            <div className="col">
              <label htmlFor="name" className="form-label">Nombre(s)</label>
              <input id="name" type="text" className="input" placeholder="Nombre(s)" required />
            </div>
            <div className="col">
              <label htmlFor="last-name" className="form-label">Apellido(s)</label>
              <input id="last-name" type="text" className="input" placeholder="Apellido(s)" required />
            </div>
          </div>

          <div className="form-row">
            <div className="col">
              <label htmlFor="age" className="form-label">Edad</label>
              <input id="age" type="text" className="input" placeholder="Edad" required />
            </div>
            <div className="col">
              <label htmlFor="phone" className="form-label">Teléfono</label>
              <input id="phone" type="text" className="input" placeholder="Teléfono" required />
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "2px solid #b1b1b1ff", margin: "0.5px" }} />

          <h3 style={{ color: "#6c757d", marginTop: "-10px" }}>Tipo de consulta</h3>
          <div className="form-row">
            <div className="col" style={{ marginTop: "-10px" }}>
              <label htmlFor="fisio-radio" className="checkbox">
                <input
                  id="fisio-radio"
                  type="radio"
                  name="tipo-consulta"
                  value="fisioterapia"
                  onChange={handleTipoChange}
                  required
                />
                <span style={{ color: "#6c757d" }}>Fisioterapia</span>
              </label>
            </div>
            <div className="col" style={{ marginTop: "-10px" }}>
              <label htmlFor="nutri-radio" className="checkbox">
                <input
                  id="nutri-radio"
                  type="radio"
                  name="tipo-consulta"
                  value="nutriologa"
                  onChange={handleTipoChange}
                  required
                />
                <span style={{ color: "#6c757d" }}>Nutrición</span>
              </label>
            </div>
          </div>
        </form>

        {/* Botón para abrir calendario */}
        {tipoConsulta && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => {
                setShowCalendar(true);
                setShowHours(false);
              }}
              className="btn btn-primary w-100"
            >
              Seleccionar Fecha
            </button>
          </div>
        )}

        {/* Calendario */}
        {showCalendar && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <button className="close-btn" onClick={() => setShowCalendar(false)}>X</button>
              <h4 style={{ marginBottom: "10px" }}>Selecciona una fecha</h4>
              <Calendar
                onClickDay={handleDateSelect}
                tileClassName={({ date }) => {
                  const iso = date.toISOString().split("T")[0];
                  if (blockedDates.includes(iso)) return "blocked-day"; // clase personalizada
                  return null;
                }}
              />

              {showHours && selectedDate && (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <h4>Horas disponibles para {selectedDate}</h4>
                  {availableHours.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {availableHours.map((hour) => (
                        <button
                          key={hour}
                          className="btn btn-outline-primary"
                          onClick={() => alert(`Seleccionaste ${hour}`)}
                        >
                          {hour}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#888" }}>No hay horas disponibles para esta fecha.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
