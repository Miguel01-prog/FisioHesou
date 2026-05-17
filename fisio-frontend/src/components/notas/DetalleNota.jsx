import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api.js";
import { formatDateDDMMYYYY } from "../../utils/utils.js";
import LoadingSpinner from "../layout/LoadingSpinner";

export default function NotaDetalle() {
  const { id } = useParams();  // ID de la nota
  const navigate = useNavigate();
  const [nota, setNota] = useState(null);

  useEffect(() => {
    const fetchNota = async () => {
      try {
        const { data } = await api.get(`/notas/${id}`);
        setNota(data);
      } catch (err) {
        console.error("Error al cargar la nota:", err);
      }
    };

    fetchNota();
  }, [id]);

  if (!nota) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card auth-card-detail">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="title_card" style={{ marginTop: "-10px" }}>
              Detalle Nota SOAP
            </h2>

            <button
              className="save-btn"
              style={{ marginTop: "-20px" }}
              onClick={() => navigate(-1)}
            >
              ⬅ Volver
            </button>
        </div>

        <hr />

        <form className="form">
            <div className="form-row">
              <div className="col">
                <label className="form-label">ID Nota: <strong>{nota.idHistoricoFk || nota._id}</strong></label>
              </div>

              <div className="col">
                <label className="form-label">Mes-Año: <strong>{nota.mesAñoNota}</strong></label> 
              </div>

              <div className="col">
                <label className="form-label">Fecha: <strong>{formatDateDDMMYYYY(nota.fechaNota || nota.createdAt)}</strong></label> 
              </div>
            </div>

            <div className="form-row">
              <div className="col">
                <label className="form-label">Contenido general:</label>
                <textarea
                  className="textarea"
                  value={nota.contenidoNota || "No especificado"}
                  disabled
                />
              </div>
            </div>

            <h3 style={{ marginTop: "10px", color: "#6c757d" }}>Nota SOAP</h3>

            <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
              <div className="col" style={{ flex: 1 }}>
                <label className="form-label">S (Subjetivo):</label>
                <textarea
                  className="textarea"
                  value={nota.S || ""}
                  disabled
                />
              </div>

              <div className="col" style={{ flex: 1 }}>
                <label className="form-label">O (Objetivo):</label>
                <textarea
                  className="textarea"
                  value={nota.O || ""}
                  disabled
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
              <div className="col" style={{ flex: 1 }}>
                <label className="form-label">A (Análisis):</label>
                <textarea
                  className="textarea"
                  value={nota.A || ""}
                  disabled
                />
              </div>

              <div className="col" style={{ flex: 1 }}>
                <label className="form-label">P (Plan):</label>
                <textarea
                  className="textarea"
                  value={nota.P || ""}
                  disabled
                />
              </div>
            </div>
        </form>
      </div>
    </div>
  );
}
