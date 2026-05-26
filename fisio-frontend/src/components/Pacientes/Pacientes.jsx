import React, { useEffect, useState } from "react";
import { capitalizeWords } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";

export default function ListaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    obtenerPacientes();
  }, []);

  const obtenerPacientes = async () => {
    try {
      const { data } = await api.get("/pacientes");
      setPacientes(data);
      localStorage.setItem("listaPacientes", JSON.stringify(data));
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card" style={{ marginTop: '5%' }}>
        <h2 className="title_card" style={{ marginTop: '-10px' }}>Pacientes</h2>
        <hr />

        {cargando && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <LoadingSpinner size="large" />
          </div>
        )}

        {!cargando && pacientes.length === 0 && (
          <p className="text-muted">No hay pacientes registrados.</p>
        )}

        {!cargando && pacientes.length > 0 && (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="tabla-pacientes">
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>Teléfono</th>
                  <th>Ver historial</th>
                </tr>
              </thead>

              <tbody>
                {pacientes.map((p) => (
                  <tr key={p.identificadorPaciente}>
                    <td>
                      {capitalizeWords(p.nombres)} {capitalizeWords(p.apellidos)}
                    </td>
                    <td>{p.telefono}</td>
                    <td style={{ display: 'flex', justifyContent: 'center' }}>
                      <button className="btn-eye" onClick={() => {
                        localStorage.setItem("dataPaciente", JSON.stringify(p));
                        console.log("Paciente seleccionado:", p.identificadorPaciente);
                        navigate(`/fisioterapeuta/paciente/${p.identificadorPaciente}`);
                      }}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
