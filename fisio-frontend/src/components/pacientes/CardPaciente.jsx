import React from "react";
import { FaTrashAlt, FaExclamationCircle } from "react-icons/fa";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils";

const CardPaciente = ({ paciente, onDelete, tieneAdeudo = false, adeudoCount = 0 }) => {
  if (!paciente) return null;

  const initials = paciente.nombres ? paciente.nombres.substring(0, 1).toUpperCase() : "P";

  return (
    <div className="profile-card-modern" style={tieneAdeudo ? { border: "1.5px solid #ef4444" } : {}}>
      <div
        className="profile-header-split"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          {/* Circular Clinical Avatar */}
          <div className="profile-avatar-circle" style={tieneAdeudo ? { background: "linear-gradient(135deg, #ef4444, #dc2626)" } : {}}>
            {initials}
          </div>

          {/* Identity & Status Badges */}
          <div className="profile-identity-block">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span className="profile-badge-status">Paciente Activo</span>
              {tieneAdeudo && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "#dc2626",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em"
                  }}
                  title="Este paciente tiene un adeudo pendiente por cancelación tardía"
                >
                  <FaExclamationCircle size={11} /> Adeudo Pendiente {adeudoCount > 1 ? `(${adeudoCount})` : ""}
                </span>
              )}
            </div>
            <h2 className="profile-display-name">
              {capitalizeWords(paciente.nombres)} {capitalizeWords(paciente.apellidos)}
            </h2>
          </div>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="hover-grow"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.82rem",
              fontWeight: "600",
              transition: "all 0.2s"
            }}
            title="Eliminar paciente y todo su expediente"
          >
            <FaTrashAlt size={12} /> Eliminar Paciente
          </button>
        )}
      </div>

      {/* Grid of Key Personal Details */}
      <div className="profile-details-responsive-grid">
        <div className="profile-detail-item">
          <span className="profile-detail-label">Teléfono</span>
          <span className="profile-detail-value">{paciente.telefono || "No registrado"}</span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-label">Edad</span>
          <span className="profile-detail-value">
            {paciente.edad ? `${paciente.edad} años` : "No especificada"}
          </span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-label">Primera Cita</span>
          <span className="profile-detail-value">
            {formatDateDDMMYYYY(paciente.fechaRegistro)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardPaciente;
