import React from "react";
import { FaTrashAlt } from "react-icons/fa";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils";

const CardPaciente = ({ paciente, onDelete }) => {
  if (!paciente) return null;

  const initials = paciente.nombres ? paciente.nombres.substring(0, 1).toUpperCase() : "P";

  return (
    <div className="profile-card-modern">
      <div
        className="profile-header-split"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          {/* Circular Clinical Avatar */}
          <div className="profile-avatar-circle">
            {initials}
          </div>

          {/* Identity & Status Badges */}
          <div className="profile-identity-block">
            <span className="profile-badge-status">Paciente Activo</span>
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
