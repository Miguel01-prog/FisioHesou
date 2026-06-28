import React, { useEffect, useState } from "react";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import { FaEye, FaCalendarAlt, FaFolderOpen, FaNotesMedical, FaSearch, FaTrashAlt } from "react-icons/fa";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import ModalAgendarCita from "../layout/ModalAgendarCita.jsx";
import ModalHistorialCitas from "../layout/ModalHistorialCitas.jsx";
import { showConfirm, showSuccess, showError } from "../../utils/alerts.js";

export default function ListaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [tieneHistorial, setTieneHistorial] = useState(null);
  const [showModalCita, setShowModalCita] = useState(false);
  const [showModalHistorial, setShowModalHistorial] = useState(false);
  const [citaParaReagendar, setCitaParaReagendar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [citasPaciente, setCitasPaciente] = useState([]);

  const cargarCitasPaciente = async (identificadorPaciente) => {
    if (!identificadorPaciente) return;
    try {
      setCargandoFicha(true);
      const { data } = await api.get(`/citas/detalles-paciente/${identificadorPaciente}`);
      setCitasPaciente(data.historial || []);
    } catch (err) {
      console.error("Error al cargar citas de paciente:", err);
      setCitasPaciente([]);
    } finally {
      setCargandoFicha(false);
    }
  };

  // Verificar si el paciente seleccionado ya tiene historial clínico y cargar citas
  useEffect(() => {
    if (!selectedPaciente) {
      setTieneHistorial(null);
      setCitasPaciente([]);
      return;
    }
    const cargarDatosFicha = async () => {
      try {
        setCargandoFicha(true);
        // 1. Verificar Historial Clínico
        let tieneHist = false;
        try {
          const res = await api.get(`/historial-notas/paciente/${selectedPaciente.identificadorPaciente}`);
          if (res.data.ok && res.data.historial) {
            tieneHist = true;
          }
        } catch (error) {
          // ignore or log
        }
        setTieneHistorial(tieneHist);

        // 2. Cargar Citas
        const { data } = await api.get(`/citas/detalles-paciente/${selectedPaciente.identificadorPaciente}`);
        setCitasPaciente(data.historial || []);
      } catch (err) {
        console.error("Error al cargar datos de la ficha:", err);
      } finally {
        setCargandoFicha(false);
      }
    };
    cargarDatosFicha();
  }, [selectedPaciente]);

  useEffect(() => {
    obtenerPacientes();
  }, []);

  // Resetear paginación al realizar búsquedas
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const obtenerPacientes = async () => {
    try {
      const { data } = await api.get("/pacientes");
      setPacientes(data);
      localStorage.setItem("listaPacientes", JSON.stringify(data));
      // Seleccionar el primer paciente por defecto al inicio
      if (data && data.length > 0) {
        setSelectedPaciente(data[0]);
        localStorage.setItem("dataPaciente", JSON.stringify(data[0]));
      }
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleRowClick = (p) => {
    setSelectedPaciente(p);
    localStorage.setItem("dataPaciente", JSON.stringify(p));
  };

  const handleViewFicha = (p) => {
    localStorage.setItem("dataPaciente", JSON.stringify(p));
    navigate(`/${user?.role || 'fisioterapeuta'}/paciente/${p.identificadorPaciente}`);
  };

  const handleCreateHistorial = (p) => {
    localStorage.setItem("dataPaciente", JSON.stringify(p));
    navigate(`/${user?.role || 'fisioterapeuta'}/creacion-historial`);
  };

  const handleEliminarPaciente = async (identificadorPaciente) => {
    const seguro = await showConfirm(
      "¿Eliminar Paciente?",
      "Esta acción es irreversible y eliminará al paciente junto con todas sus citas, notas SOAP, historial clínico y planes de tratamiento."
    );
    if (!seguro) return;

    try {
      setCargando(true);
      await api.delete(`/pacientes/${identificadorPaciente}`);
      showSuccess("Paciente eliminado", "El expediente del paciente y todos sus registros relacionados fueron eliminados.");
      setSelectedPaciente(null);
      await obtenerPacientes();
    } catch (err) {
      console.error("Error al eliminar paciente:", err);
      showError("Error", "No se pudo eliminar el paciente.");
      setCargando(false);
    }
  };

  // Filtrado de pacientes en tiempo real
  const filteredPacientes = pacientes.filter((p) => {
    const fullName = `${p.nombres} ${p.apellidos}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      (p.identificadorPaciente && p.identificadorPaciente.toLowerCase().includes(query)) ||
      (p.telefono && p.telefono.includes(query))
    );
  });

  // Cálculo de paginación
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredPacientes.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredPacientes.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Cambiar la selección automáticamente al primer paciente de la nueva página para evitar desincronizaciones
    const firstPacienteOfPage = filteredPacientes[(pageNumber - 1) * recordsPerPage];
    if (firstPacienteOfPage) {
      setSelectedPaciente(firstPacienteOfPage);
      localStorage.setItem("dataPaciente", JSON.stringify(firstPacienteOfPage));
    }
  };

  return (
    <div className="auth-wrapper-content fade-in-up">

      {/* 🔍 Real-Time Search & Stats Header block */}
      <div className="search-bar-container-modern mb-4">
        <div className="search-input-wrapper-glass">
          <FaSearch className="search-icon-purple" />
          <input
            type="text"
            className="search-input-glass"
            placeholder="Buscar paciente por nombre, ID o número de teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="patient-count-badge">
          <span className="count-label">Total Pacientes:</span>
          <span className="count-value">{filteredPacientes.length}</span>
        </div>
      </div>

      <div className="patients-layout-grid has-selected">

        {/* Left Column: Patients Table */}
        <div className="auth-card auth-card-wide" style={{ marginTop: 0 }}>
          <div className="card-header-split">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <h2 className="title_card" style={{ marginTop: 0, marginBottom: 0 }}>Pacientes</h2>
              <button
                type="button"
                className="patient-detail-action-btn btn-primary-action hover-grow"
                style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.4rem" }}
                onClick={() => {
                  localStorage.removeItem("dataPaciente");
                  navigate(`/${user?.role || 'fisioterapeuta'}/creacion-historial`);
                }}
              >
                <span>➕</span> Registrar Paciente
              </button>
            </div>
          </div>
          <hr />

          {cargando && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
              <LoadingSpinner size="large" />
            </div>
          )}

          {!cargando && filteredPacientes.length === 0 && (
            <div className="table-empty-state">
              <p className="text-muted">No se encontraron pacientes que coincidan con la búsqueda.</p>
            </div>
          )}

          {!cargando && filteredPacientes.length > 0 && (
            <div style={{ width: '100%' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="tabla-pacientes">
                  <thead>
                    <tr>
                      <th>Información del Paciente</th>
                      <th>Teléfono</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentRecords.map((p) => {
                      const isSelected = selectedPaciente?.identificadorPaciente === p.identificadorPaciente;
                      return (
                        <tr
                          key={p.identificadorPaciente}
                          className={isSelected ? 'selected-row' : ''}
                          onClick={() => handleRowClick(p)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <div className="patient-list-profile-wrapper">
                              <div className="patient-list-avatar-circle">
                                {p.nombres ? p.nombres.substring(0, 1).toUpperCase() : 'P'}
                              </div>
                              <div className="patient-list-identity">
                                <span className="patient-list-name">
                                  {capitalizeWords(p.nombres)} {capitalizeWords(p.apellidos)}
                                </span>

                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="patient-list-phone">
                              <span className="phone-icon-span">📞</span> {p.telefono || "No registrado"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Premium Pagination Controls UI */}
              {totalPages > 1 && (
                <div className="pagination-container-modern">
                  <span className="pagination-stats">
                    Mostrando <strong>{indexOfFirstRecord + 1}</strong> - <strong>{Math.min(indexOfLastRecord, filteredPacientes.length)}</strong> de <strong>{filteredPacientes.length}</strong>
                  </span>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Ant.
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Sig.
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Selected Patient Details Card */}
        {selectedPaciente && (
          <div className="patient-detail-card-wrapper">
            <div className="auth-card" style={{ marginTop: 0 }}>
              {cargandoFicha ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px' }}>
                  <LoadingSpinner size="large" />
                </div>
              ) : (
                <>
                  <div className="card-header-split" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 className="title_card" style={{ marginTop: 0, marginBottom: 0 }}>Detalle del paciente</h3>

                  </div>
                  <hr />

                  <div className="patient-detail-avatar-section">
                    <div className="patient-detail-avatar-container">
                      <div className="patient-detail-avatar">
                        {selectedPaciente.nombres ? selectedPaciente.nombres.substring(0, 1).toUpperCase() : 'P'}
                      </div>
                      <span className="active-dot-badge"></span>
                    </div>
                    <div>
                      <h4 className="patient-detail-name">
                        {capitalizeWords(selectedPaciente.nombres)} {capitalizeWords(selectedPaciente.apellidos)}
                      </h4>
                    </div>
                  </div>

                  <div className="patient-detail-info-grid">
                    <div className="patient-detail-info-item">
                      <span className="patient-detail-info-label">Teléfono</span>
                      <span className="patient-detail-info-value">{selectedPaciente.telefono || 'No registrado'}</span>
                    </div>
                    <div className="patient-detail-info-item">
                      <span className="patient-detail-info-label">Edad</span>
                      <span className="patient-detail-info-value">{selectedPaciente.edad || 'No especificada'} años</span>
                    </div>


                    {(() => {
                      const activeCitas = citasPaciente.filter(c => c.estado !== "Cancelado");
                      const sortedCitas = [...activeCitas].sort((a, b) => {
                        const dateTimeA = new Date(`${a.fechaCitaStr}T${a.horaCita}`);
                        const dateTimeB = new Date(`${b.fechaCitaStr}T${b.horaCita}`);
                        return dateTimeA - dateTimeB;
                      });

                      const ahora = new Date();
                      const pastCitas = sortedCitas.filter(c => new Date(`${c.fechaCitaStr}T${c.horaCita}`) < ahora);
                      const futureCitas = sortedCitas.filter(c => new Date(`${c.fechaCitaStr}T${c.horaCita}`) >= ahora);

                      const ultimaCita = pastCitas.length > 0 ? pastCitas[pastCitas.length - 1] : null;
                      const siguienteCita = futureCitas.length > 0 ? futureCitas[0] : null;

                      return (
                        <>
                          <div className="patient-detail-info-item" style={{ gridColumn: 'span 2' }}>
                            <span className="patient-detail-info-label">Última cita</span>
                            <span className="patient-detail-info-value">
                              {ultimaCita ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {formatDateDDMMYYYY(ultimaCita.fechaCitaStr)} a las {ultimaCita.horaCita} hs
                                  <span style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: ultimaCita.estado === "Asistió" ? "rgba(16, 185, 129, 0.15)" : ultimaCita.estado === "No asistió" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.08)",
                                    color: ultimaCita.estado === "Asistió" ? "#10b981" : ultimaCita.estado === "No asistió" ? "#ef4444" : "inherit",
                                    fontWeight: '500'
                                  }}>

                                  </span>
                                </span>
                              ) : 'Ninguna registrada'}
                            </span>
                          </div>
                          <div className="patient-detail-info-item" style={{ gridColumn: 'span 2' }}>
                            <span className="patient-detail-info-label">Próxima cita</span>
                            <span className="patient-detail-info-value">
                              {siguienteCita ? (
                                <span style={{ color: '#10b981', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {formatDateDDMMYYYY(siguienteCita.fechaCitaStr)} a las {siguienteCita.horaCita} hs

                                </span>
                              ) : (
                                <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  ⚠️ Sin cita próxima
                                </span>
                              )}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="patient-detail-actions-wrapper">
                    <button
                      className="patient-detail-action-btn btn-primary-action hover-grow"
                      onClick={() => handleViewFicha(selectedPaciente)}
                      style={{ margin: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                    >
                      <FaFolderOpen /> Gestionar Paciente
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModalCita && selectedPaciente && (
        <ModalAgendarCita
          paciente={{
            identificadorPaciente: selectedPaciente.identificadorPaciente,
            nombres: selectedPaciente.nombres,
            apellidoPaterno: selectedPaciente.apellidoPaterno,
            apellidoMaterno: selectedPaciente.apellidoMaterno,
            apellidos: selectedPaciente.apellidos,
            telefono: selectedPaciente.telefono,
            edad: selectedPaciente.edad,
            email: selectedPaciente.email,
            area: selectedPaciente.area || user?.role || 'fisioterapeuta'
          }}
          citaAReagendar={citaParaReagendar}
          onClose={() => {
            setShowModalCita(false);
            setCitaParaReagendar(null);
            cargarCitasPaciente(selectedPaciente.identificadorPaciente);
          }}
        />
      )}

      {/* History Modal */}
      {showModalHistorial && selectedPaciente && (
        <ModalHistorialCitas
          paciente={selectedPaciente}
          citas={citasPaciente}
          onClose={() => setShowModalHistorial(false)}
          onStatusChange={async (citaId, nuevoEstado) => {
            try {
              await api.put(`/citas/${citaId}/estado`, { estado: nuevoEstado });
              showSuccess("Estado actualizado", `La cita se marcó como: ${nuevoEstado}`);
              cargarCitasPaciente(selectedPaciente.identificadorPaciente);
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
    </div>
  );
}
