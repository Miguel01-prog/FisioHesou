import React from 'react';
import './Table.css';

/**
 * Super Responsive Table Component
 * Automatically transforms from HTML Table on desktop to highly readable Cards on iPad and mobiles.
 * 
 * @param {Array<string>} headers - Headers of the table
 * @param {Array<object>} data - Row objects to render
 * @param {Function} renderRow - Function rendering desktop cells: (item, index) => <td>...</td>
 * @param {Function} renderCard - Function rendering tablet/mobile card view: (item, index) => <div className="card-fields">...</div>
 * @param {string} emptyMessage - Displayed when there's no data
 */
export default function Table({
  headers = [],
  data = [],
  renderRow,
  renderCard,
  emptyMessage = "No hay información disponible.",
  className = ""
}) {
  if (!data || data.length === 0) {
    return (
      <div className="table-empty-state glass-card">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`responsive-table-container ${className}`}>
      {/* 🖥️ DESKTOP VIEW (Visible above 1024px) */}
      <table className="desktop-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="desktop-table-row">
              {renderRow(item, index)}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 📱 IPAD & MOBILE CARDS VIEW (Visible <= 1024px) */}
      <div className="mobile-table-cards">
        {data.map((item, index) => (
          <div key={index} className="mobile-row-card glass-card">
            {renderCard(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
