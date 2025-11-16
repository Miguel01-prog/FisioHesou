import { getUsuarioRol, formatDateDDMMYYYY, toLocalISODate } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
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
  const [pacientesNuevos, setPacientesNuevos] = useState(new Set());

  const user = JSON.parse(localStorage.getItem("user"));
  const rolUsuario = getUsuarioRol(user);
  const hoyStr = toLocalISODate(new Date());
  const fetchedOnce = useRef(false);
  const navigate = useNavigate();

  const normalizar = (str) =>
    (str || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Cargar citas por rol
  useEffect(() => {
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

        const citasHoy = data.filter(c => c.fechaCitaStr === hoyStr);
        citasHoy.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));
        setSelectedDay(hoyStr);
        setCitasDelDia(citasHoy);
      } catch (err) {
        console.error("Error al cargar citas:", err);
      }
    };
    fetchCitas();
  }, [rolUsuario]);

  // Validar pacientes solo una vez
  useEffect(() => {
    const fetchPacientes = async () => {
      if (fetchedOnce.current) return;
      fetchedOnce.current = true;
      try {
        const { data } = await api.get("/citas/validar-pacientes");
        const lista = data.nuevosPacientes || [];

        const nuevos = new Set(
          lista.map(p =>
            `${normalizar(p.nombres)}-${normalizar(p.apellidos)}-${p.telefono}`
          )
        );
        setPacientesNuevos(nuevos);
      } catch (err) {
        console.error("Error al validar pacientes:", err);
      }
    };

    fetchPacientes();
  }, []);

  
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
                    {citasDelDia.map((cita, i) => {
                      const idPaciente = `${normalizar(cita.nombres)}-${normalizar(cita.apellidos)}-${cita.telefono}`;
                      const esNuevo = pacientesNuevos.has(idPaciente);

                      return (
                        <div key={cita._id || i} className="appointment-card"  
                          onClick={() => navigate(`/fisioterapeuta/paciente/${cita.identificadorPaciente}`)}
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
    </div>
  );
}
