import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { FaEye, FaEdit, FaArrowLeft } from "react-icons/fa";
import LoadingSpinner from "../layout/LoadingSpinner";
import { formatDateDDMMYYYY } from "../../utils/utils";

const ListaPlanesPaciente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPlanes();
  }, [id]);

  const cargarPlanes = async () => {
    try {
      const res = await api.get(`/planes/paciente/${id}`);
      setPlanes(res.data.planes || []);
    } catch (err) {
      console.error("Error al cargar planes:", err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-wrapper-content">
      <div className="cards-column">
        <div className="auth-card auth-card-detail">
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="btn" onClick={() => navigate(`/fisioterapeuta/paciente/${id}`)} style={{ background: '#f8f9fa', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                  <FaArrowLeft /> Volver
                </button>
                <h2 className="title_card" style={{ marginTop: "10px" }}>
                  Historial de Planes de Tratamiento
                </h2>
            </div>
            
            <button
              className="save-btn"
              style={{ backgroundColor: "#28a745", padding: "8px 20px" }}
              onClick={() => navigate(`/fisioterapeuta/crear-plan/${id}`)}
            >
              + Crear Nuevo Plan
            </button>
          </div>

          <hr />

          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <LoadingSpinner size="large" color="#42133B"/>
            </div>
          ) : planes.length === 0 ? (
            <p>No hay planes de tratamiento registrados para este paciente.</p>
          ) : (
            <table className="tabla-pacientes">
              <thead>
                <tr>
                  <th>Fecha de Creación</th>
                  <th>Ejercicios Asignados</th>
                  <th>Ver / Imprimir</th>
                  <th>Editar Plan</th>
                </tr>
              </thead>

              <tbody>
                {planes.map((item) => (
                  <tr key={item._id}>
                    <td>{formatDateDDMMYYYY(item.fechaCreacion)}</td>
                    <td>{item.ejercicios?.length || 0} ejercicios</td>
                    <td>
                      <button
                        className="btn-eye"
                        onClick={() => navigate(`/fisioterapeuta/plan-documento/${item._id}`)}
                        title="Ver Documento"
                      >
                        <FaEye />
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-eye"
                        style={{ color: '#17a2b8' }}
                        onClick={() => navigate(`/fisioterapeuta/editar-plan/${item._id}`)}
                        title="Editar Ejercicios"
                      >
                        <FaEdit />
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
};

export default ListaPlanesPaciente;
