import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../styles/globalStyles.css";
import "../../styles/calendary.css";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";

export default function AppointmentForm() {
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [blockedHoursCitas, setBlockedHoursCitas] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHours, setShowHours] = useState(false);

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    edad: "",
    telefono: "",
  });

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

  // 📅 Cargar bloqueos
  useEffect(() => {
    if (!tipoConsulta) return;
    const fetchBlockedDates = async () => {
      try {
        const { data } = await api.get(`/horarios/${tipoConsulta}`);
        setBlockedDatesAdmin(data.blockedDatesAdmin || []);
        setBlockedHoursAdmin(data.blockedHoursAdmin || {});
        setBlockedDatesPaciente(data.blockedDatesPaciente || []);
        setBlockedHoursCitas(data.blockedHoursCitas || {});
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      }
    };
    fetchBlockedDates();
  }, [tipoConsulta]);

  const handleTipoChange = (e) => {
    const tipo = e.target.value;
    if (tipoConsulta === tipo) {
      setTipoConsulta("");
      setShowCalendar(false);
      setShowHours(false);
      setSelectedDate(null);
      setSelectedHour(null);
    } else {
      setTipoConsulta(tipo);
      setShowCalendar(true);
      setShowHours(false);
      setSelectedDate(null);
      setSelectedHour(null);
    }
  };

  const handleDateSelect = (date) => {
    const iso = toLocalISODate(date);
    const hoy = toLocalISODate(new Date());

    // 🚫 Evitar fechas pasadas
    if (iso < hoy) {
      showError("Fecha inválida", "No puedes seleccionar fechas anteriores a hoy.");
      return;
    }

    setSelectedDate(iso);
    setShowHours(true);

    const bloqueadasAdmin = blockedHoursAdmin[iso] || [];
    const bloqueadasPacientes = blockedHoursCitas[iso] || [];
    const bloqueadas = [...new Set([...bloqueadasAdmin, ...bloqueadasPacientes])];

    const ahora = new Date();
    const esHoy = iso === hoy;

    // ✅ Mostrar solo horas disponibles
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

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    setShowCalendar(false);
    setShowHours(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveCita = async () => {
    if (!selectedDate || !selectedHour)
      return showError("Campos incompletos", "Selecciona fecha y hora antes de guardar.");
    if (!formData.nombres || !formData.apellidos || !formData.edad || !formData.telefono)
      return showError("Campos vacíos", "Completa todos los datos del formulario.");

    try {
      await api.post("/citas", {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        edad: formData.edad,
        telefono: formData.telefono,
        fechaCitaStr: selectedDate,
        horaCita: selectedHour,
        area: tipoConsulta,
      });

      showSuccess(
        "Cita guardada",
        `Tu cita para ${formatDateDDMMYYYY(selectedDate)} a las ${selectedHour} se ha registrado.`
      );

      // Limpiar y recargar bloqueos
      setSelectedDate(null);
      setSelectedHour(null);
      setFormData({ nombres: "", apellidos: "", edad: "", telefono: "" });

      const { data } = await api.get(`/horarios/${tipoConsulta}`);
      setBlockedDatesAdmin(data.blockedDatesAdmin || []);
      setBlockedHoursAdmin(data.blockedHoursAdmin || {});
      setBlockedDatesPaciente(data.blockedDatesPaciente || []);
      setBlockedHoursCitas(data.blockedHoursCitas || {});
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo guardar la cita. Intenta nuevamente.");
    }
  };

  // 🧠 Día totalmente bloqueado (sin horas disponibles)
  const isDayFullyBlocked = (iso) => {
    const bloqueadasAdmin = blockedHoursAdmin[iso] || [];
    const bloqueadasPacientes = blockedHoursCitas[iso] || [];
    const bloqueadas = [...new Set([...bloqueadasAdmin, ...bloqueadasPacientes])];
    return bloqueadas.length >= allHours.length;
  };

  return (
    <div className="auth-wrapper-public">
      <div className="auth-card card" style={{ maxWidth: "600px", width: "100%" }}>
        <h2 className="logo-agendar mb-2">Agendar Cita</h2>
        <p className="text-muted text-center">
          Llena el formulario para agendar tu cita
        </p>

        <form className="form">
          <div className="form-row">
            <div className="col">
              <label className="form-label">Nombre(s)</label>
              <input
                type="text"
                name="nombres"
                className="input"
                placeholder="Nombre(s)"
                value={formData.nombres}
                onChange={handleInputChange}
              />
            </div>
            <div className="col">
              <label className="form-label">Apellido(s)</label>
              <input
                type="text"
                name="apellidos"
                className="input"
                placeholder="Apellido(s)"
                value={formData.apellidos}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="col">
              <label className="form-label">Edad</label>
              <input
                type="text"
                name="edad"
                className="input"
                placeholder="Edad"
                value={formData.edad}
                onChange={handleInputChange}
              />
            </div>
            <div className="col">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                name="telefono"
                className="input"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </form>

        <h3 style={{ color: "#6c757d", marginTop: "10px" }}>Tipo de consulta</h3>
        <div className="form-row">
          <label className="checkbox">
            <input
              type="radio"
              name="tipo-consulta"
              value="fisioterapia"
              checked={tipoConsulta === "fisioterapia"}
              onChange={handleTipoChange}
            />
            <span style={{ color: "#6c757d" }}>Fisioterapia</span>
          </label>
          <label className="checkbox">
            <input
              type="radio"
              name="tipo-consulta"
              value="nutriologa"
              checked={tipoConsulta === "nutriologa"}
              onChange={handleTipoChange}
            />
            <span style={{ color: "#6c757d" }}>Nutrición</span>
          </label>
        </div>

        {selectedDate && selectedHour && (
          <div className="form-row" style={{ marginTop: "10px" }}>
            <div className="col">
              <label className="form-label">Fecha seleccionada:</label>
              <input className="input" value={formatDateDDMMYYYY(selectedDate)} readOnly />
            </div>
            <div className="col">
              <label className="form-label">Hora seleccionada:</label>
              <input className="input" value={selectedHour} readOnly />
            </div>
          </div>
        )}

        {formData.nombres && formData.apellidos && formData.edad && formData.telefono && selectedDate && selectedHour && (
          <button className="save-btn mt-2" onClick={handleSaveCita}>
            Guardar cita
          </button>
        )}

        {showCalendar && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <button className="close-btn" onClick={() => setShowCalendar(false)}>X</button>
              <h4 className="logo-agendar">
                Selecciona una fecha para: <strong>{tipoConsulta}</strong>
              </h4>

              <Calendar
                onClickDay={handleDateSelect}
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
                    Horas disponibles para {formatDateDDMMYYYY(selectedDate)}
                  </h4>
                  {availableHours.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-3">
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
                              ${isAvailable ? "" : "disabled"}`}
                            disabled={!isAvailable}
                            onClick={() => isAvailable && handleHourSelect(hour)}
                          >
                            {hour}
                          </button>
                        );
                      })}
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
