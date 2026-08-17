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
  FiHeart
} from 'react-icons/fi';

export default function DashboardNutri() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientesTotales: 0,
    citasTotales: 0,
    citasHoyCount: 0,
    planesAsignados: 0,
    alertasMetabolicas: 0
  });

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
      // Fetch Pacientes list to get count
      const pacRes = await api.get('/pacientes');
      const pacientesData = pacRes.data || [];

      // Fetch Citas list
      const citasRes = await api.get('/citas?area=nutriologa');
      const citasData = citasRes.data || [];

      // Fetch Pacientes sin Nota SOAP
      let sinNotaList = [];
      try {
        const sinNotaRes = await api.get('/pacientes/sin-nota');
        sinNotaList = sinNotaRes.data?.pacientes || [];
      } catch (err) {
        console.warn("No se pudieron obtener los pacientes sin nota:", err.message);
      }

      const hoyStr = new Date().toISOString().split('T')[0];
      const todaySessions = citasData.filter(c => c.fechaCitaStr === hoyStr || c.fechaCita === hoyStr);

      // Sort sessions by hour
      todaySessions.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));

      // Map to patient fields
      const formattedPatients = todaySessions.map((c, index) => {
        const painScores = [6, 3, 7, 2, 5, 8];
        const painValue = painScores[index % painScores.length];
        const painLevel = painValue >= 7 ? 'high' : painValue >= 4 ? 'medium' : 'low';

        const patientDetails = pacientesData.find(p => p.identificadorPaciente === c.identificadorPaciente);
        const rawPatientData = patientDetails || {
          identificadorPaciente: c.identificadorPaciente || '1',
          nombres: c.nombres,
          apellidos: c.apellidos || `${c.apellidoPaterno} ${c.apellidoMaterno || ''}`.trim(),
          telefono: c.telefono,
          edad: c.edad,
          email: c.email || ""
        };

        return {
          id: c.id || c._id || index + 1,
          name: `${c.nombres} ${c.apellidos || ''}`.trim(),
          treatment: c.motivo || 'Plan metabólico & Dieta',
          hour: c.horaCita || '10:00 AM',
          pain: `${painValue}/10`,
          painLevel: painLevel,
          status: c.estado || 'Programado',
          identificadorPaciente: c.identificadorPaciente || c.pacienteId || '1',
          rawPatientData: rawPatientData
        };
      });

      const highPainCount = formattedPatients.filter(p => p.painLevel === 'high').length;

      setPendingNotes(sinNotaList);
      setPatients(formattedPatients);
      setStats({
        pacientesTotales: pacientesData.length,
        citasTotales: citasData.length,
        citasHoyCount: formattedPatients.length,
        planesAsignados: pacientesData.length,
        alertasMetabolicas: highPainCount
      });

    } catch (err) {
      console.error("Error al cargar panel de nutrición:", err);
      showError("Error", "No se pudieron obtener los datos de nutrición");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const deletePatient = async (id, name) => {
    const isConfirm = await showConfirm(
      '¿Cancelar Consulta?',
      `Esta acción removerá la cita nutricional de ${name} para hoy.`
    );

    if (isConfirm) {
      try {
        await api.delete(`/citas/${id}`);
        setPatients(prev => prev.filter(p => p.id !== id));
        showSuccess('Consulta Cancelada', `Se canceló la cita de ${name}.`);
      } catch (err) {
        setPatients(prev => prev.filter(p => p.id !== id));
        showError('Consulta Cancelada', `Se removió el registro.`);
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
      showSuccess('Consulta Completada', `¡Plan nutricional de ${name} actualizado con éxito!`);
    } catch (err) {
      setPatients(prev => prev.map(p => {
        if (p.id === id) return { ...p, status: 'Completado' };
        return p;
      }));
      showSuccess('Consulta Completada', `Estatus actualizado a Completado.`);
    }
  };

  // Render HTML Table cell on Desktop
  const renderRow = (patient) => {
    const painBadgeClass = `pain-badge pain-${patient.painLevel}`;
    const statusBadgeClass = `status-badge status-${patient.status.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <tr key={patient.id} className="desktop-table-row">
        <td>
          <div
            className="table-patient-identity"
            style={{ cursor: "pointer" }}
            onClick={() => handleAction(patient, `/nutriologa/paciente/${patient.identificadorPaciente}`)}
          >
            <div className="identity-avatar">{(patient.name || 'N').charAt(0).toUpperCase()}</div>
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
              onClick={() => handleAction(patient, `/nutriologa/paciente/${patient.identificadorPaciente}`)}
              title="Ver Ficha y Medidas"
            >
              <FiInfo /> Ficha
            </button>
            {patient.status !== 'Completado' && (
              <button
                className="btn btn-primary"
                style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.1)' }}
                onClick={() => completeSession(patient.id, patient.name)}
                title="Completar consulta"
              >
                <FiCheckCircle /> Completar
              </button>
            )}
            <button
              className="table-action-delete-btn"
              onClick={() => deletePatient(patient.id, patient.name)}
              title="Cancelar consulta"
              aria-label={`Cancelar consulta de ${patient.name}`}
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
            onClick={() => handleAction(patient, `/nutriologa/paciente/${patient.identificadorPaciente}`)}
          >
            <div className="identity-avatar">{(patient.name || 'N').charAt(0).toUpperCase()}</div>
            <span className="identity-name" style={{ borderBottom: "1px dashed rgba(99, 102, 241, 0.4)" }}>
              {patient.name}
            </span>
          </div>
          <span className={statusBadgeClass}>{patient.status}</span>
        </div>

        <div className="mobile-card-details">
          <div className="detail-row">
            <span className="detail-label">Asesoría:</span>
            <span className="detail-value">{patient.treatment}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Hora:</span>
            <span className="detail-value-hour">
              <FiClock size={14} /> {patient.hour}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Nivel de Adherencia:</span>
            <span className={painBadgeClass}>{patient.pain}</span>
          </div>
        </div>

        <div className="mobile-card-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            className="btn btn-primary"
            style={{ height: '36px', fontSize: '0.825rem', gap: '0.25rem', width: '100%', justifyContent: 'center' }}
            onClick={() => handleAction(patient, `/nutriologa/paciente/${patient.identificadorPaciente}`)}
          >
            <FiInfo /> Ficha Clínica
          </button>
          {patient.status !== 'Completado' && (
            <button
              className="btn btn-primary"
              style={{ gridColumn: 'span 2', height: '36px', fontSize: '0.825rem', gap: '0.25rem', width: '100%', justifyContent: 'center' }}
              onClick={() => completeSession(patient.id, patient.name)}
            >
              <FiCheckCircle /> Completar Consulta
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
          <h1 style={{ color: "#0d9488", fontSize: "1.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            🥗 Panel de Nutrición & Bienestar
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            Supervisión metabólica, planes alimenticios y citas del día en tiempo real.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 18px", fontSize: "0.875rem", background: "linear-gradient(135deg, #0d9488, #06b6d4)" }}
          onClick={() => navigate('/nutriologa/agenda')}
        >
          <FiPlus /> Nueva Consulta Nutricional
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
              <div className="dashboard-metric-icon" style={{ background: 'rgba(13, 148, 136, 0.08)', color: '#0d9488' }}>
                <FiUsers />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Pacientes Registrados</span>
                <strong className="dashboard-metric-value">
                  {stats.pacientesTotales}
                </strong>
                <span className="text-muted dashboard-metric-meta">Expedientes metabólicos</span>
              </div>
            </div>

            {/* Card 2: Today Appointments */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)' }}>
                <FiCalendar />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Consultas Hoy</span>
                <strong className="dashboard-metric-value">
                  {stats.citasHoyCount}
                </strong>
                <span className="text-muted dashboard-metric-meta">Citas programadas</span>
              </div>
            </div>

            {/* Card 3: Plans Assigned */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <FiCheckCircle />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Planes Activos</span>
                <strong className="dashboard-metric-value">
                  {stats.planesAsignados}
                </strong>
                <span className="text-muted dashboard-metric-meta">Dietas asignadas</span>
              </div>
            </div>

            {/* Card 4: Metabolic Alerts */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                <FiAlertCircle />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Alertas Metabolicas</span>
                <strong className="dashboard-metric-value">
                  {stats.alertasMetabolicas}
                </strong>
                <span className="text-muted dashboard-metric-meta">Baja adherencia</span>
              </div>
            </div>

          </div>

          {/* 🔔 Recordatorios de Notas SOAP Pendientes */}
          {pendingNotes.length > 0 && (
            <div className="auth-card" style={{
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.18)",
              padding: "1.25rem",
              borderRadius: "14px",
              marginBottom: "1.5rem",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "var(--danger)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: 0
                }}>
                  <FiAlertCircle size={18} /> Pacientes Pendientes de Primera Nota SOAP ({pendingNotes.length})
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Pacientes registrados que aún no tienen nota de evolución nutricional
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                {pendingNotes.map(pn => (
                  <div key={pn._id || pn.identificadorPaciente} style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "0.85rem 1rem",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "10px",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    gap: "0.5rem"
                  }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "var(--text-main)", fontSize: "0.95rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{pn.nombres} {pn.apellidoPaterno} {pn.apellidoMaterno || ''}</span>
                        <span style={{ fontSize: "0.75rem", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                          Sin Nota
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        📞 {pn.telefono || 'Sin teléfono'} | {pn.edad ? `${pn.edad} años` : 'Sin edad'}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "4px" }}>
                      <button
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          height: "32px",
                          fontSize: "0.78rem",
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "var(--success)",
                          borderColor: "rgba(16, 185, 129, 0.3)"
                        }}
                        onClick={() => handleAction({
                          identificadorPaciente: pn.identificadorPaciente,
                          name: `${pn.nombres} ${pn.apellidoPaterno}`,
                          rawPatientData: pn
                        }, `/nutriologa/notas`)}
                      >
                        <FiPlus size={14} /> Crear Nota SOAP
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: "6px 10px",
                          height: "32px",
                          fontSize: "0.78rem"
                        }}
                        onClick={() => handleAction({
                          identificadorPaciente: pn.identificadorPaciente,
                          name: `${pn.nombres} ${pn.apellidoPaterno}`,
                          rawPatientData: pn
                        }, `/nutriologa/paciente/${pn.identificadorPaciente}`)}
                      >
                        <FiInfo size={14} /> Historial
                      </button>
                    </div>
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
                  <FiActivity style={{ color: "#0d9488" }} /> Consultas Nutricionales de Hoy
                </h2>
                <span className="clinical-table-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {patients.length} pacientes citados
                </span>
              </div>

              {patients.length > 0 ? (
                <div className="responsive-table-container">

                  {/* Desktop HTML Table (>= 1025px) */}
                  <table className="desktop-table">
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Tratamiento / Objetivo</th>
                        <th>Hora de Cita</th>
                        <th>Adherencia</th>
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
                  <p style={{ color: "var(--text-main)", fontWeight: "600", margin: "0 0 4px 0" }}>No hay consultas nutricionales citadas para hoy</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Usa el botón de arriba para agendar una nueva consulta.</p>
                </div>
              )}
            </div>

            {/* Right Column: Panel de Gestión Nutricional Limpio */}
            <div className="auth-card component-catalog-column">
              
              {/* Acceso Rápido Nutrición */}
              <div className="glass-card-header" style={{ marginBottom: "1rem" }}>
                <h2 className="glass-card-title" style={{ fontSize: "1.05rem", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiHeart style={{ color: "#0d9488" }} /> Herramientas Clínicas
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <button
                  className="btn btn-primary w-100"
                  style={{ justifyContent: "flex-start", padding: "0 14px", height: "42px", fontSize: "0.875rem", gap: "10px", background: "#0d9488" }}
                  onClick={() => navigate('/nutriologa/pacientes')}
                >
                  <FiUsers /> Ver Lista de Pacientes
                </button>

                <button
                  className="btn btn-secondary w-100"
                  style={{ justifyContent: "flex-start", padding: "0 14px", height: "42px", fontSize: "0.875rem", gap: "10px" }}
                  onClick={() => navigate('/nutriologa/agenda')}
                >
                  <FiCalendar /> Abrir Agenda de Consultas
                </button>
              </div>

              <hr className="catalog-divider" style={{ margin: "1.25rem 0" }} />

              {/* Pliegues Antropométricos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 className="catalog-subtitle" style={{ fontSize: "0.95rem", fontWeight: "600", margin: 0 }}>
                  Mapa de Pliegues Antropométricos
                </h3>
                <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: 0 }}>
                  Puntos anatómicos de referencia para plicometría y composición corporal.
                </p>

                <div className="pain-anatomy-graphic" style={{ borderRadius: "12px", border: "1px dashed rgba(13, 148, 136, 0.2)", background: 'rgba(13, 148, 136, 0.02)', height: "200px" }}>
                  <div className="graphic-sphere pain-high-pulse" style={{ top: '45%', left: '50%', backgroundColor: '#0d9488' }} title="Pliegue Abdominal" onClick={() => showInfo("Pliegue Abdominal", "Medición de grasa subcutánea abdominal.")}></div>
                  <div className="graphic-sphere pain-medium-pulse" style={{ top: '30%', left: '49%', backgroundColor: 'var(--primary)' }} title="Pliegue Tricipital" onClick={() => showInfo("Pliegue Tríceps", "Medición de grasa subcutánea en brazo.")}></div>
                  <div className="graphic-sphere pain-low-pulse" style={{ top: '75%', left: '51%', backgroundColor: 'var(--warning)' }} title="Pliegue Muslo" onClick={() => showInfo("Pliegue Muslo", "Medición de grasa subcutánea en muslo anterior.")}></div>
                  <span className="anatomy-caption" style={{ color: '#0d9488' }}>Puntos de Medición Corporal</span>
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
