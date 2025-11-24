import React, { useEffect, useState } from "react";
import { capitalizeWords } from "../../utils/utils";
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import api from "../../api";

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
        } catch (error) {
        console.error("Error al cargar pacientes:", error);
        } finally {
        setCargando(false);
        }
    };

  return (
    <div className="auth-wrapper-content">
      <div className="auth-card" style={{ width: "900px", marginTop: '20%'}}>
        <h2 className="title_card" style={{marginTop: '-10px'}}>Pacientes</h2>
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
                  <td>
                    <button className="btn-eye" onClick={() => {localStorage.setItem("dataPaciente", JSON.stringify(p));
                    console.log("Paciente seleccionado:", p.identificadorPaciente);
                        navigate(`/fisioterapeuta/paciente/${p.identificadorPaciente}`);
                      }}
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
  );
}
