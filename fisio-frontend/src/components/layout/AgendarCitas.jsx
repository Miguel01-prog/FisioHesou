import React, { useState, useEffect } from "react";
import { getUsuarioRol, formatDateDDMMYYYY, toLocalISODate } from "../../utils/utils";
import "react-calendar/dist/Calendar.css";
import Calendar from "react-calendar";
import "../../styles/calendary.css";
import api from "../../api";

export default function AgendaCitas() {
  const [citas, setCitas] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [citasDelDia, setCitasDelDia] = useState([]);
  const [blockedDatesAdmin, setBlockedDatesAdmin] = useState([]);
  const [blockedDatesPaciente, setBlockedDatesPaciente] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const rolUsuario = getUsuarioRol(user);
  const hoyStr = toLocalISODate(new Date());

 
  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const endpoint = rolUsuario ? `/citas?area=${rolUsuario}` : "/citas";
        const { data } = await api.get(endpoint);
        setCitas(data || []);

        // Extraer días bloqueados según tipo
        const adminDays = [...new Set(data.filter(c => c.area === "administrador").map(c => c.fechaCitaStr))];
        const pacienteDays = [...new Set(data.filter(c => c.area !== "administrador").map(c => c.fechaCitaStr))];
        setBlockedDatesAdmin(adminDays);
        setBlockedDatesPaciente(pacienteDays);

        // Mostrar citas del día actual
        const citasHoy = (data || []).filter(c => c.fechaCitaStr === hoyStr);
        citasHoy.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
        setSelectedDay(hoyStr);
        setCitasDelDia(citasHoy);
      } catch (err) {
        console.error("Error al cargar citas:", err);
      }
    };
    fetchCitas();
  }, [rolUsuario]);

  const handleDayClick = (date) => {
    const iso = toLocalISODate(date);
    const hoy = toLocalISODate(new Date());

   
    if (iso < hoy) return;

    setSelectedDay(iso);
    const citasDia = citas.filter(c => c.fechaCitaStr === iso);
    citasDia.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
    setCitasDelDia(citasDia);
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
                  return iso < hoy;
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
          </div>
          {/* Citas del día */}
          <div className="agenda-right" style={{ marginTop: "20px" }}>
            <div className="text-muted text-center">
              <h4>
                {selectedDay
                  ? selectedDay === hoyStr
                    ? "Citas para hoy"
                    : `Citas para ${formatDateDDMMYYYY(selectedDay)}`
                  : "Selecciona un día"}
              </h4>
            </div>

            <div className="right-body">
              {selectedDay ? (
                citasDelDia.length > 0 ? (
                  <div className="appointments-list">
                    {citasDelDia.map((cita, i) => (
                      <div key={cita._id || i} className="appointment-card">
                        <div className="appointment-time">🕒 {cita.horaCita}</div>
                        <div className="appointment-info">
                          <div className="appointment-name">
                            <strong>{cita.nombres} {cita.apellidos}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-appointments">No hay citas registradas este día.</p>
                )
              ) : (
                <p className="no-appointments">Selecciona un día del calendario para ver sus citas.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
