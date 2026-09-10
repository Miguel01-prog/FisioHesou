import { getUsuarioRol, formatDateDDMMYYYY, toLocalISODate } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import "react-calendar/dist/Calendar.css";
import Calendar from "react-calendar";
import "../../styles/calendary.css";
import api from "../../api";

import ModalAgendarManual from "./ModalAgendarManual.jsx";

export default function AgendaCitas() {
  const [citas, setCitas] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [citasDelDia, setCitasDelDia] = useState([]);
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);
  const [showAgendarManualModal, setShowAgendarManualModal] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const rolUsuario = getUsuarioRol(user);
  const hoyStr = toLocalISODate(new Date());
  const navigate = useNavigate();

  const normalizar = (str) =>
    (str || "").trim().toLowerCase().replace(/\s+/g, " ");

  const fetchCitas = async () => {
    try {
      const endpoint = rolUsuario ? `/citas?area=${rolUsuario}` : "/citas";
      const { data } = await api.get(endpoint);
      setCitas(data || []);

      const adminDays = [
        ...new Set(data.filter(c => c.area === "administrador").map(c => c.fechaCitaStr))
      ];
      const pacienteDays = [
        ...new Set(data.filter(c => c.area !== "administrador").map(c => c.fechaCitaStr))
      ];
      setBlockedDatesAdmin(adminDays);
      setBlockedDatesPaciente(pacienteDays);

      const targetDay = selectedDay || hoyStr;
      const citasDia = data.filter(c => c.fechaCitaStr === targetDay);
      citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
      
      if (!selectedDay) {
        setSelectedDay(hoyStr);
      }
      setCitasDelDia(citasDia);
    } catch (err) {
      console.error("Error al cargar citas:", err);
    }
  };

  // Cargar citas por rol o cambio de día
  useEffect(() => {
    fetchCitas();
  }, [rolUsuario, selectedDay]);


  const handleDayClick = (date) => {
    const iso = toLocalISODate(date);
    const hoy = toLocalISODate(new Date());
    if (iso < hoy) return;

    setSelectedDay(iso);
  };

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card">

        <h2 className="logo-agendar mb-4">Agenda de citas</h2>


        <div className="agenda-columns">
          {/* Calendario */}
          <div className="agenda-left">
            <Calendar
              onClickDay={handleDayClick}
              tileDisabled={({ date }) => {
                const iso = toLocalISODate(date);
                const hoy = toLocalISODate(new Date());
                if (user?.client?.blockSundays && date.getDay() === 0) return true;
                return iso < hoy;
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

          {/* Citas del día */}
          <div className="agenda-right-citas" style={{ marginTop: "20px" }}>
            <div className="text-muted text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <h4>
                {selectedDay
                  ? selectedDay === hoyStr
                    ? "Citas para hoy"
                    : `Citas para ${formatDateDDMMYYYY(selectedDay)}`
                  : "Selecciona un día"}
              </h4>
              {selectedDay && (
                <button
                  type="button"
                  className="btn-primary-action hover-grow"
                  onClick={() => setShowAgendarManualModal(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--primary, #5e50a1)',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: 'auto'
                  }}
                >
                  ➕ Agendar Cita Manual
                </button>
              )}
            </div>

            <div className="right-body">
              {selectedDay ? (
                citasDelDia.length > 0 ? (
                  <div className="appointments-list">
                    {citasDelDia.map((cita, i) => {
                      const esNuevo = cita.esNuevoPaciente;

                      return (
                        <div key={cita._id || i} className={`appointment-card ${esNuevo ? "nuevo-paciente-card" : ""}`}
                          onClick={() => {
                            const rolePath = user?.role || user?.rol || 'fisioterapeuta';
                            navigate(`/${rolePath}/paciente/${cita.identificadorPaciente}`);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="appointment-time">🕒 {cita.horaCita}</div>
                          <div className="appointment-info">
                            <div className="appointment-name">
                              <strong>{cita.nombres} {cita.apellidos}</strong>
                            </div>
                            <div className="appointment-area">Área: {cita.area}</div>
                            {esNuevo && <span className="nuevo-paciente">🆕 Nuevo</span>}
                          </div>
                        </div>
                      );
                    })}
                    {/* Spacer para scroll */}
                    <div style={{ height: '15px' }}></div>
                  </div>
                ) : (
                  <p className="no-appointments">No hay citas registradas este día.</p>
                )
              ) : (
                <p className="no-appointments">
                  Selecciona un día del calendario para ver sus citas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {showAgendarManualModal && (
        <ModalAgendarManual
          selectedDateInitial={selectedDay}
          onClose={() => setShowAgendarManualModal(false)}
          onSaveSuccess={() => {
            fetchCitas();
          }}
        />
      )}
    </div>
  );
}