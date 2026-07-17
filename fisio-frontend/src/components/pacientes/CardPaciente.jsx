import React from "react";
import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils";

const CardPaciente = ({ paciente }) => {
  if (!paciente) return null;

  const initials = paciente.nombres ? paciente.nombres.substring(0, 1).toUpperCase() : "P";

  return (
    <div className="profile-card-modern">
      <div className="profile-header-split">
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

      {/* Grid of Key Personal Details */}
      <div className="profile-details-responsive-grid">
        <div className="profile-detail-item">
          <span className="profile-detail-label">Teléfono</span>
          <span className="profile-detail-value">{paciente.telefono || "No registrado"}</span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-label">Edad</span>
          <span className="profile-detail-value">{paciente.edad || "No especificada"} años</span>
        </div>

        <div className="profile-detail-item">
          <span className="profile-detail-label">ID Paciente</span>
          <span className="profile-detail-value" style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
            {paciente.identificadorPaciente}
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