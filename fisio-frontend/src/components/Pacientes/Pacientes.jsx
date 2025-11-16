import React, { useEffect, useState } from "react";
import api from "../../api";
import { capitalizeWords } from "../../utils/utils";

export default function ListaPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerPacientes();
  }, []);

  const obtenerPacientes = async () => {
    try {
      const { data } = await api.get("/pacientes");
      setPacientes(data);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card card" style={{ width: "900px" }}>
        <h2 className="title_card">Pacientes</h2>
        <hr />

        {cargando && <p>Cargando...</p>}

        {!cargando && pacientes.length === 0 && (
          <p className="text-muted">No hay pacientes registrados.</p>
        )}

        {!cargando && pacientes.length > 0 && (
          <table className="tabla-pacientes">
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>Teléfono</th>
                <th>Edad</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pacientes.map((p) => (
                <tr key={p._id}>
                  <td>
                    {capitalizeWords(p.nombres)} {capitalizeWords(p.apellidos)}
                  </td>
                  <td>{p.telefono}</td>
                  <td>{p.edad}</td>
                  <td>
                    <button
                      className="btn-detalle"
                      onClick={() => window.location.href = `/paciente/${p._id}`}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
