import React, { useEffect, useState } from "react";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaCalendarAlt,
  FaFolderOpen,
  FaNotesMedical,
  FaSearch,
  FaTrashAlt,
  FaPlus,
  FaPhoneAlt,
  FaExclamationTriangle,
  FaUserPlus,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
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
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState(false);
  const [tieneHistorial, setTieneHistorial] = useState(null);
  const [showModalCita, setShowModalCita] = useState(false);
  const [showModalHistorial, setShowModalHistorial] = useState(false);
  const [citaParaReagendar, setCitaParaReagendar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;
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
      // Seleccionar el primer paciente por defecto al inicio para la vista de escritorio
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
    const isSame = selectedPaciente?.identificadorPaciente === p.identificadorPaciente;
    if (isSame) {
      setMobileAccordionOpen((prev) => !prev);
    } else {
      setSelectedPaciente(p);
      setMobileAccordionOpen(true);
      localStorage.setItem("dataPaciente", JSON.stringify(p));
    }
  };

  const handleViewFicha = (p) => {
    const pacienteData = p || selectedPaciente || (() => {
      try {
        return JSON.parse(localStorage.getItem("dataPaciente"));
      } catch (e) {
        return null;
      }
    })();

    if (!pacienteData) {
      showError("Selección requerida", "Por favor selecciona un paciente de la lista.");
      return;
    }

    const targetId = pacienteData.identificadorPaciente || pacienteData._id || pacienteData.id;
    if (!targetId) {
      showError("Error", "No se encontró el identificador del paciente.");
      return;
    }

    const role = user?.role || user?.rol || 'fisioterapeuta';
    localStorage.setItem("dataPaciente", JSON.stringify(pacienteData));
    const targetUrl = `/${role}/paciente/${targetId}`;
    navigate(targetUrl);
  };

  const handleCreateHistorial = (p) => {
    localStorage.setItem("dataPaciente", JSON.stringify(p));
    navigate(`/${user?.role || 'fisioterapeuta'}/creacion-historial`);
  };

  const handleEliminarPaciente = async (pacienteTarget) => {
    const p = typeof pacienteTarget === "object" && pacienteTarget !== null ? pacienteTarget : selectedPaciente;
    const targetId = typeof pacienteTarget === "string" ? pacienteTarget : p?.identificadorPaciente || p?._id;
    if (!targetId) {
      showError("Error", "No se encontró el identificador del paciente.");
      return;
    }
    const nombreCompleto = p ? `${capitalizeWords(p.nombres || "")} ${capitalizeWords(p.apellidos || "")}`.trim() : "este paciente";
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
      setSelectedPaciente(null);
      setMobileAccordionOpen(false);
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
  const visiblePages =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : currentPage <= 3
      ? [1, 2, 3, 4, "...", totalPages]
      : currentPage >= totalPages - 2
      ? [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
      : [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setMobileAccordionOpen(false);
    const firstPacienteOfPage = filteredPacientes[(pageNumber - 1) * recordsPerPage];
    if (firstPacienteOfPage) {
      setSelectedPaciente(firstPacienteOfPage);
      localStorage.setItem("dataPaciente", JSON.stringify(firstPacienteOfPage));
    }
  };

  // Resumen de citas del paciente seleccionado
  const getCitasResumen = () => {
    const activeCitas = citasPaciente.filter((c) => c.estado !== "Cancelado");
    const sortedCitas = [...activeCitas].sort((a, b) => {
      const dateTimeA = new Date(`${a.fechaCitaStr}T${a.horaCita}`);
      const dateTimeB = new Date(`${b.fechaCitaStr}T${b.horaCita}`);
      return dateTimeA - dateTimeB;
    });

    const ahora = new Date();
    const pastCitas = sortedCitas.filter((c) => new Date(`${c.fechaCitaStr}T${c.horaCita}`) < ahora);
    const futureCitas = sortedCitas.filter((c) => new Date(`${c.fechaCitaStr}T${c.horaCita}`) >= ahora);

    return {
      ultimaCita: pastCitas.length > 0 ? pastCitas[pastCitas.length - 1] : null,
      siguienteCita: futureCitas.length > 0 ? futureCitas[0] : null
    };
  };

  const { ultimaCita, siguienteCita } = getCitasResumen();

  return (
    <div className="auth-wrapper-content fade-in-up">

      {/* 🔍 Real-Time Search & Stats Header block */}
      <div className="search-bar-container-modern mb-4">
        <div className="search-input-wrapper-glass">
          <FaSearch className="search-icon-purple" />
          <input
            type="text"
            className="search-input-glass"
            placeholder="Buscar paciente por nombre o número de teléfono..."
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
                <FaPlus size={12} /> Registrar Paciente
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
                      const showMobileDetail = isSelected && mobileAccordionOpen;

                      return (
                        <tr
                          key={p.identificadorPaciente || p._id}
                          className={`${isSelected ? 'selected-row' : ''} ${showMobileDetail ? 'mobile-expanded-row' : ''}`}
                          onClick={() => handleRowClick(p)}
                          onDoubleClick={() => handleViewFicha(p)}
                          title="Haz clic para seleccionar o doble clic para gestionar"
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <div className="patient-list-profile-wrapper" style={{ justifyContent: 'space-between', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                <div className="patient-list-avatar-circle">
                                  {p.nombres ? p.nombres.substring(0, 1).toUpperCase() : 'P'}
                                </div>
                                <div className="patient-list-identity">
                                  <span className="patient-list-name">
                                    {capitalizeWords(p.nombres)} {capitalizeWords(p.apellidos)}
                                  </span>
                                </div>
                              </div>
                              <span className="mobile-accordion-chevron" aria-hidden="true">
                                {showMobileDetail ? <FaChevronUp size={13} /> : <FaChevronDown size={13} />}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="patient-list-phone">
                              <span className="phone-icon-span"><FaPhoneAlt size={11} /></span> {p.telefono || "No registrado"}
                            </div>

                            {/* 📱 Acordeón desplegable en móvil/tablet debajo del paciente seleccionado */}
                            {showMobileDetail && (
                              <div
                                className="patient-mobile-accordion"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cargandoFicha ? (
                                  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                                    <LoadingSpinner size="small" />
                                  </div>
                                ) : (
                                  <>
                                    <div className="patient-mobile-accordion-grid">
                                      <div className="patient-mobile-accordion-item">
                                        <span className="patient-detail-info-label">Edad</span>
                                        <span className="patient-detail-info-value">{p.edad || 'No especificada'} años</span>
                                      </div>

                                      <div className="patient-mobile-accordion-item">
                                        <span className="patient-detail-info-label">Última cita</span>
                                        <span className="patient-detail-info-value">
                                          {ultimaCita ? (
                                            `${formatDateDDMMYYYY(ultimaCita.fechaCitaStr)} (${ultimaCita.horaCita} hs)`
                                          ) : p.esNuevo ? (
                                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Nuevo Paciente</span>
                                          ) : (
                                            'Ninguna registrada'
                                          )}
                                        </span>
                                      </div>

                                      <div className="patient-mobile-accordion-item" style={{ gridColumn: '1 / -1' }}>
                                        <span className="patient-detail-info-label">Próxima cita</span>
                                        <span className="patient-detail-info-value">
                                          {siguienteCita ? (
                                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                              {formatDateDDMMYYYY(siguienteCita.fechaCitaStr)} a las {siguienteCita.horaCita} hs
                                            </span>
                                          ) : (
                                            <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                              <FaExclamationTriangle size={11} /> Sin cita próxima
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="patient-mobile-accordion-actions">
                                      <button
                                        type="button"
                                        className="patient-detail-action-btn btn-primary-action"
                                        onClick={() => handleViewFicha(p)}
                                        style={{ margin: 0, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                                      >
                                        <FaFolderOpen size={13} /> Gestionar Paciente
                                      </button>
                                      <button
                                        type="button"
                                        className="patient-detail-action-btn"
                                        onClick={() => handleEliminarPaciente(p)}
                                        style={{
                                          margin: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '0.4rem',
                                          background: 'rgba(239, 68, 68, 0.08)',
                                          color: '#ef4444',
                                          border: '1px solid rgba(239, 68, 68, 0.25)',
                                          padding: '0.65rem 0.85rem',
                                          borderRadius: '10px',
                                          fontWeight: '600',
                                          fontSize: '0.85rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <FaTrashAlt size={12} /> Eliminar
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
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

                    {visiblePages.map((page, idx) =>
                      page === "..." ? (
                        <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      )
                    )}

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

        {/* Right Column: Selected Patient Details Card (Desktop >= 1200px) */}
        {selectedPaciente && (
          <div className="patient-detail-card-wrapper desktop-only-patient-detail">
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

                    <div className="patient-detail-info-item" style={{ gridColumn: 'span 2' }}>
                      <span className="patient-detail-info-label">Última cita</span>
                      <span className="patient-detail-info-value">
                        {ultimaCita ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {formatDateDDMMYYYY(ultimaCita.fechaCitaStr)} a las {ultimaCita.horaCita} hs
                            {ultimaCita.estado && ultimaCita.estado !== "Programado" && (
                              <span style={{
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: ultimaCita.estado === "Asistió" ? "rgba(16, 185, 129, 0.15)" : ultimaCita.estado === "No asistió" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.08)",
                                color: ultimaCita.estado === "Asistió" ? "#10b981" : ultimaCita.estado === "No asistió" ? "#ef4444" : "inherit",
                                fontWeight: '500'
                              }}>
                                {ultimaCita.estado}
                              </span>
                            )}
                          </span>
                        ) : selectedPaciente.esNuevo ? (
                          <span style={{
                            fontSize: '0.8rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(94, 80, 161, 0.12)',
                            color: 'var(--primary, #5e50a1)',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <FaUserPlus size={12} /> Nuevo Paciente
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
                          <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FaExclamationTriangle size={12} /> Sin cita próxima
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="patient-detail-actions-wrapper">
                    <button
                      type="button"
                      className="patient-detail-action-btn btn-primary-action hover-grow"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleViewFicha(selectedPaciente);
                      }}
                      style={{ margin: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer" }}
                    >
                      <FaFolderOpen /> Gestionar Paciente
                    </button>
                    <button
                      type="button"
                      className="patient-detail-action-btn hover-grow"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEliminarPaciente(selectedPaciente);
                      }}
                      style={{
                        marginTop: "0.65rem",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        background: "rgba(239, 68, 68, 0.08)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        padding: "0.7rem 1rem",
                        borderRadius: "10px",
                        fontWeight: "600",
                        fontSize: "0.9rem"
                      }}
                    >
                      <FaTrashAlt size={13} /> Eliminar Paciente
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
