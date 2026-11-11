import React, { useState } from "react";
import { createPortal } from "react-dom";
import { formatDateDDMMYYYY } from "../../utils/utils.js";
import { FaCalendarAlt, FaRedoAlt, FaTimesCircle } from "react-icons/fa";
import ModalCancelarCita from "./ModalCancelarCita.jsx";

export default function ModalHistorialCitas({
  paciente,
  citas,
  onClose,
  onStatusChange,
  onReagendar
}) {
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);

  return createPortal(
    <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "640px",
          width: "94%",
          padding: "1.5rem",
          pointerEvents: citaParaCancelar ? "none" : "auto"
        }}
      >
        <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
          ✕
        </button>

        <h4 className="logo-agendar" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FaCalendarAlt /> Historial de Citas
        </h4>
        <hr style={{ marginBottom: "1rem" }} />

        <p className="text-muted text-center mb-3" style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>
          Paciente: <strong>{paciente?.nombres} {paciente?.apellidos}</strong>
          <br />
          Expediente: <strong>{paciente?.identificadorPaciente}</strong>
        </p>
        <hr style={{ marginBottom: "1rem" }} />

        <div style={{ maxHeight: "380px", overflowY: "auto", paddingRight: "0.25rem" }}>
          {citas.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: "2rem 0" }}>
              No hay citas registradas para este paciente.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[...citas]
                .sort((a, b) => new Date(`${b.fechaCitaStr}T${b.horaCita}`) - new Date(`${a.fechaCitaStr}T${a.horaCita}`))
                .map((cita) => {
                  const isCancelada = cita.estado === "Cancelado";
                  return (
                    <div
                      key={cita._id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                        padding: "0.85rem",
                        borderRadius: "10px",
                        background: isCancelada ? "rgba(239, 68, 68, 0.04)" : "rgba(255, 255, 255, 0.03)",
                        border: isCancelada ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid var(--card-border)",
                        fontSize: "0.9rem"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "0.5rem"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "700", color: "var(--text-main)" }}>
                            {formatDateDDMMYYYY(cita.fechaCitaStr)} a las {cita.horaCita} hs
                          </div>
                          <div style={{ fontSize: "0.78rem", marginTop: "0.2rem" }}>
                            Área:{" "}
                            <span style={{ textTransform: "capitalize", color: "var(--primary)", fontWeight: "600" }}>
                              {cita.area}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                          <select
                            value={cita.estado || "Programado"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "Cancelado") {
                                setCitaParaCancelar(cita);
                              } else {
                                onStatusChange(cita._id, val);
                              }
                            }}
                            style={{
                              padding: "5px 8px",
                              borderRadius: "6px",
                              background: "var(--card-bg, #1f2937)",
                              color: "var(--text-main, #f3f4f6)",
                              border: "1px solid var(--card-border, #374151)",
                              cursor: "pointer",
                              outline: "none",
                              fontSize: "0.82rem",
                              fontWeight: 600
                            }}
                          >
                            <option value="Programado">Programado</option>
                            <option value="Asistió">Asistió</option>
                            <option value="No asistió">No asistió</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => onReagendar(cita)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              background: "rgba(99, 102, 241, 0.15)",
                              color: "var(--primary)",
                              border: "1px solid rgba(99, 102, 241, 0.25)",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontWeight: "600"
                            }}
                          >
                            <FaRedoAlt size={11} /> Reagendar
                          </button>

                          {!isCancelada && (
                            <button
                              type="button"
                              onClick={() => setCitaParaCancelar(cita)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                background: "rgba(239, 68, 68, 0.12)",
                                color: "#ef4444",
                                border: "1px solid rgba(239, 68, 68, 0.25)",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontWeight: "600"
                              }}
                            >
                              <FaTimesCircle size={11} /> Cancelar
                            </button>
                          )}
                        </div>
                      </div>

                      {isCancelada && (
                        <div
                          style={{
                            borderTop: "1px dashed rgba(239, 68, 68, 0.25)",
                            paddingTop: "0.45rem",
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "6px"
                          }}
                        >
                          <span>
                            <strong>Motivo:</strong> {cita.motivoCancelacion || "Cancelación registrada"}
                          </span>
                          {cita.fechaCancelacion && (
                            <span style={{ color: "#ef4444", fontWeight: 600 }}>
                              Cancelada el: {formatDateDDMMYYYY(cita.fechaCancelacion)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="save-btn"
            style={{ background: "#64748b", margin: 0, padding: "0.5rem 1.5rem" }}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>

      {citaParaCancelar && (
        <ModalCancelarCita
          cita={citaParaCancelar}
          onClose={() => setCitaParaCancelar(null)}
          onCancelSuccess={() => {
            setCitaParaCancelar(null);
            onClose();
          }}
          onReagendar={(citaCancelada) => {
            setCitaParaCancelar(null);
            onReagendar(citaCancelada);
          }}
        />
      )}
    </div>,
    document.body
  );
}
