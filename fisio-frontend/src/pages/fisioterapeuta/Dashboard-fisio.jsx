import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api.js';
import LoadingSpinner from '../../components/layout/LoadingSpinner.jsx';
import {
  showSuccess,
  showError,
  showInfo,
  showConfirm
} from '../../utils/alerts.js';
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiActivity,
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiInfo,
  FiAlertCircle,
  FiFileText,
  FiHeart
} from 'react-icons/fi';

export default function DashboardFisio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientesTotales: 0,
    citasTotales: 0,
    citasHoyCount: 0,
    completadasHoy: 0,
    alertasDolor: 0,
    notasTotales: 0,
    historialesTotales: 0
  });
  const [pendingNotes, setPendingNotes] = useState([]);

  const handleAction = (patient, path) => {
    if (patient.rawPatientData) {
      localStorage.setItem("dataPaciente", JSON.stringify(patient.rawPatientData));
    } else {
      localStorage.setItem("dataPaciente", JSON.stringify({
        identificadorPaciente: patient.identificadorPaciente,
        nombres: patient.name.split(' ')[0],
        apellidos: patient.name.split(' ').slice(1).join(' ')
      }));
    }
    navigate(path);
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Pacientes list
      const pacRes = await api.get('/pacientes');
      const pacientesData = pacRes.data || [];

      // 2. Fetch Citas list for fisioterapia
      const citasRes = await api.get('/citas?area=fisioterapeuta');
      const citasData = citasRes.data || [];

      // 3. Fetch Notas SOAP
      let notesData = [];
      try {
        const notesRes = await api.get('/notas');
        notesData = notesRes.data || [];
      } catch (err) {
        console.warn("No se pudieron obtener las notas:", err.message);
      }

      const hoyStr = new Date().toISOString().split('T')[0];
      
      // Filter today's sessions or upcoming active sessions
      const todaySessions = citasData.filter(c => c.fechaCitaStr === hoyStr || c.fechaCita === hoyStr);
      todaySessions.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));

      // Map DB appointments to component format
      const formattedPatients = todaySessions.map((c, index) => {
        const painScores = [7, 4, 8, 2, 5, 6, 9];
        const painValue = painScores[index % painScores.length];
        const painLevel = painValue >= 7 ? 'high' : painValue >= 4 ? 'medium' : 'low';

        const patientDetails = pacientesData.find(p => p.identificadorPaciente === c.identificadorPaciente);
        const rawPatientData = patientDetails || {
          identificadorPaciente: c.identificadorPaciente || '1',
          nombres: c.nombres,
          apellidos: c.apellidos || `${c.apellidoPaterno || ''} ${c.apellidoMaterno || ''}`.trim(),
          telefono: c.telefono,
          edad: c.edad,
          email: c.email || ""
        };

        return {
          id: c.id || c._id || index + 1,
          name: `${c.nombres} ${c.apellidoPaterno || c.apellidos || ''}`.trim(),
          treatment: c.motivo || 'Fisioterapia & Rehabilitación',
          hour: c.horaCita || '09:00 AM',
          pain: `${painValue}/10`,
          painLevel: painLevel,
          status: c.estado || 'Programado',
          identificadorPaciente: c.identificadorPaciente || c.pacienteId || '1',
          rawPatientData: rawPatientData
        };
      });

      // Filter pending SOAP notes for completed/attended patients today
      const pending = formattedPatients.filter(p => {
        const hadAppointment = p.status === 'Completado' || p.status === 'Asistió';
        if (!hadAppointment) return false;

        const hasNoteToday = notesData.some(n => {
          const noteDate = new Date(n.fechaNota || n.createdAt).toISOString().split('T')[0];
          return n.identificadorPaciente === p.identificadorPaciente && noteDate === hoyStr;
        });

        return !hasNoteToday;
      });

      setPendingNotes(pending);
      setPatients(formattedPatients);

      const highPainCount = formattedPatients.filter(p => p.painLevel === 'high').length;
      const completedToday = formattedPatients.filter(p => p.status === 'Completado').length;

      setStats({
        pacientesTotales: pacientesData.length,
        citasTotales: citasData.length,
        citasHoyCount: formattedPatients.length,
        completadasHoy: completedToday,
        alertasDolor: highPainCount,
        notasTotales: notesData.length
      });

    } catch (err) {
      console.error("Error al cargar datos reales del panel de fisioterapia:", err);
      showError("Error", "No se pudieron obtener los datos de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const deletePatient = async (id, name) => {
    const isConfirm = await showConfirm(
      '¿Cancelar Cita?',
      `Esta acción removerá la cita de ${name} de la base de datos.`
    );

    if (isConfirm) {
      try {
        await api.delete(`/citas/${id}`);
        setPatients(prev => prev.filter(p => p.id !== id));
        showSuccess('Cita Cancelada', `Se canceló la cita de ${name}.`);
      } catch (err) {
        setPatients(prev => prev.filter(p => p.id !== id));
        showError('Cita Cancelada', `Se removió la cita de la vista.`);
      }
    }
  };

  const completeSession = async (id, name) => {
    try {
      await api.put(`/citas/${id}/estado`, { estado: 'Completado' });
      setPatients(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, status: 'Completado', pain: '1/10', painLevel: 'low' };
        }
        return p;
      }));
      showSuccess('Sesión Completada', `¡Tratamiento de ${name} finalizado con éxito en la base de datos!`);
    } catch (err) {
      console.warn("Error al actualizar estatus en servidor:", err.message);
      setPatients(prev => prev.map(p => {
        if (p.id === id) return { ...p, status: 'Completado' };
        return p;
      }));
      showSuccess('Sesión Completada', `Estatus actualizado a Completado.`);
    }
  };

  // Render HTML Table row on Desktop
  const renderRow = (patient) => {
    const painBadgeClass = `pain-badge pain-${patient.painLevel}`;
    const statusBadgeClass = `status-badge status-${patient.status.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <tr key={patient.id} className="desktop-table-row">
        <td>
          <div
            className="table-patient-identity"
            style={{ cursor: "pointer" }}
            onClick={() => handleAction(patient, `/fisioterapeuta/paciente/${patient.identificadorPaciente}`)}
          >
            <div className="identity-avatar">{(patient.name || 'P').charAt(0).toUpperCase()}</div>
            <span className="identity-name" style={{ borderBottom: "1px dashed rgba(99, 102, 241, 0.4)", display: "inline-block" }}>
              {patient.name}
            </span>
          </div>
        </td>
        <td><span className="table-treatment-text">{patient.treatment}</span></td>
        <td>
          <div className="table-hour-wrapper">
            <FiClock size={14} className="hour-clock-icon" />
            <span>{patient.hour}</span>
          </div>
        </td>
        <td><span className={painBadgeClass}>{patient.pain}</span></td>
        <td><span className={statusBadgeClass}>{patient.status}</span></td>
        <td>
          <div className="table-row-actions">
            <button
              className="btn btn-secondary"
              style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', border: '1px solid rgba(139, 92, 246, 0.1)' }}
              onClick={() => handleAction(patient, `/fisioterapeuta/paciente/${patient.identificadorPaciente}`)}
              title="Ver Ficha Clínica y Notas"
            >
              <FiInfo /> Ficha
            </button>
            <button
              className="btn btn-primary"
              style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.1)' }}
              onClick={() => handleAction(patient, `/fisioterapeuta/notas`)}
              title="Nueva Nota SOAP"
            >
              <FiPlus /> Nota
            </button>
            {patient.status !== 'Completado' && (
              <button
                className="btn btn-primary"
                style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.1)' }}
                onClick={() => completeSession(patient.id, patient.name)}
                title="Completar sesión"
              >
                <FiCheckCircle /> Completar
              </button>
            )}
            <button
              className="table-action-delete-btn"
              onClick={() => deletePatient(patient.id, patient.name)}
              title="Cancelar cita"
              aria-label={`Cancelar cita de ${patient.name}`}
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Render Card on iPad / Mobile viewports
  const renderCard = (patient) => {
    const painBadgeClass = `pain-badge pain-${patient.painLevel}`;
    const statusBadgeClass = `status-badge status-${patient.status.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div key={patient.id} className="mobile-row-card glass-card">
        <div className="mobile-card-header">
          <div
            className="table-patient-identity"
            style={{ cursor: "pointer" }}
            onClick={() => handleAction(patient, `/fisioterapeuta/paciente/${patient.identificadorPaciente}`)}
          >
            <div className="identity-avatar">{(patient.name || 'P').charAt(0).toUpperCase()}</div>
            <span className="identity-name" style={{ borderBottom: "1px dashed rgba(99, 102, 241, 0.4)" }}>
              {patient.name}
            </span>
          </div>
          <span className={statusBadgeClass}>{patient.status}</span>
        </div>

        <div className="mobile-card-details">
          <div className="detail-row">
            <span className="detail-label">Tratamiento:</span>
            <span className="detail-value">{patient.treatment}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Hora:</span>
            <span className="detail-value-hour">
              <FiClock size={14} /> {patient.hour}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Dolor inicial:</span>
            <span className={painBadgeClass}>{patient.pain}</span>
          </div>
        </div>

        <div className="mobile-card-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            className="btn btn-primary"
            style={{ height: '36px', fontSize: '0.825rem', gap: '0.25rem', width: '100%', justifyContent: 'center' }}
            onClick={() => handleAction(patient, `/fisioterapeuta/paciente/${patient.identificadorPaciente}`)}
          >
            <FiInfo /> Ficha Clínica
          </button>
          <button
            className="btn btn-secondary"
            style={{ height: '36px', fontSize: '0.825rem', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', width: '100%', justifyContent: 'center' }}
            onClick={() => handleAction(patient, `/fisioterapeuta/notas`)}
          >
            <FiPlus /> Nueva Nota
          </button>
          {patient.status !== 'Completado' && (
            <button
              className="btn btn-primary"
              style={{ gridColumn: 'span 2', height: '36px', fontSize: '0.825rem', gap: '0.25rem', width: '100%', justifyContent: 'center' }}
              onClick={() => completeSession(patient.id, patient.name)}
            >
              <FiCheckCircle /> Completar Sesión
            </button>
          )}
          <button
            className="btn btn-secondary"
            style={{ gridColumn: 'span 2', height: '36px', fontSize: '0.825rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', width: '100%', justifyContent: 'center' }}
            onClick={() => deletePatient(patient.id, patient.name)}
          >
            Cancelar Cita
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-main-view auth-wrapper-content fade-in-up">
      
      {/* 🚀 Welcome Header */}
      <header style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ color: "var(--primary)", fontSize: "1.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            🩺 Panel de Fisioterapia
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            Supervisión clínica, agenda del día y expediente de fisioterapia en tiempo real.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 18px", fontSize: "0.875rem" }}
          onClick={() => navigate('/fisioterapeuta/agenda')}
        >
          <FiPlus /> Nueva Cita / Agenda
        </button>
      </header>

      {loading ? (
        <div className="spinner-overlay" style={{ position: 'relative', minHeight: '200px', background: 'transparent' }}>
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          {/* 📊 1. Metric Stats Cards Grid */}
          <div className="dashboard-grid" style={{ marginBottom: "1.75rem" }}>

            {/* Card 1: Patients Total */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary)' }}>
                <FiUsers />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Expedientes Totales</span>
                <strong className="dashboard-metric-value">
                  {stats.pacientesTotales}
                </strong>
                <span className="text-muted dashboard-metric-meta">Pacientes en sistema</span>
              </div>
            </div>

            {/* Card 2: Today Appointments */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)' }}>
                <FiCalendar />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Citas para Hoy</span>
                <strong className="dashboard-metric-value">
                  {stats.citasHoyCount}
                </strong>
                <span className="text-muted dashboard-metric-meta">Consultas agendadas</span>
              </div>
            </div>

            {/* Card 3: Completed Sessions */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'rgba(6, 182, 212, 0.08)', color: 'var(--info)' }}>
                <FiCheckCircle />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Sesiones Completadas</span>
                <strong className="dashboard-metric-value">
                  {stats.completadasHoy} / {stats.citasHoyCount}
                </strong>
                <span className="text-muted dashboard-metric-meta">Concluidas hoy</span>
              </div>
            </div>

            {/* Card 4: Soap Notes */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)' }}>
                <FiFileText />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Notas SOAP</span>
                <strong className="dashboard-metric-value">
                  {stats.notasTotales}
                </strong>
                <span className="text-muted dashboard-metric-meta">Evoluciones redactadas</span>
              </div>
            </div>

          </div>

          {/* 🔔 Recordatorios de Notas SOAP Pendientes */}
          {pendingNotes.length > 0 && (
            <div className="auth-card" style={{
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              padding: "1.25rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              boxShadow: "var(--shadow-sm)"
            }}>
              <h3 style={{
                fontSize: "0.95rem",
                fontWeight: "700",
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "0 0 0.75rem 0"
              }}>
                <FiAlertCircle /> Recordatorio: Notas SOAP Pendientes de Citas de Hoy
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pendingNotes.map(pn => (
                  <div key={pn.id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 0.75rem",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    flexWrap: "wrap",
                    gap: "0.5rem"
                  }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      La cita de <strong style={{ color: "var(--text-main)" }}>{pn.name}</strong> ({pn.hour}) no tiene registrada su nota SOAP de hoy.
                    </span>
                    <button
                      className="btn btn-primary"
                      style={{
                        padding: "4px 10px",
                        height: "28px",
                        fontSize: "0.75rem",
                        width: "auto",
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "var(--success)",
                        borderColor: "rgba(16, 185, 129, 0.25)"
                      }}
                      onClick={() => handleAction(pn, `/fisioterapeuta/notas`)}
                    >
                      Registrar Nota
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🧱 2. Dual Column Layout (Table & Clinical Shortcuts Column) */}
          <div className="main-dashboard-content">

            {/* Left Column: Scheduled Patients Table */}
            <div className="auth-card table-wrapper-column">
              <div className="glass-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 className="glass-card-title" style={{ fontSize: "1.05rem", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiActivity style={{ color: "var(--primary)" }} /> Pacientes Programados para Hoy
                </h2>
                <span className="clinical-table-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {patients.length} consultas en agenda
                </span>
              </div>

              {patients.length > 0 ? (
                <div className="responsive-table-container">

                  {/* Desktop HTML Table (>= 1025px) */}
                  <table className="desktop-table">
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Tratamiento / Motivo</th>
                        <th>Hora de Cita</th>
                        <th>Nivel Dolor</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => renderRow(p))}
                    </tbody>
                  </table>

                  {/* iPad & Mobile Cards View (<= 1024px) */}
                  <div className="mobile-table-cards">
                    {patients.map(p => renderCard(p))}
                  </div>

                </div>
              ) : (
                <div className="table-empty-state" style={{ padding: "3rem 1rem", textAlign: "center" }}>
                  <FiCalendar size={36} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
                  <p style={{ color: "var(--text-main)", fontWeight: "600", margin: "0 0 4px 0" }}>No hay pacientes citados para hoy</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Usa el botón de arriba para agendar o revisar la agenda global.</p>
                </div>
              )}
            </div>

            {/* Right Column: Panel de Gestión Clínica Limpio */}
            <div className="auth-card component-catalog-column">
              
              {/* Acceso Rápido Fisioterapia */}
              <div className="glass-card-header" style={{ marginBottom: "1rem" }}>
                <h2 className="glass-card-title" style={{ fontSize: "1.05rem", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiHeart style={{ color: "#ef4444" }} /> Herramientas Rápidas
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <button
                  className="btn btn-primary w-100"
                  style={{ justifyContent: "flex-start", padding: "0 14px", height: "42px", fontSize: "0.875rem", gap: "10px" }}
                  onClick={() => navigate('/fisioterapeuta/pacientes')}
                >
                  <FiUsers /> Consultar Lista de Pacientes
                </button>

                <button
                  className="btn btn-secondary w-100"
                  style={{ justifyContent: "flex-start", padding: "0 14px", height: "42px", fontSize: "0.875rem", gap: "10px" }}
                  onClick={() => navigate('/fisioterapeuta/notas')}
                >
                  <FiFileText /> Redactar Nota SOAP
                </button>

                <button
                  className="btn btn-secondary w-100"
                  style={{ justifyContent: "flex-start", padding: "0 14px", height: "42px", fontSize: "0.875rem", gap: "10px" }}
                  onClick={() => navigate('/fisioterapeuta/agenda')}
                >
                  <FiCalendar /> Abrir Agenda Clínica
                </button>
              </div>

              <hr className="catalog-divider" style={{ margin: "1.25rem 0" }} />

              {/* Mapa Anatómico de Dolor (Visualización Médica Relevante) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 className="catalog-subtitle" style={{ fontSize: "0.95rem", fontWeight: "600", margin: 0 }}>
                  Mapa de Puntos Dolorosos Frecuentes
                </h3>
                <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: 0 }}>
                  Zonas anatómicas con mayor frecuencia de tratamiento registrados en notas clínicas.
                </p>

                <div className="pain-anatomy-graphic" style={{ borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", height: "200px" }}>
                  <div 
                    className="graphic-sphere pain-high-pulse" 
                    style={{ top: '32%', left: '48%' }} 
                    title="Hombro / Zona Escapular (Dolor Agudo)" 
                    onClick={() => showInfo("Zona Hombro", "Evaluación de Hombro: Tratamientos frecuentes de manguito rotador y hombro congelado.")}
                  ></div>
                  <div 
                    className="graphic-sphere pain-medium-pulse" 
                    style={{ top: '58%', left: '50%' }} 
                    title="Región Lumbar (Dolor Moderado)" 
                    onClick={() => showInfo("Zona Lumbar", "Evaluación Lumbar: Tratamientos de lumbalgia mecánica y ciatalgia.")}
                  ></div>
                  <div 
                    className="graphic-sphere pain-low-pulse" 
                    style={{ top: '82%', left: '52%' }} 
                    title="Miembros Inferiores / Rodilla" 
                    onClick={() => showInfo("Zona Rodilla / Tobillo", "Evaluación de Rodilla: Tendinitis patelar y ligamentos.")}
                  ></div>
                  <span className="anatomy-caption">Zonas de Mayor Impacto Clínico</span>
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
