import { capitalizeWords, formatDateDDMMYYYY } from "../../utils/utils.js";
import CardPaciente from "../pacientes/CardPaciente.jsx";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import api from "../../api.js";
import { FaEye } from "react-icons/fa";
import LoadingSpinner from "../layout/LoadingSpinner.jsx";

export default function PacienteDetalle() {
  const { id } = useParams();
  const [notas, setNotas] = useState([]);
  const [historialClinico, setHistorialClinico] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [cargando, setCargando] = useState(true);

  const navigate = useNavigate();

  // 📌 Cargar historial y notas del paciente
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // Cargar detalles del paciente (usamos la misma lógica anterior para obtener la info)
        const resCitas = await api.get(`/citas/detalles-paciente/${id}`);
        if (resCitas.data.historial && resCitas.data.historial.length > 0) {
          const p = resCitas.data.historial[0];
          setPaciente({
            identificadorPaciente: p.identificadorPaciente,
            nombres: p.nombres,
            apellidos: p.apellidos,
            edad: p.edad,
            telefono: p.telefono,
            fechaRegistro: p.fechaCreado,
          });
        } else {
          // Intentar desde localStorage si no tiene citas previas
          const localData = JSON.parse(localStorage.getItem("dataPaciente"));
          if (localData && localData.identificadorPaciente === id) {
            setPaciente(localData);
          }
        }

        // Cargar Historial Clínico
        try {
          const resHistorial = await api.get(`/historial-notas/paciente/${id}`);
          if (resHistorial.data.ok) {
            setHistorialClinico(resHistorial.data.historial);
          }
        } catch (e) {
          console.warn("No se encontró historial clínico para este paciente.");
          setHistorialClinico(null);
        }

        // Cargar Notas SOAP
        try {
          const resNotas = await api.get(`/notas/paciente/${id}`);
          setNotas(resNotas.data || []);
        } catch (e) {
          console.warn("No se encontraron notas para este paciente.");
          setNotas([]);
        }

      } catch (err) {
        console.error("Error al cargar datos del paciente:", err);
      } finally {
        setCargando(false);
      }
    };

    fetchDatos();
  }, [id]);

  return (
    <div className="auth-wrapper-content">
      <div className="cards-column">

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <LoadingSpinner size="large" color="#42133B"/>
          </div>
        ) : (
          <>
            {/* Tarjeta del paciente */}
            {paciente && <CardPaciente paciente={paciente} />}

        <div className="auth-card auth-card-detail">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="title_card" style={{ marginTop: "-10px" }}>
              Historial del paciente
            </h2>

            <div style={{ display: "flex", gap: "10px", marginTop: "-55px", marginRight: "-2px" }}>
              {historialClinico ? (
                <>
                  <button
                    className="save-btn"
                    style={{ backgroundColor: "#6c757d" }}
                    onClick={() => navigate(`/fisioterapeuta/historial-detalle/${historialClinico._id}`)}
                  >
                    Ver Historial Clínico
                  </button>
                  <button
                    className="save-btn"
                    onClick={() => navigate(`/fisioterapeuta/notas`)}
                  >
                    Añadir Nota SOAP
                  </button>
                </>
              ) : (
                <button
                  className="save-btn"
                  onClick={() => navigate(`/fisioterapeuta/creacion-historial`)}
                >
                  Crear Historial
                </button>
              )}
            </div>
          </div>

          <hr />

          {notas.length === 0 ? (
            <p>No hay notas registradas para este paciente.</p>
          ) : (
            <table className="tabla-pacientes">
              <thead>
                <tr>
                  <th>ID Nota</th>
                  <th>Fecha</th>
                  <th>Ver</th>
                </tr>
              </thead>

              <tbody>
                {notas.map((item) => (
                  <tr key={item._id}>
                    <td>{item.idHistoricoFk || item._id}</td>
                    <td>{formatDateDDMMYYYY(item.fechaNota || item.createdAt)}</td>
                    <td>
                      <button
                        className="btn-eye"
                        onClick={() => navigate(`/fisioterapeuta/nota-detalle/${item._id}`)}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </>
        )}

      </div>
    </div>
  );
}
