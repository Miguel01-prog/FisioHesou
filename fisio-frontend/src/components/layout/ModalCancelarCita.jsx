import React, { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api.js";
import { showError, showSuccess } from "../../utils/alerts.js";
import { formatDateDDMMYYYY, getHoursUntilAppointment, capitalizeWords } from "../../utils/utils.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import {
  FaExclamationTriangle,
  FaCalendarTimes,
  FaCheckCircle,
  FaClock,
  FaPhoneAlt,
  FaUser,
  FaCalendarAlt,
  FaRedoAlt
} from "react-icons/fa";

const MOTIVOS_SUGERIDOS = [
  "Solicitud del paciente",
  "Imprevisto personal o laboral",
  "Inasistencia confirmada",
  "Indicación del especialista"
];

export default function ModalCancelarCita({
  cita,
  onClose,
  onCancelSuccess,
  onReagendar = null,
  isPublic = false,
  clientId = null,
  telefonoPublico = ""
}) {
  const [motivo, setMotivo] = useState("Solicitud del paciente");
  const [detalleExtra, setDetalleExtra] = useState("");
  const [forzarExcepcion, setForzarExcepcion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [citaCanceladaData, setCitaCanceladaData] = useState(null);

  if (!cita) return null;

  const citaId = cita._id || cita.id;
  const fechaStr = cita.fechaCitaStr || cita.fechaCita || "";
  const horaStr = cita.horaCita || cita.hour || "";
  const nombrePaciente = cita.name
    ? cita.name
    : `${cita.nombres || ""} ${cita.apellidos || cita.apellidoPaterno || ""}`.trim();
  const telefono = cita.telefono || telefonoPublico || "No registrado";
  const area = cita.area || cita.treatment || "Consulta";

  const hoursRemaining = getHoursUntilAppointment(fechaStr, horaStr);
  const isLessThan24h = hoursRemaining < 24;
  const hoursFormatted = Math.max(0, Math.round(hoursRemaining * 10) / 10);

  const canSubmit = !submitting && motivo.trim().length > 0 && (!isLessThan24h || (!isPublic && forzarExcepcion));

  const handleConfirmarCancelacion = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const motivoFinal = detalleExtra.trim()
      ? `${motivo.trim()} - ${detalleExtra.trim()}`
      : motivo.trim();

    try {
      setSubmitting(true);
      let res;
      if (isPublic) {
        res = await api.put(`/citas/publica/${citaId}/cancelar`, {
          telefono: telefonoPublico || cita.telefono,
          clientId,
          motivoCancelacion: motivoFinal
        });
      } else {
        res = await api.put(`/citas/${citaId}/estado`, {
          estado: "Cancelado",
          motivoCancelacion: motivoFinal,
          forzar: isLessThan24h ? forzarExcepcion : false
        });
      }

      const updatedCita = res?.data?.cita || {
        ...cita,
        _id: citaId,
        estado: "Cancelado",
        fechaCancelacion: new Date().toISOString(),
        motivoCancelacion: motivoFinal,
        canceladoPor: isPublic ? "paciente" : "especialista"
      };

      if (onCancelSuccess) {
        onCancelSuccess(updatedCita);
      }
      if (onClose) {
        onClose();
      }
      if (isLessThan24h) {
        showSuccess(
          "Cita Cancelada con Adeudo",
          `La cita de ${nombrePaciente} fue cancelada con menos de 24 hrs. Se registró el adeudo para ser cobrado en su próxima consulta.`
        );
      } else {
        showSuccess("Cita Cancelada", `La cita de ${nombrePaciente} ha sido marcada como cancelada.`);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "No se pudo cancelar la cita.";
      showError("No se pudo cancelar", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "540px", width: "92%", padding: "1.75rem" }}
      >
        <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
          ✕
        </button>

        {/* VISTA DE CONFIRMACIÓN DE CITA CANCELADA */}
        {citaCanceladaData ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem auto",
                border: "1px solid rgba(239, 68, 68, 0.25)"
              }}
            >
              <FaCalendarTimes size={26} />
            </div>

            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(239, 68, 68, 0.14)",
                color: "#ef4444",
                fontWeight: 800,
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "0.5rem"
              }}
            >
              Cita Cancelada
            </span>

            <h3 className="title_card" style={{ margin: "0 0 0.5rem 0", fontSize: "1.3rem" }}>
              Comprobante de Cancelación
            </h3>
            <p className="text-muted" style={{ fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              El horario ha sido liberado en la agenda y el registro quedó guardado en el historial de cancelaciones.
            </p>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.04)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "12px",
                padding: "1rem 1.15rem",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
                fontSize: "0.88rem",
                marginBottom: "1.5rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Paciente:</span>
                <strong style={{ color: "var(--text-main)" }}>{capitalizeWords(nombrePaciente)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Teléfono:</span>
                <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{telefono}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Área:</span>
                <span style={{ color: "var(--primary)", fontWeight: 700, textTransform: "capitalize" }}>{area}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Fecha original de la cita:</span>
                <strong style={{ color: "var(--text-main)" }}>
                  {formatDateDDMMYYYY(fechaStr)} • {horaStr} hrs
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Fecha de cancelación:</span>
                <span style={{ color: "var(--text-main)" }}>
                  {formatDateDDMMYYYY(citaCanceladaData.fechaCancelacion || new Date())}
                </span>
              </div>
              <div style={{ borderTop: "1px dashed rgba(239, 68, 68, 0.25)", paddingTop: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "2px" }}>
                  Motivo registrado:
                </span>
                <span style={{ color: "var(--text-main)", fontWeight: 500 }}>
                  {citaCanceladaData.motivoCancelacion}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {onReagendar && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "42px" }}
                  onClick={() => {
                    onClose();
                    onReagendar(citaCanceladaData);
                  }}
                >
                  <FaRedoAlt size={13} /> Reagendar Cita
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, height: "42px", justifyContent: "center" }}
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE CANCELACIÓN CON REGLA DE 24 HRS */
          <form onSubmit={handleConfirmarCancelacion}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <FaCalendarTimes size={19} />
              </div>
              <div>
                <h4 className="logo-agendar" style={{ margin: 0, textAlign: "left" }}>
                  Cancelar Cita
                </h4>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Política de cancelación con 24 horas de anticipación
                </span>
              </div>
            </div>

            <hr style={{ marginBottom: "1rem" }} />

            {/* Datos de la cita */}
            <div
              style={{
                background: "rgba(99, 102, 241, 0.05)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                marginBottom: "1rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.6rem",
                fontSize: "0.85rem",
                textAlign: "left"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaUser size={12} style={{ color: "var(--primary)" }} />
                <span>
                  <strong>{capitalizeWords(nombrePaciente)}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaPhoneAlt size={12} style={{ color: "var(--primary)" }} />
                <span>{telefono}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaCalendarAlt size={12} style={{ color: "var(--primary)" }} />
                <span>
                  Fecha: <strong>{formatDateDDMMYYYY(fechaStr)}</strong>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaClock size={12} style={{ color: "var(--primary)" }} />
                <span>
                  Hora: <strong>{horaStr} hrs</strong>
                </span>
              </div>
            </div>

            {/* Aviso de Regla de 24 Horas */}
            {isLessThan24h ? (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                  marginBottom: "1rem",
                  textAlign: "left"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontWeight: 700, fontSize: "0.86rem", marginBottom: "4px" }}>
                  <FaExclamationTriangle size={14} />
                  <span>Anticipación menor a 24 horas ({hoursFormatted} hrs restantes)</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-main)", lineHeight: 1.45 }}>
                  {isPublic
                    ? "Las cancelaciones en línea requieren al menos 24 horas de anticipación respecto a la hora de la cita. Para cualquier emergencia, comunícate directamente con la clínica."
                    : ""}
                </p>

                {!isPublic && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "0.65rem",
                      paddingTop: "0.55rem",
                      borderTop: "1px dashed rgba(239, 68, 68, 0.25)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#dc2626",
                      cursor: "pointer"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={forzarExcepcion}
                      onChange={(e) => setForzarExcepcion(e.target.checked)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    Autorizar cancelación con cargo (generar adeudo para la siguiente cita)
                  </label>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "10px",
                  padding: "0.65rem 0.9rem",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#10b981",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textAlign: "left"
                }}
              >
                <FaCheckCircle size={14} />
                <span>Cumple con la política de 24 hrs de anticipación ({hoursFormatted} hrs antes de la cita).</span>
              </div>
            )}

            {/* Selección de Motivo */}
            {(!isLessThan24h || !isPublic) && (
              <div style={{ textAlign: "left", marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.45rem", display: "block" }}>
                  Motivo de cancelación:
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "0.75rem" }}>
                  {MOTIVOS_SUGERIDOS.map((item) => {
                    const active = motivo === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMotivo(item)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "999px",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: active ? "1px solid var(--primary)" : "1px solid var(--border-light, rgba(148,163,184,0.3))",
                          background: active ? "rgba(99, 102, 241, 0.14)" : "transparent",
                          color: active ? "var(--primary)" : "var(--text-muted)",
                          transition: "all 0.18s ease"
                        }}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  className="input"
                  rows={2}
                  placeholder="Observaciones adicionales sobre la cancelación (opcional)..."
                  value={detalleExtra}
                  onChange={(e) => setDetalleExtra(e.target.value)}
                  style={{ width: "100%", resize: "vertical", fontSize: "0.85rem" }}
                />
              </div>
            )}

            {submitting && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  padding: "0.85rem 0"
                }}
              >
                <LoadingSpinner text="Cancelando cita..." />
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="save-btn"
                style={{ background: "#64748b", margin: 0, flex: 1 }}
                onClick={onClose}
              >
                Volver
              </button>
              {(!isLessThan24h || !isPublic) && (
                <button
                  type="submit"
                  className="save-btn"
                  disabled={!canSubmit}
                  style={{
                    background: canSubmit ? "#ef4444" : "rgba(239, 68, 68, 0.4)",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    margin: 0,
                    flex: 1
                  }}
                >
                  {submitting ? "Cancelando..." : "Confirmar Cancelación"}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

