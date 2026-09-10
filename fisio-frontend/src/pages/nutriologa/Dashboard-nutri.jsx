import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api.js';
import LoadingSpinner from '../../components/layout/LoadingSpinner.jsx';
import { capitalizeWords, formatDateDDMMYYYY, obfuscateId } from '../../utils/utils.js';
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
  FiHeart,
  FiSearch,
  FiFilter,
  FiUserPlus,
  FiLock,
  FiFileText,
  FiPieChart,
  FiPhone
} from 'react-icons/fi';

export default function DashboardNutri() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas'); // 'todas', 'pendientes', 'completadas'
  const [stats, setStats] = useState({
    pacientesTotales: 0,
    citasTotales: 0,
    citasHoyCount: 0,
    completadasHoy: 0,
    planesAsignados: 0,
    alertasMetabolicas: 0
  });
  const [weeklyDistribution, setWeeklyDistribution] = useState([
    { day: 'Lun', count: 0 },
    { day: 'Mar', count: 0 },
    { day: 'Mié', count: 0 },
    { day: 'Jue', count: 0 },
    { day: 'Vie', count: 0 },
    { day: 'Sáb', count: 0 }
  ]);

  const userName = user?.name || user?.nombres || user?.nombre || 'Especialista';

  const handleAction = (patient, path) => {
    if (patient.rawPatientData) {
      localStorage.setItem("dataPaciente", JSON.stringify(patient.rawPatientData));
    } else {
      localStorage.setItem("dataPaciente", JSON.stringify({
        identificadorPaciente: patient.identificadorPaciente,
        nombres: (patient.name || '').split(' ')[0],
        apellidos: (patient.name || '').split(' ').slice(1).join(' ')
      }));
    }
    navigate(path);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch Pacientes list
      const pacRes = await api.get('/pacientes');
      const pacientesData = pacRes.data || [];

      // Fetch Citas list for nutriologa
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
      todaySessions.sort((a, b) => (a.horaCita > b.horaCita ? 1 : -1));

      // Calculate weekly appointments distribution
      const dayMap = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };
      const counts = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0 };

      citasData.forEach(c => {
        const fStr = c.fechaCitaStr || c.fechaCita;
        if (fStr) {
          const dt = new Date(fStr + 'T12:00:00');
          const dayName = dayMap[dt.getDay()];
          if (dayName && counts[dayName] !== undefined) {
            counts[dayName]++;
          }
        }
      });

      const updatedWeekly = [
        { day: 'Lun', count: counts.Lun },
        { day: 'Mar', count: counts.Mar },
        { day: 'Mié', count: counts.Mié },
        { day: 'Jue', count: counts.Jue },
        { day: 'Vie', count: counts.Vie },
        { day: 'Sáb', count: counts.Sáb }
      ];
      setWeeklyDistribution(updatedWeekly);

      // Map to patient fields
      const formattedPatients = todaySessions.map((c, index) => {
        const painScores = [6, 3, 7, 2, 5, 8];
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
          treatment: c.motivo || 'Plan metabólico & Dieta',
          hour: c.horaCita || '10:00 AM',
          pain: `${painValue}/10`,
          painLevel: painLevel,
          status: c.estado || 'Programado',
          telefono: c.telefono || rawPatientData.telefono || 'Sin teléfono',
          identificadorPaciente: c.identificadorPaciente || c.pacienteId || '1',
          rawPatientData: rawPatientData
        };
      });

      const highPainCount = formattedPatients.filter(p => p.painLevel === 'high').length;
      const completedToday = formattedPatients.filter(p => p.status === 'Completado' || p.status === 'Asistió').length;

      setPendingNotes(sinNotaList);
      setPatients(formattedPatients);
      setStats({
        pacientesTotales: pacientesData.length,
        citasTotales: citasData.length,
        citasHoyCount: formattedPatients.length,
        completadasHoy: completedToday,
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

  // Filtered patients list based on search and status
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.treatment || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (statusFilter === 'pendientes') {
        return p.status !== 'Completado' && p.status !== 'Asistió';
      }
      if (statusFilter === 'completadas') {
        return p.status === 'Completado' || p.status === 'Asistió';
      }
      return true;
    });
  }, [patients, searchTerm, statusFilter]);

  // Next upcoming pending appointment
  const nextAppointment = useMemo(() => {
    return patients.find(p => p.status !== 'Completado' && p.status !== 'Asistió' && p.status !== 'Cancelado');
  }, [patients]);

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
      setStats(prev => ({ ...prev, completadasHoy: prev.completadasHoy + 1 }));
      showSuccess('Consulta Completada', `¡Plan nutricional de ${name} actualizado con éxito!`);
    } catch (err) {
      setPatients(prev => prev.map(p => {
        if (p.id === id) return { ...p, status: 'Completado' };
        return p;
      }));
      setStats(prev => ({ ...prev, completadasHoy: prev.completadasHoy + 1 }));
      showSuccess('Consulta Completada', `Estatus actualizado a Completado.`);
    }
  };

  // Render HTML Table cell on Desktop
  const renderRow = (patient) => {
    const painBadgeClass = `pain-badge pain-${patient.painLevel}`;
    const statusBadgeClass = `status-badge status-${patient.status.replace(/\s+/g, '-').toLowerCase()}`;
    const targetId = patient.identificadorPaciente || patient._id || patient.id;

    return (
      <tr key={patient.id} className="desktop-table-row">
        <td>
          <div
            className="table-patient-identity"
            style={{ cursor: "pointer" }}
            onClick={() => handleAction(patient, `/nutriologa/paciente/${obfuscateId(targetId)}`)}
          >
            <div className="identity-avatar">{(patient.name || 'N').charAt(0).toUpperCase()}</div>
            <div>
              <span className="identity-name" style={{ borderBottom: "1px dashed rgba(99, 102, 241, 0.4)", display: "block", fontWeight: "600" }}>
                {patient.name}
              </span>
              {patient.telefono && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}>
                  <FiPhone size={11} /> {patient.telefono}
                </span>
              )}
            </div>
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
              style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', border: '1px solid rgba(139, 92, 246, 0.15)' }}
              onClick={() => handleAction(patient, `/nutriologa/paciente/${obfuscateId(targetId)}`)}
              title="Ver Ficha y Medidas"
            >
              <FiInfo /> Ficha
            </button>
            <button
              className="btn btn-primary"
              style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
              onClick={() => handleAction(patient, `/nutriologa/notas`)}
              title="Nueva Nota de Evolución"
            >
              <FiPlus /> Nota
            </button>
            {patient.status !== 'Completado' && patient.status !== 'Asistió' && (
              <button
                className="btn btn-primary"
                style={{ width: 'auto', height: '32px', fontSize: '0.8rem', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
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
    const targetId = patient.identificadorPaciente || patient._id || patient.id;

    return (
      <div key={patient.id} className="mobile-row-card glass-card">
        <div className="mobile-card-header">
          <div
            className="table-patient-identity"
            style={{ cursor: "pointer" }}
            onClick={() => handleAction(patient, `/nutriologa/paciente/${obfuscateId(targetId)}`)}
          >
            <div className="identity-avatar">{(patient.name || 'N').charAt(0).toUpperCase()}</div>
            <div>
              <span className="identity-name" style={{ borderBottom: "1px dashed rgba(99, 102, 241, 0.4)", fontWeight: "600" }}>
                {patient.name}
              </span>
            </div>
          </div>
          <span className={statusBadgeClass}>{patient.status}</span>
        </div>

        <div className="mobile-card-details">
          <div className="detail-row">
            <span className="detail-label">Consulta:</span>
            <span className="detail-value">{patient.treatment}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Hora:</span>
            <span className="detail-value-hour">
              <FiClock size={14} /> {patient.hour}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Nivel de seguimiento:</span>
            <span className={painBadgeClass}>{patient.pain}</span>
          </div>
        </div>

        <div className="mobile-card-footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            className="btn btn-primary"
            style={{ height: '36px', fontSize: '0.825rem', gap: '0.25rem', width: '100%', justifyContent: 'center' }}
            onClick={() => handleAction(patient, `/nutriologa/paciente/${obfuscateId(targetId)}`)}
          >
            <FiInfo /> Ficha Clínica
          </button>
          <button
            className="btn btn-secondary"
            style={{ height: '36px', fontSize: '0.825rem', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', width: '100%', justifyContent: 'center' }}
            onClick={() => handleAction(patient, `/nutriologa/notas`)}
          >
            <FiPlus /> Nueva Nota
          </button>
          {patient.status !== 'Completado' && patient.status !== 'Asistió' && (
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
            Cancelar Consulta
          </button>
        </div>
      </div>
    );
  };

  const todayFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const completionPct = stats.citasHoyCount > 0 
    ? Math.round((stats.completadasHoy / stats.citasHoyCount) * 100) 
    : 0;

  const maxWeeklyCount = Math.max(...weeklyDistribution.map(w => w.count), 1);

  return (
    <div className="dashboard-main-view auth-wrapper-content fade-in-up">
      
      {/* 🚀 Welcome Header Banner */}
      <header style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ color: "var(--primary)", fontSize: "1.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            🥗 Panel de Nutrición
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            ¡Bienvenida/o, <strong style={{ color: "var(--text-main)" }}>{userName}</strong>! | {capitalizeWords(todayFormatted)}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "40px", padding: "0 14px", fontSize: "0.85rem" }}
            onClick={() => navigate('/nutriologa/pacientes')}
          >
            <FiUserPlus /> Nuevo Paciente
          </button>
          <button
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "40px", padding: "0 14px", fontSize: "0.85rem" }}
            onClick={() => navigate('/nutriologa/bloquear-horario')}
          >
            <FiLock /> Bloquear Horario
          </button>
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "40px", padding: "0 18px", fontSize: "0.85rem" }}
            onClick={() => navigate('/nutriologa/agenda')}
          >
            <FiPlus /> Agendar Consulta
          </button>
        </div>
      </header>

      {loading ? (
        <div className="spinner-overlay" style={{ position: 'relative', minHeight: '200px', background: 'transparent' }}>
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          {/* ⚡ 0. Banner Destacado de Próxima Consulta */}
          {nextAppointment ? (
            <div className="glass-card" style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "16px",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
                <div style={{
                  background: "var(--success)",
                  color: "#ffffff",
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                }}>
                  <FiClock />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.2)", color: "var(--success)", padding: "2px 8px", borderRadius: "12px", fontWeight: "700", textTransform: "uppercase" }}>
                      PRÓXIMA CONSULTA NUTRICIONAL
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-main)" }}>
                      ⏰ {nextAppointment.hour}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "700", margin: "4px 0 2px 0", color: "var(--text-main)" }}>
                    {nextAppointment.name}
                  </h3>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", margin: 0 }}>
                    Consulta: <strong>{nextAppointment.treatment}</strong> {nextAppointment.telefono && ` | 📞 ${nextAppointment.telefono}`}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary"
                  style={{ height: "36px", fontSize: "0.825rem", background: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0,0,0,0.1)" }}
                  onClick={() => handleAction(nextAppointment, `/nutriologa/paciente/${obfuscateId(nextAppointment.identificadorPaciente)}`)}
                >
                  <FiInfo /> Ver Ficha Nutricional
                </button>
                <button
                  className="btn btn-primary"
                  style={{ height: "36px", fontSize: "0.825rem" }}
                  onClick={() => completeSession(nextAppointment.id, nextAppointment.name)}
                >
                  <FiCheckCircle /> Concluir Consulta
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{
              background: "rgba(16, 185, 129, 0.06)",
              border: "1px solid rgba(16, 185, 129, 0.18)",
              borderRadius: "16px",
              padding: "1rem 1.25rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <FiCheckCircle style={{ color: "var(--success)", fontSize: "1.4rem" }} />
              <div>
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-main)" }}>
                  ¡Todas las consultas nutricionales de hoy han sido atendidas!
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>
                  Puedes revisar tus planes alimenticios o actualizar medidas de expedientes.
                </span>
              </div>
            </div>
          )}

          {/* 📊 1. Metric Stats Cards Grid */}
          <div className="dashboard-grid" style={{ marginBottom: "1.75rem" }}>

            {/* Card 1: Patients Total */}
            <div className="auth-card dashboard-metric-card hover-grow" style={{ cursor: "pointer" }} onClick={() => navigate('/nutriologa/pacientes')}>
              <div className="dashboard-metric-icon" style={{ background: 'rgba(99, 102, 241, 0.08)', color: 'var(--primary)' }}>
                <FiUsers />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Expedientes Nutricionales</span>
                <strong className="dashboard-metric-value">
                  {stats.pacientesTotales}
                </strong>
                <span className="text-muted dashboard-metric-meta">Pacientes en seguimiento</span>
              </div>
            </div>

            {/* Card 2: Today Appointments & Progress */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)' }}>
                <FiCalendar />
              </div>
              <div className="dashboard-metric-info" style={{ width: "100%" }}>
                <span className="form-label dashboard-metric-label">Consultas para Hoy</span>
                <strong className="dashboard-metric-value">
                  {stats.citasHoyCount}
                </strong>
                <div style={{ marginTop: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>
                    <span>Progreso del día</span>
                    <span>{completionPct}%</span>
                  </div>
                  <div style={{ height: "6px", width: "100%", background: "rgba(0,0,0,0.06)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${completionPct}%`, background: "var(--success)", transition: "width 0.4s ease" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Completed Sessions */}
            <div className="auth-card dashboard-metric-card hover-grow">
              <div className="dashboard-metric-icon" style={{ background: 'rgba(6, 182, 212, 0.08)', color: 'var(--info)' }}>
                <FiCheckCircle />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Consultas Atendidas</span>
                <strong className="dashboard-metric-value">
                  {stats.completadasHoy} / {stats.citasHoyCount}
                </strong>
                <span className="text-muted dashboard-metric-meta">Completadas hoy</span>
              </div>
            </div>

            {/* Card 4: Planes Asignados */}
            <div className="auth-card dashboard-metric-card hover-grow" style={{ cursor: "pointer" }} onClick={() => navigate('/nutriologa/pacientes')}>
              <div className="dashboard-metric-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)' }}>
                <FiPieChart />
              </div>
              <div className="dashboard-metric-info">
                <span className="form-label dashboard-metric-label">Planes Metabólicos</span>
                <strong className="dashboard-metric-value">
                  {stats.planesAsignados}
                </strong>
                <span className="text-muted dashboard-metric-meta">Evaluaciones nutricionales</span>
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
                  <FiAlertCircle size={18} /> Pacientes Pendientes de Primera Evolución ({pendingNotes.length})
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Pacientes registrados sin nota nutricional previa
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
                        <FiPlus size={14} /> Redactar Nota
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
              <div className="glass-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <h2 className="glass-card-title" style={{ fontSize: "1.05rem", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiActivity style={{ color: "var(--primary)" }} /> Consultas Nutricionales de Hoy
                  </h2>
                  <span className="clinical-table-subtitle" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {filteredPatients.length} pacientes agendados
                  </span>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: "flex", background: "rgba(0,0,0,0.04)", padding: "3px", borderRadius: "10px", gap: "2px" }}>
                  <button
                    style={{
                      padding: "4px 12px",
                      fontSize: "0.78rem",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      background: statusFilter === 'todas' ? "var(--primary)" : "transparent",
                      color: statusFilter === 'todas' ? "#fff" : "var(--text-muted)"
                    }}
                    onClick={() => setStatusFilter('todas')}
                  >
                    Todas ({patients.length})
                  </button>
                  <button
                    style={{
                      padding: "4px 12px",
                      fontSize: "0.78rem",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      background: statusFilter === 'pendientes' ? "var(--primary)" : "transparent",
                      color: statusFilter === 'pendientes' ? "#fff" : "var(--text-muted)"
                    }}
                    onClick={() => setStatusFilter('pendientes')}
                  >
                    Pendientes ({patients.filter(p => p.status !== 'Completado' && p.status !== 'Asistió').length})
                  </button>
                  <button
                    style={{
                      padding: "4px 12px",
                      fontSize: "0.78rem",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      background: statusFilter === 'completadas' ? "var(--primary)" : "transparent",
                      color: statusFilter === 'completadas' ? "#fff" : "var(--text-muted)"
                    }}
                    onClick={() => setStatusFilter('completadas')}
                  >
                    Completadas ({stats.completadasHoy})
                  </button>
                </div>
              </div>

              {/* Realtime Search Bar */}
              <div style={{ position: "relative", marginBottom: "1.25rem" }}>
                <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre o motivo de consulta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "36px", height: "38px", fontSize: "0.85rem" }}
                />
              </div>

              {filteredPatients.length > 0 ? (
                <div className="responsive-table-container">

                  {/* Desktop HTML Table (>= 1025px) */}
                  <table className="desktop-table">
                    <thead>
                      <tr>
                        <th>Paciente / Contacto</th>
                        <th>Motivo / Tratamiento</th>
                        <th>Hora de Consulta</th>
                        <th>Seguimiento</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map(p => renderRow(p))}
                    </tbody>
                  </table>

                  {/* iPad & Mobile Cards View (<= 1024px) */}
                  <div className="mobile-table-cards">
                    {filteredPatients.map(p => renderCard(p))}
                  </div>

                </div>
              ) : (
                <div className="table-empty-state" style={{ padding: "3rem 1rem", textAlign: "center" }}>
                  <FiCalendar size={36} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
                  <p style={{ color: "var(--text-main)", fontWeight: "600", margin: "0 0 4px 0" }}>
                    {searchTerm ? "No se encontraron pacientes que coincidan con la búsqueda" : "No hay consultas nutricionales para hoy"}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    Utiliza el botón superior para agendar o revisar la agenda global.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Panel de Gestión Nutricional */}
            <div className="auth-card component-catalog-column">
              
              {/* Accesos Rápidos Nutrición */}
              <div className="glass-card-header" style={{ marginBottom: "1rem" }}>
                <h2 className="glass-card-title" style={{ fontSize: "1.05rem", fontWeight: "600", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiHeart style={{ color: "#ef4444" }} /> Herramientas Rápidas
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <button
                  className="btn btn-primary w-100"
                  style={{ justifyContent: "flex-start", padding: "0 14px", height: "42px", fontSize: "0.875rem", gap: "10px" }}
                  onClick={() => navigate('/nutriologa/pacientes')}
                >
                  <FiUsers /> Lista de Pacientes & Medidas
                </button>

                <button
                  className="btn btn-secondary w-100"
                  style={{ justifyContent: "flex-start", padding: "0 14px", height: "42px", fontSize: "0.875rem", gap: "10px" }}
                  onClick={() => navigate('/nutriologa/notas')}
                >
                  <FiFileText /> Redactar Nota / Evolución
                </button>

                <button
                  className="btn btn-secondary w-100"
                  style={{ justifyContent: "flex-start", padding: "0 14px", height: "42px", fontSize: "0.875rem", gap: "10px" }}
                  onClick={() => navigate('/nutriologa/planes')}
                >
                  <FiPieChart /> Planes Nutricionales & Dietas
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

              {/* 📈 Resumen Semanal de Consultas */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 className="catalog-subtitle" style={{ fontSize: "0.95rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>
                  Consultas por Día (Semanal)
                </h3>
                <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: "0 0 0.85rem 0" }}>
                  Frecuencia de citas nutricionales durante la semana.
                </p>

                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "90px", gap: "8px", padding: "0 4px" }}>
                  {weeklyDistribution.map(w => {
                    const barHeightPct = Math.max(Math.round((w.count / maxWeeklyCount) * 100), 12);
                    return (
                      <div key={w.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "4px" }}>
                        <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", fontWeight: "600" }}>{w.count}</span>
                        <div style={{
                          width: "100%",
                          maxWidth: "24px",
                          height: `${barHeightPct}%`,
                          background: "rgba(16, 185, 129, 0.18)",
                          borderTop: "3px solid var(--success)",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.3s ease"
                        }}></div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-main)", fontWeight: "600" }}>{w.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
