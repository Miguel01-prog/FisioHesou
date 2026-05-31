import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../styles/design-system.css";
import "../../styles/calendary.css";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { FaCalendarAlt } from "react-icons/fa";
import { FiChevronLeft, FiClock, FiCheckCircle } from "react-icons/fi";

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
    apellidoPaterno: "",
    apellidoMaterno: "",
    edad: "",
    telefono: "",
    email: "",
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

  const handleTipoChange = (tipo) => {
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
    if (!formData.nombres || !formData.apellidoPaterno || !formData.edad || !formData.telefono || !formData.email)
      return showError("Campos vacíos", "Completa todos los campos obligatorios del formulario (incluyendo correo electrónico).");

    try {
      const { data } = await api.post("/citas", {
        nombres: formData.nombres,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno || "",
        edad: formData.edad,
        telefono: formData.telefono,
        email: formData.email,
        fechaCitaStr: selectedDate,
        horaCita: selectedHour,
        area: tipoConsulta,
      });

      if (data.pacienteNuevo) {
        showSuccess(
          "¡Cita y Expediente Creados!",
          `Tu cita para ${formatDateDDMMYYYY(selectedDate)} a las ${selectedHour} se ha registrado con éxito. ¡Se ha creado tu nuevo expediente clínico en FisioHesou!`
        );
      } else {
        showSuccess(
          "Cita agendada con éxito",
          `Tu cita para ${formatDateDDMMYYYY(selectedDate)} a las ${selectedHour} ha sido agendada correctamente.`
        );
      }

      // Limpiar y recargar bloqueos
      setSelectedDate(null);
      setSelectedHour(null);
      setFormData({ nombres: "", apellidoPaterno: "", apellidoMaterno: "", edad: "", telefono: "", email: "" });
      setTipoConsulta("");

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
    <>
      <div className="auth-wrapper-public fade-in-up">
        <div className="auth-card card" style={{ maxWidth: "620px", width: "90%", padding: "2.5rem" }}>
          
          <div className="text-center mb-4">
            <div className="brand-logo-sphere" style={{ margin: "0 auto 1rem auto", width: "50px", height: "50px", fontSize: "1.4rem" }}>
              <span>H</span>
            </div>
            <h2 className="logo-agendar mb-1" style={{ color: "var(--primary)" }}>Hesou Citas</h2>
            <p className="text-muted">Completa tus datos para agendar tu consulta</p>
          </div>

          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-row mb-3">
              <div className="col">
                <label className="form-label">Nombre(s)</label>
                <input
                  type="text"
                  name="nombres"
                  className="input"
                  placeholder="Ej. Juan"
                  value={formData.nombres}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row mb-3">
              <div className="col">
                <label className="form-label">Apellido paterno</label>
                <input
                  type="text"
                  name="apellidoPaterno"
                  className="input"
                  placeholder="Ej. Pérez"
                  value={formData.apellidoPaterno}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col">
                <label className="form-label">Apellido materno</label>
                <input
                  type="text"
                  name="apellidoMaterno"
                  className="input"
                  placeholder="Ej. Ruiz (Opcional)"
                  value={formData.apellidoMaterno}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row mb-3">
              <div className="col">
                <label className="form-label">Edad</label>
                <input
                  type="number"
                  name="edad"
                  className="input"
                  placeholder="Ej. 28"
                  value={formData.edad}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  className="input"
                  placeholder="Ej. 5512345678"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row mb-4">
              <div className="col">
                <label className="form-label">Correo electrónico (Amarre de expediente único)</label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  placeholder="Ej. juan.perez@correo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </form>

          <h3 className="form-label mb-2" style={{ fontSize: "1rem", fontWeight: "600" }}>Área de consulta</h3>
          
          {/* Modern Interactive Specialty Option Cards */}
          <div className="specialty-selector-grid mb-4">
            <div 
              className={`specialty-card-glass ${tipoConsulta === "fisioterapia" ? "active" : ""}`}
              onClick={() => handleTipoChange("fisioterapia")}
            >
              <div className="specialty-card-icon">🦽</div>
              <div className="specialty-card-info">
                <span className="specialty-title">Fisioterapia</span>
                <span className="specialty-desc">Rehabilitación y terapia física</span>
              </div>
              {tipoConsulta === "fisioterapia" && <FiCheckCircle className="check-icon-active" />}
            </div>

            <div 
              className={`specialty-card-glass ${tipoConsulta === "nutriologa" ? "active" : ""}`}
              onClick={() => handleTipoChange("nutriologa")}
            >
              <div className="specialty-card-icon">🍎</div>
              <div className="specialty-card-info">
                <span className="specialty-title">Nutrición</span>
                <span className="specialty-desc">Planes y asesoría alimenticia</span>
              </div>
              {tipoConsulta === "nutriologa" && <FiCheckCircle className="check-icon-active" />}
            </div>
          </div>

          {selectedDate && selectedHour && (
            <div className="selection-confirmation-box mb-4">
              <h4 className="selection-confirmation-title">
                <FaCalendarAlt /> Resumen de tu cita
              </h4>
              <div className="form-row mt-2">
                <div className="col">
                  <span className="summary-label">Fecha</span>
                  <span className="summary-value">{formatDateDDMMYYYY(selectedDate)}</span>
                </div>
                <div className="col">
                  <span className="summary-label">Horario</span>
                  <span className="summary-value">{selectedHour} hrs</span>
                </div>
              </div>
            </div>
          )}

          {formData.nombres && formData.apellidoPaterno && formData.edad && formData.telefono && formData.email && selectedDate && selectedHour && (
            <button 
              type="button"
              className="btn btn-primary btn-size-lg w-100 hover-grow glow-pulse-purple" 
              onClick={handleSaveCita}
              style={{ height: "50px", fontSize: "1.05rem" }}
            >
              Confirmar y Agendar Cita
            </button>
          )}
        </div>
      </div>

      {/* Calendar Modal rendered at absolute viewport root sibling level to ensure perfect centering */}
      {showCalendar && (
        <div className="modal-backdrop">
          <div className="modal-content glass-modal" style={{ maxWidth: "480px" }}>
            <button className="close-btn" onClick={() => setShowCalendar(false)}>X</button>
            
            <h4 className="logo-agendar mb-3">
              Seleccionar Fecha y Hora
            </h4>
            <p className="text-muted text-center mb-3" style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
              Especialidad: <strong>{tipoConsulta}</strong>
            </p>

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
                <h4 className="text-muted mb-3" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                  Horarios para el {formatDateDDMMYYYY(selectedDate)}
                </h4>
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
                          onClick={() => isAvailable && handleHourSelect(hour)}
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted mt-2" style={{ fontSize: "0.85rem" }}>No hay horarios disponibles en esta fecha.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
