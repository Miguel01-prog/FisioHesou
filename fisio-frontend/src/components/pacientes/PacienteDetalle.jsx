import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils.js";
import CardPaciente from "../pacientes/CardPaciente.jsx";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import api from "../../api.js";
import { FaEye, FaFolderOpen, FaNotesMedical, FaPlus, FaCalendarAlt } from "react-icons/fa";
import LoadingSpinner from "../layout/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import ModalAgendarCita from "../layout/ModalAgendarCita.jsx";
import ModalHistorialCitas from "../layout/ModalHistorialCitas.jsx";
import { showSuccess, showError } from "../../utils/alerts.js";

export default function PacienteDetalle() {
  const { id } = useParams();
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


  const rolePath = user?.role || 'fisioterapeuta';

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
          if (localData && localData.identificadorPaciente === id) {
            setPaciente(localData);
          }
        }

        // Cargar citas
        const resCitas = await api.get(`/citas/detalles-paciente/${id}`);
        setCitas(resCitas.data.historial || []);

        // Cargar Historial Clínico
        try {
          const resHistorial = await api.get(`/historial-notas/paciente/${id}`);
          if (resHistorial.data.ok) {
            setHistorialClinico(resHistorial.data.historial);
          }
        } catch (e) {
          console.warn("No se encontró historial clínico para este paciente.");
          setHistorialClinico(null);
        }

        // Cargar Notas SOAP
        try {
          const resNotas = await api.get(`/notas/paciente/${id}`);
          setNotas(resNotas.data || []);
        } catch (e) {
          console.warn("No se encontraron notas para este paciente.");
          setNotas([]);
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
            <LoadingSpinner size="large" color="#42133B" />
          </div>
        ) : (
          <>
            {/* Tarjeta del paciente */}
            {paciente && <CardPaciente paciente={paciente} />}

            <div className="auth-card auth-card-detail" style={{ marginTop: 0 }}>
              <div className="profile-actions-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="profile-actions-title" style={{ margin: 0 }}>
                  Historial Clínico del Paciente
                </h3>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>

                  {historialClinico ? (
                    <>
                      {/* 📅 Historial de Citas */}
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
                        <span>➕</span> Agendar
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
                      onClick={() => navigate(`/${rolePath}/creacion-historial`)}
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
