import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils.js";
import CardPaciente from "../pacientes/CardPaciente.jsx";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import api from "../../api.js";
import { FaEye, FaFolderOpen, FaNotesMedical, FaPlus } from "react-icons/fa";
import LoadingSpinner from "../layout/LoadingSpinner.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function PacienteDetalle() {
  const { id } = useParams();
  const [notas, setNotas] = useState([]);
  const [historialClinico, setHistorialClinico] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const rolePath = user?.role || 'fisioterapeuta';

  // 📌 Cargar historial y notas del paciente
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // Cargar detalles del paciente
        const resCitas = await api.get(`/citas/detalles-paciente/${id}`);
        if (resCitas.data.historial && resCitas.data.historial.length > 0) {
          const p = resCitas.data.historial[0];
          setPaciente({
            identificadorPaciente: p.identificadorPaciente,
            nombres: p.nombres,
            apellidos: p.apellidos,
            edad: p.edad,
            telefono: p.telefono,
            fechaRegistro: p.fechaCreado,
          });
        } else {
          // Intentar desde localStorage si no tiene citas previas
          const localData = JSON.parse(localStorage.getItem("dataPaciente"));
          if (localData && localData.identificadorPaciente === id) {
            setPaciente(localData);
          }
        }

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
              <div className="profile-actions-header">
                <h3 className="profile-actions-title">
                  Historial Clínico del Paciente
                </h3>

                <div className="profile-actions-button-group">
                  {historialClinico ? (
                    <>
                      <button
                        className="save-btn"
                        style={{ backgroundColor: "var(--primary)" }}
                        onClick={() => navigate(`/${rolePath}/historial-detalle/${historialClinico._id}`)}
                      >
                        <FaFolderOpen /> Ver Historial Completo
                      </button>

                      {planes.length > 0 ? (
                        <button
                          className="save-btn"
                          style={{ backgroundColor: "#17a2b8" }}
                          onClick={() => navigate(`/${rolePath}/planes-paciente/${id}`)}
                        >
                          <FaNotesMedical /> Planes de Ejercicio ({planes.length})
                        </button>
                      ) : (
                        <button
                          className="save-btn"
                          style={{ backgroundColor: "#17a2b8" }}
                          onClick={() => navigate(`/${rolePath}/crear-plan/${id}`)}
                        >
                          <FaPlus /> Crear Plan de Ejercicio
                        </button>
                      )}
                      
                      <button
                        className="save-btn"
                        onClick={() => navigate(`/${rolePath}/notas`)}
                      >
                        <FaPlus /> Añadir Nota SOAP
                      </button>
                    </>
                  ) : (
                    <button
                      className="save-btn"
                      onClick={() => navigate(`/${rolePath}/creacion-historial`)}
                    >
                      <FaPlus /> Registrar Historial Médico
                    </button>
                  )}
                </div>
              </div>

              <hr style={{ margin: '1rem 0' }} />

              {notas.length === 0 ? (
                <p className="text-muted">No hay notas SOAP registradas para este paciente.</p>
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

          </>
        )}

      </div>
    </div>
  );
}
