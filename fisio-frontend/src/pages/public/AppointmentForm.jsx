import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../styles/globalStyles.css";
import api from "../../api.js";

export default function AppointmentForm() {
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [blockedDates, setBlockedDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!tipoConsulta) return;

    const fetchBlockedDates = async () => {
      try {
        const { data } = await api.get(`/horarios/${tipoConsulta}`);
        const fechas = data.map(
          (item) => new Date(item.fecha).toISOString().split("T")[0]
        );
        setBlockedDates(fechas);
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      }
    };

    fetchBlockedDates(); 
    const interval = setInterval(fetchBlockedDates, 5000); 
    return () => clearInterval(interval);
  }, [tipoConsulta]);

  const handleTipoChange = (e) => {
    setTipoConsulta(e.target.value);
    setShowCalendar(false);
  };

  return (
    <div className="auth-wrapper-public">
      <div className="auth-card card" style={{ maxWidth: "600px", width: "100%" }}>
        <h2 className="logo-agendar mb-2">Agendar Cita</h2>
        <p className="text-muted text-center mb-2">
          Llena el formulario para agendar tu cita
        </p>

        <form className="form">
          <div className="form-row">
            <div className="col">
              <label htmlFor="name" className="form-label">
                Nombre(s)
              </label>
              <input id="name" type="text" className="input" placeholder="Nombre(s)" required />
            </div>
            <div className="col">
              <label htmlFor="last-name" className="form-label">
                Apellido(s)
              </label>
              <input id="last-name" type="text" className="input" placeholder="Apellido(s)" required />
            </div>
          </div>

          <div className="form-row">
            <div className="col">
              <label htmlFor="age" className="form-label">
                Edad
              </label>
              <input id="age" type="text" className="input" placeholder="Edad" required />
            </div>
            <div className="col">
              <label htmlFor="phone" className="form-label">
                Teléfono
              </label>
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

        {tipoConsulta && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              className="btn btn-primary w-100"
            >
              Seleccionar Fecha
            </button>
          </div>
        )}

        {showCalendar && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <button className="close-btn" onClick={() => setShowCalendar(false)}>
                X
              </button>
              <h4 style={{ marginBottom: "10px" }}>Selecciona una fecha</h4>
              <Calendar
                tileDisabled={({ date }) =>
                  blockedDates.includes(date.toISOString().split("T")[0])
                }
                tileClassName={({ date }) =>
                  blockedDates.includes(date.toISOString().split("T")[0])
                    ? "bg-red-500 text-white rounded-full"
                    : ""
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
