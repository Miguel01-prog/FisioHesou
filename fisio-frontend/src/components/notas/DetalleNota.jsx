import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api.js";
import { formatDateDDMMYYYY } from "../../utils/utils.js";
import LoadingSpinner from "../layout/LoadingSpinner";
import { showSuccess, showError } from "../../utils/alerts.js";
import { FaEdit, FaSave, FaTimes, FaArrowLeft } from "react-icons/fa";

export default function NotaDetalle() {
  const { id } = useParams(); // ID de la nota
  const navigate = useNavigate();
  const [nota, setNota] = useState(null);
  const [backupNota, setBackupNota] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNota = async () => {
      try {
        const { data } = await api.get(`/notas/${id}`);
        setNota(data);
        setBackupNota(JSON.parse(JSON.stringify(data)));
      } catch (err) {
        console.error("Error al cargar la nota:", err);
      }
    };

    fetchNota();
  }, [id]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const { data } = await api.put(`/notas/${id}`, nota);
      const updated = data?.nota || data || nota;
      setNota(updated);
      setBackupNota(JSON.parse(JSON.stringify(updated)));
      setIsEditing(false);
      showSuccess("Nota actualizada", "Los cambios en la nota SOAP se guardaron correctamente.");
    } catch (err) {
      console.error("Error al actualizar la nota:", err);
      showError("Error", err.response?.data?.message || "No se pudo actualizar la nota SOAP.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (backupNota) {
      setNota(JSON.parse(JSON.stringify(backupNota)));
    }
    setIsEditing(false);
  };

  if (!nota) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card auth-card-detail">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <h2 className="title_card" style={{ margin: 0 }}>
            Detalle Nota SOAP
          </h2>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "0.85rem" }}
            >
              <FaArrowLeft /> Volver
            </button>

            {!isEditing ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "0.85rem" }}
              >
                <FaEdit /> Editar Nota
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "0.85rem" }}
                >
                  <FaTimes /> Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  <FaSave /> {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </>
            )}
          </div>
        </div>

        <hr />

        <form className="form" onSubmit={handleSave}>
          <div className="form-row" style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            <div className="col" style={{ flex: "1 1 200px" }}>
              <label className="form-label">ID Nota</label>
              <input
                type="text"
                className="input"
                value={nota.idHistoricoFk || nota._id || ""}
                onChange={(e) => setNota({ ...nota, idHistoricoFk: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="col" style={{ flex: "1 1 200px" }}>
              <label className="form-label">Mes-Año</label>
              <input
                type="text"
                className="input"
                value={nota.mesAñoNota || ""}
                onChange={(e) => setNota({ ...nota, mesAñoNota: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="col" style={{ flex: "1 1 200px" }}>
              <label className="form-label">Fecha</label>
              {isEditing ? (
                <input
                  type="date"
                  className="input"
                  value={
                    nota.fechaNota
                      ? String(nota.fechaNota).substring(0, 10)
                      : nota.createdAt
                      ? String(nota.createdAt).substring(0, 10)
                      : ""
                  }
                  onChange={(e) => setNota({ ...nota, fechaNota: e.target.value })}
                />
              ) : (
                <input
                  type="text"
                  className="input"
                  value={formatDateDDMMYYYY(nota.fechaNota || nota.createdAt)}
                  disabled
                />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="col">
              <label className="form-label">Contenido general:</label>
              <textarea
                className="textarea"
                value={nota.contenidoNota || ""}
                onChange={(e) => setNota({ ...nota, contenidoNota: e.target.value })}
                placeholder="No especificado"
                disabled={!isEditing}
              />
            </div>
          </div>

          <h3 style={{ marginTop: "10px", color: "#6c757d" }}>Nota SOAP</h3>

          <div className="form-row" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div className="col" style={{ flex: "1 1 260px" }}>
              <label className="form-label">S (Subjetivo):</label>
              <textarea
                className="textarea"
                value={nota.S || ""}
                onChange={(e) => setNota({ ...nota, S: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="col" style={{ flex: "1 1 260px" }}>
              <label className="form-label">O (Objetivo):</label>
              <textarea
                className="textarea"
                value={nota.O || ""}
                onChange={(e) => setNota({ ...nota, O: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div className="col" style={{ flex: "1 1 260px" }}>
              <label className="form-label">A (Análisis):</label>
              <textarea
                className="textarea"
                value={nota.A || ""}
                onChange={(e) => setNota({ ...nota, A: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="col" style={{ flex: "1 1 260px" }}>
              <label className="form-label">P (Plan):</label>
              <textarea
                className="textarea"
                value={nota.P || ""}
                onChange={(e) => setNota({ ...nota, P: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
