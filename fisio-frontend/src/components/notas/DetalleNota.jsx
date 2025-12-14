import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api.js";
import { formatDateDDMMYYYY } from "../../utils/utils.js";

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

  if (!nota) return <p>Cargando nota...</p>;

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card auth-card-detail">
        <h2 style={{ marginBottom: "20px" }}>Nota SOAP #{nota.idNota}</h2>

        <button className="save-btn" onClick={() => navigate(-1)}>
          ⬅ Volver
        </button>

        <hr />

        <p><strong>Fecha:</strong> {formatDateDDMMYYYY(nota.fechaNota)}</p>

        <h3>Subjective (S)</h3>
        <p>{nota.S}</p>

        <h3>Objective (O)</h3>
        <p>{nota.O}</p>

        <h3>Assessment (A)</h3>
        <p>{nota.A}</p>

        <h3>Plan (P)</h3>
        <p>{nota.P}</p>
      </div>
    </div>
  );
}
