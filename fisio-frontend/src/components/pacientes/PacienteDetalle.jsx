import { capitalizeWords, formatDateDDMMYYYY, obfuscateId, deobfuscateId } from "../../utils/utils.js";
import CardPaciente from "../pacientes/CardPaciente.jsx";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import api from "../../api.js";
import { FaEye, FaFolderOpen, FaNotesMedical, FaPlus, FaCalendarAlt, FaTrashAlt, FaExclamationCircle, FaMoneyBillWave } from "react-icons/fa";
import LoadingSpinner from "../layout/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import ModalAgendarCita from "../layout/ModalAgendarCita.jsx";
import ModalHistorialCitas from "../layout/ModalHistorialCitas.jsx";
import { showSuccess, showError, showConfirm } from "../../utils/alerts.js";

export default function PacienteDetalle() {
  const { id: rawId } = useParams();
  const id = deobfuscateId(rawId);
  const [notas, setNotas] = useState([]);
  const [historialClinico, setHistorialClinico] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [showModalCita, setShowModalCita] = useState(false);
  const [showModalHistorial, setShowModalHistorial] = useState(false);
  const [citaParaReagendar, setCitaParaReagendar] = useState(null);
  const [cargando, setCargando] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();


  const rolePath = user?.role || user?.rol || 'fisioterapeuta';

  const citasConAdeudoPendiente = (citas || []).filter(c => c.tieneAdeudo && !c.adeudoPagado);
  const tieneAdeudo = citasConAdeudoPendiente.length > 0;

  const handleCobrarAdeudoPaciente = async (cita) => {
    const nombreCompleto = paciente
      ? `${capitalizeWords(paciente.nombres || "")} ${capitalizeWords(paciente.apellidos || "")}`.trim()
      : "el paciente";

    const confirmed = await showConfirm(
      "¿Marcar Adeudo como Cobrado?",
      `¿Confirmas que se recibió el pago del adeudo por cancelación tardía (${formatDateDDMMYYYY(cita.fechaCitaStr)} a las ${cita.horaCita}) de ${nombreCompleto}?`
    );
    if (!confirmed) return;

    try {
      await api.put(`/citas/${cita._id}/adeudo/pagar`);
      showSuccess("Adeudo Cobrado", `Se registró el cobro del adeudo exitosamente.`);
      cargarCitasPaciente();
    } catch (err) {
      console.error("Error al cobrar adeudo:", err);
      const msg = err?.response?.data?.message || "No se pudo registrar el cobro del adeudo.";
      showError("Error", msg);
    }
  };

  const handleEliminarPaciente = async () => {
    const targetId = paciente?.identificadorPaciente || id;
    if (!targetId) {
      showError("Error", "No se encontró el identificador del paciente.");
      return;
    }
    const nombreCompleto = paciente
      ? `${capitalizeWords(paciente.nombres || "")} ${capitalizeWords(paciente.apellidos || "")}`.trim()
      : "este paciente";

    const confirmado = await showConfirm(
      `¿Eliminar a ${nombreCompleto}?`,
      `Esta acción es irreversible y eliminará el expediente de ${nombreCompleto} junto con su historial clínico, citas, notas SOAP y planes de ejercicios.`
    );
    if (!confirmado) return;

    try {
      setCargando(true);
      await api.delete(`/pacientes/${targetId}`);
      localStorage.removeItem("dataPaciente");
      showSuccess("Paciente eliminado", `El expediente de ${nombreCompleto} fue eliminado correctamente.`);
      navigate(`/${rolePath}/pacientes`);
    } catch (err) {
      console.error("Error al eliminar paciente:", err);
      showError("Error", "No se pudo eliminar el paciente.");
      setCargando(false);
    }
  };

  const cargarCitasPaciente = async () => {
    try {
      const resCitas = await api.get(`/citas/detalles-paciente/${id}`);
      setCitas(resCitas.data.historial || []);
    } catch (err) {
      console.error("Error al recargar citas:", err);
    }
  };

  // 📌 Cargar historial y notas del paciente
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // Cargar detalles del paciente
        try {
          const resPac = await api.get(`/pacientes/${id}`);
          setPaciente(resPac.data);
          localStorage.setItem("dataPaciente", JSON.stringify(resPac.data));
        } catch (err) {
          console.error("Error al cargar paciente por ID, usando fallback:", err);
          const localData = JSON.parse(localStorage.getItem("dataPaciente"));
          if (localData) {
            setPaciente(localData);
          }
        }

        // Cargar historial clínico
        try {
          const resHistorial = await api.get(`/historial-notas/paciente/${id}`);
          setHistorialClinico(resHistorial.data.historial || null);
          setNotas(resHistorial.data.notas || []);
        } catch (e) {
          console.warn("No se encontró historial previo para este paciente.");
          setHistorialClinico(null);
          setNotas([]);
        }

        // Cargar citas del paciente
        try {
          const resCitas = await api.get(`/citas/detalles-paciente/${id}`);
          setCitas(resCitas.data.historial || []);
        } catch (e) {
          console.warn("No se encontraron citas previas.");
          setCitas([]);
        }

        // Cargar Planes de Tratamiento
        try {
          const resPlanes = await api.get(`/planes/paciente/${id}`);
          setPlanes(resPlanes.data.planes || []);
        } catch (e) {
          console.warn("No se encontraron planes para este paciente.");
          setPlanes([]);
        }

      } catch (err) {
        console.error("Error al cargar datos del paciente:", err);
      } finally {
        setCargando(false);
      }
    };

    fetchDatos();
  }, [id]);

  return (
    <div className="auth-wrapper-content">
      <div className="cards-column">

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <>
            {/* Tarjeta del paciente */}
            {paciente && (
              <CardPaciente
                paciente={paciente}
                onDelete={handleEliminarPaciente}
                tieneAdeudo={tieneAdeudo}
                adeudoCount={citasConAdeudoPendiente.length}
              />
            )}

            {/* Banner de Alerta de Adeudo Pendiente 
            {tieneAdeudo && (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.08))",
                  border: "1.5px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "14px",
                  padding: "1rem 1.25rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontWeight: 800, fontSize: "0.95rem" }}>
                    <FaExclamationCircle size={17} />
                    <span>Paciente con {citasConAdeudoPendiente.length === 1 ? "1 Adeudo Pendiente" : `$($citasConAdeudoPendiente.length) Adeudos Pendientes`} por Cancelación Tardía</span>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    Se debe cobrar en la consulta actual
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {citasConAdeudoPendiente.map((citaAdeudo) => (
                    <div
                      key={citaAdeudo._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                        background: "rgba(255, 255, 255, 0.6)",
                        padding: "0.65rem 0.9rem",
                        borderRadius: "10px",
                        border: "1px solid rgba(239, 68, 68, 0.2)"
                      }}
                    >
                      <div style={{ fontSize: "0.83rem", color: "var(--text-main)" }}>
                        <strong>Cita cancelada:</strong> {formatDateDDMMYYYY(citaAdeudo.fechaCitaStr)} a las {citaAdeudo.horaCita} hrs
                        {citaAdeudo.area && (
                          <span style={{ marginLeft: "8px", textTransform: "capitalize", color: "var(--primary)", fontWeight: 600 }}>
                            ({citaAdeudo.area})
                          </span>
                        )}
                        {citaAdeudo.adeudoHorasAnticipacion != null && (
                          <span style={{ marginLeft: "8px", color: "#ef4444", fontSize: "0.76rem", fontWeight: 700 }}>
                            • Cancelada con {citaAdeudo.adeudoHorasAnticipacion} hrs de anticipación
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCobrarAdeudoPaciente(citaAdeudo)}
                        style={{
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
                        }}
                      >
                        <FaMoneyBillWave size={12} /> Marcar como Cobrado
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}*/}

            <div className="auth-card auth-card-detail" style={{ marginTop: 0 }}>
              <div className="profile-actions-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="title_card" style={{ margin: 0 }}>
                  Historial Clínico del Paciente
                </h3>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    title={`Ver Historial de Citas (${citas.length})`}
                    onClick={() => setShowModalHistorial(true)}
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      margin: 0
                    }}
                    className="hover-grow"
                  >
                    <FaCalendarAlt size={11} /> Citas ({citas.length})
                  </button>

                  {historialClinico ? (
                    <>
                      {/* 📅 Historial de Citas 
                      <button
                        title={`Ver Historial de Citas (${citas.length})`}
                        onClick={() => setShowModalHistorial(true)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          margin: 0
                        }}
                        className="hover-grow"
                      >
                        <FaCalendarAlt size={11} /> Citas ({citas.length})
                      </button>
                      */}

                      {/* ➕ Agendar Cita */}
                      <button
                        title="Agendar Nueva Cita"
                        onClick={() => {
                          setCitaParaReagendar(null);
                          setShowModalCita(true);
                        }}
                        style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          margin: 0
                        }}
                        className="hover-grow"
                      >
                        <FaPlus size={11} /> Agendar
                      </button>

                      {/* 📋 Ver Historial Completo */}
                      <button
                        title="Ver Historial Completo"
                        onClick={() => navigate(`/${rolePath}/historial-detalle/${historialClinico._id}`)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          margin: 0
                        }}
                        className="hover-grow"
                      >
                        <FaFolderOpen size={11} /> Historial
                      </button>
                    </>
                  ) : (
                    /* 📋 Registrar Historial Clínico (Cuando no tiene) */
                    <button
                      title="Registrar Historial Médico"
                      onClick={() => {
                        if (paciente) {
                          localStorage.setItem("dataPaciente", JSON.stringify(paciente));
                        }
                        navigate(`/${rolePath}/creacion-historial`);
                      }}
                      style={{
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        margin: 0
                      }}
                      className="hover-grow glow-pulse-orange"
                    >
                      <FaNotesMedical size={11} /> Crear Historial
                    </button>
                  )}

                  {/* Planes de Ejercicio */}
                  {historialClinico && (
                    <>
                      {planes.length > 0 ? (
                        <button
                          className="hover-grow"
                          style={{
                            background: 'rgba(23, 162, 184, 0.12)',
                            color: '#17a2b8',
                            border: '1px solid rgba(23, 162, 184, 0.25)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            margin: 0
                          }}
                          onClick={() => navigate(`/${rolePath}/planes-paciente/${id}`)}
                        >
                          <FaNotesMedical size={11} /> Planes ({planes.length})
                        </button>
                      ) : (
                        <button
                          className="hover-grow"
                          style={{
                            background: 'rgba(23, 162, 184, 0.12)',
                            color: '#17a2b8',
                            border: '1px solid rgba(23, 162, 184, 0.25)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            margin: 0
                          }}
                          onClick={() => navigate(`/${rolePath}/crear-plan/${id}`)}
                        >
                          <FaPlus size={10} /> Crear Plan
                        </button>
                      )}

                      <button
                        className="hover-grow"
                        style={{
                          background: 'rgba(99, 102, 241, 0.12)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          margin: 0
                        }}
                        onClick={() => navigate(`/${rolePath}/notas`)}
                      >
                        <FaPlus size={10} /> Nota SOAP
                      </button>
                    </>
                  )}
                </div>
              </div>

              <hr style={{ margin: '1rem 0' }} />

              {notas.length === 0 ? (
                <p className="text-muted">No existe registros para este paciente.</p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="desktop-table-container" style={{ width: '100%', overflowX: 'auto' }}>
                    <table className="tabla-pacientes">
                      <thead>
                        <tr>
                          <th>ID Nota</th>
                          <th>Fecha de Registro</th>
                          <th style={{ textAlign: 'center' }}>Acción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {notas.map((item) => (
                          <tr key={item._id}>
                            <td>{item.idHistoricoFk || item._id}</td>
                            <td>{formatDateDDMMYYYY(item.fechaNota || item.createdAt)}</td>
                            <td style={{ display: 'flex', justifyContent: 'center' }}>
                              <button
                                className="btn-eye"
                                onClick={() => navigate(`/${rolePath}/nota-detalle/${item._id}`)}
                                title="Ver nota SOAP"
                              >
                                <FaEye />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Tactical Cards List (Perfect for small screens) */}
                  <div className="mobile-notes-grid-cards">
                    {notas.map((item) => (
                      <div key={item._id} className="mobile-note-card">
                        <div className="mobile-note-card-header">
                          <div className="mobile-note-card-icon">
                            <FaNotesMedical />
                          </div>
                          <div className="mobile-note-card-meta">
                            <span className="mobile-note-card-title">
                              Nota SOAP: {item.idHistoricoFk ? item.idHistoricoFk.substring(0, 12) : item._id.substring(0, 8)}
                            </span>
                            <span className="mobile-note-card-date">
                              Registrado el: {formatDateDDMMYYYY(item.fechaNota || item.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          className="mobile-note-card-view-btn"
                          onClick={() => navigate(`/${rolePath}/nota-detalle/${item._id}`)}
                        >
                          <FaEye /> Ver detalles de nota
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Booking Modal */}
            {showModalCita && paciente && (
              <ModalAgendarCita
                paciente={{
                  identificadorPaciente: paciente.identificadorPaciente,
                  nombres: paciente.nombres,
                  apellidoPaterno: paciente.apellidoPaterno || '',
                  apellidoMaterno: paciente.apellidoMaterno || '',
                  apellidos: paciente.apellidos,
                  telefono: paciente.telefono,
                  edad: paciente.edad,
                  email: paciente.email || '',
                  area: paciente.area || rolePath
                }}
                citaAReagendar={citaParaReagendar}
                onClose={() => {
                  setShowModalCita(false);
                  setCitaParaReagendar(null);
                  cargarCitasPaciente();
                }}
              />
            )}

            {/* History Modal */}
            {showModalHistorial && paciente && (
              <ModalHistorialCitas
                paciente={paciente}
                citas={citas}
                onClose={() => setShowModalHistorial(false)}
                onStatusChange={async (citaId, nuevoEstado) => {
                  try {
                    await api.put(`/citas/${citaId}/estado`, { estado: nuevoEstado });
                    setShowModalHistorial(false);
                    showSuccess("Estado actualizado", `La cita se marcó como: ${nuevoEstado}`);
                    cargarCitasPaciente();
                  } catch (err) {
                    console.error("Error al actualizar estado:", err);
                    showError("Error", "No se pudo actualizar el estado de la cita");
                  }
                }}
                onReagendar={(cita) => {
                  setShowModalHistorial(false);
                  setCitaParaReagendar(cita);
                  setShowModalCita(true);
                }}
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}
