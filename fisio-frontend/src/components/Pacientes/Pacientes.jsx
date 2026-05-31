import React, { useEffect, useState } from "react";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import { FaEye, FaCalendarAlt, FaFolderOpen, FaNotesMedical, FaSearch } from "react-icons/fa";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import ModalAgendarCita from "../layout/ModalAgendarCita.jsx";

export default function ListaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showModalCita, setShowModalCita] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const { user } = useAuth();
  const navigate = useNavigate();

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
            <h2 className="title_card" style={{ marginTop: 0, marginBottom: 0 }}>Pacientes</h2>
            <span className="subtitle-card-badge">Clínica Hesou</span>
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
                                <span className="patient-list-id-badge">
                                  ID: {p.identificadorPaciente}
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
              <h3 className="title_card" style={{ marginTop: 0, marginBottom: 0 }}>Detalles del Paciente</h3>
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
                  <span className="patient-detail-id">ID: {selectedPaciente.identificadorPaciente}</span>
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
                <div className="patient-detail-info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="patient-detail-info-label">Primera cita registrada</span>
                  <span className="patient-detail-info-value">
                    {formatDateDDMMYYYY(selectedPaciente.fechaCitaStr) || formatDateDDMMYYYY(selectedPaciente.fechaRegistro) || 'No especificada'}
                  </span>
                </div>
              </div>

              <div className="patient-detail-actions-wrapper">
                <button
                  className="patient-detail-action-btn btn-primary-action hover-grow"
                  onClick={() => handleViewFicha(selectedPaciente)}
                >
                  <FaFolderOpen /> Ver Ficha y Notas SOAP
                </button>

                <button
                  className="patient-detail-action-btn btn-secondary-action hover-grow"
                  onClick={() => handleCreateHistorial(selectedPaciente)}
                >
                  <FaNotesMedical /> Registrar Historial Clínico
                </button>

                <button
                  className="patient-detail-action-btn btn-accent-action hover-grow"
                  onClick={() => setShowModalCita(true)}
                >
                  <FaCalendarAlt /> Agendar Nueva Cita
                </button>
              </div>
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
            apellidos: selectedPaciente.apellidos,
            telefono: selectedPaciente.telefono,
            edad: selectedPaciente.edad
          }}
          onClose={() => setShowModalCita(false)}
        />
      )}
    </div>
  );
}
