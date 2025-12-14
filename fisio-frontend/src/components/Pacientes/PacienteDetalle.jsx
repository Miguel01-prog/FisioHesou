import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils.js";
import CardPaciente from "../pacientes/CardPaciente.jsx";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import api from "../../api.js";
import { FaEye } from "react-icons/fa";

export default function PacienteDetalle() {
  const { id } = useParams();
  const [historial, setHistorial] = useState([]);
  const [paciente, setPaciente] = useState(null);

  const navigate = useNavigate();

  // 📌 Cargar historial del paciente
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const { data } = await api.get(`/citas/detalles-paciente/${id}`);
        console.log("Historial API:", data.historial); // 🔍 Ver datos

        setHistorial(data.historial || []);

        if (data.historial && data.historial.length > 0) {
          const p = data.historial[0];
          setPaciente({
            identificadorPaciente: p.identificadorPaciente,
            nombres: p.nombres,
            apellidos: p.apellidos,
            edad: p.edad,
            telefono: p.telefono,
            fechaRegistro: p.fechaCreado,
          });
        }
      } catch (err) {
        console.error("Error al cargar historial:", err);
      }
    };

    fetchHistorial();
  }, [id]);

  return (
    <div className="auth-wrapper-content">
      <div className="cards-column">

        {/* Tarjeta del paciente */}
        {paciente && <CardPaciente paciente={paciente} />}

        <div className="auth-card auth-card-detail">
          <div>
            <h2 className="title_card" style={{ marginTop: "-10px" }}>
              Historial
            </h2>

            <button
              className="save-btn"
              style={{ marginTop: "-55px", marginRight: "-2px" }}
              onClick={() => navigate(`/fisioterapeuta/creacion-historial`)}
            >
              Crear historial
            </button>
          </div>

          <hr />

          {historial.length === 0 ? (
            <p>No hay historial registrado para este paciente.</p>
          ) : (
            <table className="tabla-pacientes">
              <thead>
                <tr>
                  <th>ID Histórico</th>
                  <th>Fecha</th>
                
                  <th>Ver</th>
                </tr>
              </thead>

              <tbody>
                {historial.map((item) => (
                  <tr key={item._id}>
                    <td>{item.idHistoricoFk || item._id}</td>
                    <td>{formatDateDDMMYYYY(item.fechaCreado)}</td>
                    <td>
                      <button
                        className="btn-eye"
                        onClick={() =>
                          navigate(`/fisioterapeuta/nota-detalle/${item._id}`)
                        }
                      >
                       <FaEye/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
