import React from "react";
import { FaInfoCircle } from "react-icons/fa";

export default function CalendarLegend({ style, showSundays = false }) {
  return (
    <div className="calendar-legend-box" style={style}>
      <div className="calendar-legend-title">
        <FaInfoCircle size={12} style={{ color: "var(--primary)" }} />
        <span>Leyenda de colores</span>
      </div>
      <div className="calendar-legend-grid">
        <div className="calendar-legend-item">
          <span className="calendar-legend-badge badge-selected" />
          <span>Día seleccionado</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-badge badge-booked" />
          <span>Con citas agendadas</span>
        </div>
        <div className="calendar-legend-item">
          <span className="calendar-legend-badge badge-blocked" />
          <span>Bloqueado / No disponible</span>
        </div>
      </div>
    </div>
  );
}
