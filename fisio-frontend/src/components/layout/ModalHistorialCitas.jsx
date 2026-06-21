import React from "react";
import { createPortal } from "react-dom";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils.js";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";

export default function ModalHistorialCitas({
  paciente,
  citas,
  onClose,
  onStatusChange,
  onReagendar
}) {
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", width: "100%" }}>
        <button 
          className="close-btn" 
          onClick={onClose} 
          aria-label="Cerrar modal"
        >
          ✕
        </button>
        
        <h4 className="logo-agendar" style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaCalendarAlt /> Historial de Citas
        </h4>
        <hr style={{ marginBottom: "1.5rem" }} />
        
        <p className="text-muted text-center mb-3" style={{ fontSize: '1rem', lineHeight: '1.5' }}>
          Paciente: <strong>{paciente?.nombres} {paciente?.apellidos}</strong><br/>
          Expediente: <strong>{paciente?.identificadorPaciente}</strong>
        </p>
        <hr style={{ marginBottom: "1.5rem" }} />

        <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {citas.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '2rem 0' }}>No hay citas registradas para este paciente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...citas]
                .sort((a, b) => new Date(`${b.fechaCitaStr}T${b.horaCita}`) - new Date(`${a.fechaCitaStr}T${a.horaCita}`))
                .map((cita) => (
                  <div 
                    key={cita._id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem', 
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--card-border)',
                      fontSize: '0.9rem' 
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {formatDateDDMMYYYY(cita.fechaCitaStr)} a las {cita.horaCita} hs
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Área: <span style={{ textTransform: 'capitalize', color: 'var(--primary)', fontWeight: '500' }}>{cita.area}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select
                        value={cita.estado || "Programado"}
                        onChange={(e) => onStatusChange(cita._id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'var(--card-bg, #1f2937)',
                          color: 'var(--text, #f3f4f6)',
                          border: '1px solid var(--card-border, #374151)',
                          cursor: 'pointer',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="Programado">📅 Programado</option>
                        <option value="Asistió">✅ Asistió</option>
                        <option value="No asistió">❌ No asistió</option>
                        <option value="Cancelado">🚫 Cancelado</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onReagendar(cita)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                      >
                        Reagendar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="save-btn" 
            style={{ background: "#64748b", margin: 0, padding: '0.5rem 1.5rem' }} 
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
