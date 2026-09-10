import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../styles/design-system.css";
import "../../styles/calendary.css";
import api from "../../api.js";
import { showSuccess, showError } from "../../utils/alerts.js";
import { FaCalendarAlt } from "react-icons/fa";
import { FiChevronLeft, FiClock, FiCheckCircle } from "react-icons/fi";
import LoadingSpinner from "../../components/layout/LoadingSpinner.jsx";

export default function AppointmentForm() {
  const { subdomain } = useParams();
  const [clinic, setClinic] = useState(null);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [clinicError, setClinicError] = useState(false);

  const [tipoConsulta, setTipoConsulta] = useState("");
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedHoursAdmin, setBlockedHoursAdmin] = useState({});
  const [blockedNotesAdmin, setBlockedNotesAdmin] = useState({});
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [blockedHoursCitas, setBlockedHoursCitas] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [savingCita, setSavingCita] = useState(false);

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

  // 🏥 Cargar datos de la clínica por subdominio
  useEffect(() => {
    const fetchClinic = async () => {
      try {
        setLoadingClinic(true);
        const { data } = await api.get(`/clients/subdomain/${subdomain}`);
        setClinic(data.client);
        setClinicError(false);
      } catch (err) {
        console.error("Error al cargar la clínica:", err);
        setClinicError(true);
      } finally {
        setLoadingClinic(false);
      }
    };
    if (subdomain) {
      fetchClinic();
    }
  }, [subdomain]);

  // 📅 Cargar bloqueos de horarios
  useEffect(() => {
    if (!tipoConsulta || !clinic) return;
    const fetchBlockedDates = async () => {
      try {
        setLoadingBlocks(true);
        const { data } = await api.get(`/horarios/${tipoConsulta}?clientId=${clinic._id}`);
        setBlockedDatesAdmin(data.blockedDatesAdmin || []);
        setBlockedHoursAdmin(data.blockedHoursAdmin || {});
        setBlockedNotesAdmin(data.blockedNotesAdmin || {});
        setBlockedDatesPaciente(data.blockedDatesPaciente || []);
        setBlockedHoursCitas(data.blockedHoursCitas || {});
      } catch (err) {
        console.error("Error al obtener bloqueos:", err);
      } finally {
        setLoadingBlocks(false);
      }
    };
    fetchBlockedDates();
  }, [tipoConsulta, clinic]);

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
    const { name, value } = e.target;
    if (name === "telefono") {
      const cleanValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, telefono: cleanValue });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveCita = async () => {
    if (!selectedDate || !selectedHour)
      return showError("Campos incompletos", "Selecciona fecha y hora antes de guardar.");
    if (!formData.nombres || !formData.apellidoPaterno || !formData.edad || !formData.telefono || !formData.email)
      return showError("Campos vacíos", "Completa todos los campos obligatorios del formulario (incluyendo correo electrónico).");
    if (formData.telefono.replace(/\D/g, "").length !== 10)
      return showError("Teléfono inválido", "El número de teléfono debe constar exactamente de 10 dígitos.");
    if (!clinic)
      return showError("Clínica no cargada", "No se puede agendar cita sin el contexto de la clínica");

    try {
      setSavingCita(true);
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
        clientId: clinic._id
      });

      if (data.pacienteNuevo) {
        showSuccess(
          "¡Cita y Expediente Creados!",
          `Tu cita para ${formatDateDDMMYYYY(selectedDate)} a las ${selectedHour} se ha registrado con éxito. ¡Se ha creado tu nuevo expediente clínico en ${clinic.name}!`
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
    } finally {
      setSavingCita(false);
    }
  };

  // 🧠 Día totalmente bloqueado (sin horas disponibles)
  const isDayFullyBlocked = (iso) => {
    const bloqueadasAdmin = blockedHoursAdmin[iso] || [];
    const bloqueadasPacientes = blockedHoursCitas[iso] || [];
    const bloqueadas = [...new Set([...bloqueadasAdmin, ...bloqueadasPacientes])];
    return bloqueadas.length >= allHours.length;
  };

  if (loadingClinic) {
    return (
      <div className="auth-wrapper-public" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (clinicError || !clinic) {
    return (
      <div className="auth-wrapper-public" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="auth-card text-center" style={{ maxWidth: '420px', padding: '2rem' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Clínica No Encontrada</h2>
          <p className="text-muted">La dirección a la que intentas acceder no corresponde a ninguna clínica registrada o activa en nuestro sistema.</p>
        </div>
      </div>
    );
  }

  const selectedService = (clinic?.services || []).find(s => s.key === tipoConsulta);
  const serviceName = selectedService ? selectedService.name : tipoConsulta;

  return (
    <>
      <div className="auth-wrapper-public fade-in-up">
        <div className="auth-card card" style={{ maxWidth: "620px", width: "90%", padding: "2.5rem" }}>

          <div className="text-center mb-4">
            {clinic.logo ? (
              <img src={clinic.logo} alt="Logo" style={{ maxHeight: "60px", marginBottom: "1rem" }} />
            ) : (
              <div className="brand-logo-sphere" style={{ margin: "0 auto 1rem auto", width: "50px", height: "50px", fontSize: "1.4rem" }}>
                <span>{clinic.name ? clinic.name.substring(0, 1).toUpperCase() : "H"}</span>
              </div>
            )}
            <h2 className="logo-agendar mb-1" style={{ color: "var(--primary)" }}>{clinic.name}</h2>
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
                  placeholder="Ej. Ruiz"
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
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="form-row mb-4">
              <div className="col">
                <label className="form-label">Correo electrónico</label>
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

          <h3 className="form-label mb-2" style={{ fontSize: "1rem", fontWeight: "600" }}>Seleccionar Servicio</h3>

          {/* Modern Interactive Specialty Option Cards */}
          <div className="specialty-selector-grid mb-4">
            {(clinic.services || []).map((service) => (
              <div
                key={service.key}
                className={`specialty-card-glass ${tipoConsulta === service.key ? "active" : ""}`}
                onClick={() => handleTipoChange(service.key)}
              >
                <div className="specialty-card-icon">{service.icon || "📅"}</div>
                <div className="specialty-card-info">
                  <span className="specialty-title">{service.name}</span>
                  {service.description && (
                    <span className="specialty-desc">{service.description}</span>
                  )}
                </div>
                {tipoConsulta === service.key && <FiCheckCircle className="check-icon-active" />}
              </div>
            ))}
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
              style={{ height: "50px", fontSize: "1.05rem", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={savingCita}
            >
              {savingCita ? <LoadingSpinner size="small" color="#fff" /> : "Confirmar y Agendar Cita"}
            </button>
          )}
        </div>
      </div>

      {/* Calendar Modal rendered at absolute viewport root sibling level to ensure perfect centering */}
      {showCalendar && createPortal(
        <div className="modal-backdrop" onClick={() => setShowCalendar(false)}>
          <div className="modal-content glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <button className="close-btn" onClick={() => setShowCalendar(false)}>✕</button>

            <h4 className="logo-agendar mb-3">
              Seleccionar Fecha y Hora
            </h4>
            <p className="text-muted text-center mb-3" style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
              Servicio: <strong>{serviceName}</strong>
            </p>

            {loadingBlocks ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                <LoadingSpinner size="large" />
              </div>
            ) : (
              <>
                <Calendar
                  onClickDay={handleDateSelect}
                  tileDisabled={({ date }) => {
                    const iso = toLocalISODate(date);
                    const hoy = toLocalISODate(new Date());
                    if (clinic?.blockSundays && date.getDay() === 0) return true;
                    return iso < hoy || isDayFullyBlocked(iso);
                  }}
                  tileClassName={({ date }) => {
                    const iso = toLocalISODate(date);
                    const hoy = toLocalISODate(new Date());
                    if (clinic?.blockSundays && date.getDay() === 0) return "sunday-blocked";
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

                    {blockedNotesAdmin[selectedDate] && (
                      <div 
                        className="blocked-note-alert" 
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          marginBottom: '1rem',
                          color: 'var(--danger, #ef4444)',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
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
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
