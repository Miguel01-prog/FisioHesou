import React, { useEffect, useState } from "react";
import { capitalizeWords } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import { FaEye, FaCalendarAlt, FaFolderOpen, FaNotesMedical } from "react-icons/fa";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import ModalAgendarCita from "../layout/ModalAgendarCita.jsx";

export default function ListaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showModalCita, setShowModalCita] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    obtenerPacientes();
  }, []);

  const obtenerPacientes = async () => {
    try {
      const { data } = await api.get("/pacientes");
      setPacientes(data);
      localStorage.setItem("listaPacientes", JSON.stringify(data));
      // Select the first patient automatically if list is not empty
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

  return (
    <div className="auth-wrapper-content">
      <div className="patients-layout-grid has-selected" style={{ marginTop: '3%' }}>
        
        {/* Left Column: Patients Table */}
        <div className="auth-card auth-card-wide" style={{ marginTop: 0 }}>
          <h2 className="title_card" style={{ marginTop: '-10px' }}>Pacientes</h2>
          <hr />

          {cargando && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
              <LoadingSpinner size="large" />
            </div>
          )}

          {!cargando && pacientes.length === 0 && (
            <p className="text-muted">No hay pacientes registrados.</p>
          )}

          {!cargando && pacientes.length > 0 && (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="tabla-pacientes">
                <thead>
                  <tr>
                    <th>Nombre completo</th>
                    <th>Teléfono</th>
                    <th style={{ textAlign: 'center' }}>Ficha</th>
                  </tr>
                </thead>

                <tbody>
                  {pacientes.map((p) => {
                    const isSelected = selectedPaciente?.identificadorPaciente === p.identificadorPaciente;
                    return (
                      <tr 
                        key={p.identificadorPaciente} 
                        className={isSelected ? 'selected-row' : ''}
                        onClick={() => handleRowClick(p)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          {capitalizeWords(p.nombres)} {capitalizeWords(p.apellidos)}
                        </td>
                        <td>{p.telefono}</td>
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn-eye" 
                            onClick={() => handleViewFicha(p)}
                            title="Ver ficha completa"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Selected Patient Details Card */}
        {selectedPaciente && (
          <div className="patient-detail-card-wrapper">
            <div className="auth-card" style={{ marginTop: 0 }}>
              <h3 className="title_card" style={{ marginTop: '-10px' }}>Detalles del Paciente</h3>
              <hr />

              <div className="patient-detail-avatar-section">
                <div className="patient-detail-avatar">
                  {selectedPaciente.nombres ? selectedPaciente.nombres.substring(0, 1).toUpperCase() : 'P'}
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
                  <span className="patient-detail-info-label">Primera cita</span>
                  <span className="patient-detail-info-value">
                    {selectedPaciente.fechaCitaStr || selectedPaciente.fechaRegistro || 'No especificada'}
                  </span>
                </div>
              </div>

              <div className="patient-detail-actions-wrapper">
                <button 
                  className="patient-detail-action-btn btn-primary-action"
                  onClick={() => handleViewFicha(selectedPaciente)}
                >
                  <FaFolderOpen /> Ver Ficha y Notas SOAP
                </button>
                
                <button 
                  className="patient-detail-action-btn btn-secondary-action"
                  onClick={() => handleCreateHistorial(selectedPaciente)}
                >
                  <FaNotesMedical /> Registrar Historial Clínico
                </button>

                <button 
                  className="patient-detail-action-btn btn-accent-action"
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
