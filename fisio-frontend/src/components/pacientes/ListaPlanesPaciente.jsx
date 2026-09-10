import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api";
import { FaEye, FaEdit, FaArrowLeft, FaPlus } from "react-icons/fa";
import LoadingSpinner from "../layout/LoadingSpinner";
import { formatDateDDMMYYYY, deobfuscateId } from "../../utils/utils";

const ListaPlanesPaciente = () => {
  const { id: rawId } = useParams();
  const id = deobfuscateId(rawId);
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleVolver = () => {
    const rolePath = user?.role || 'fisioterapeuta';
    if (id) {
      navigate(`/${rolePath}/paciente/${id}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="auth-wrapper-content">
      <div className="cards-column">
        <div className="auth-card auth-card-detail">

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "1rem" }}>
            <h2 className="title_card" style={{ margin: 0 }}>
              Historial de Planes de Tratamiento
            </h2>

            <button
              className="btn btn-primary glow-pulse-purple"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => navigate(`/${user?.role || 'fisioterapeuta'}/crear-plan/${id}`)}
            >
              <FaPlus size={12} /> Crear Nuevo Plan
            </button>
          </div>

          <hr />

          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <LoadingSpinner size="large" color="#42133B" />
            </div>
          ) : planes.length === 0 ? (
            <p>No hay planes de tratamiento registrados para este paciente.</p>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
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
                  {planes.map((item) => {
                    const rolePath = user?.role || user?.rol || 'fisioterapeuta';
                    return (
                      <tr key={item._id}>
                        <td>{formatDateDDMMYYYY(item.fechaCreacion)}</td>
                        <td>{item.ejercicios?.length || 0} ejercicios</td>
                        <td>
                          <button
                            className="btn-eye"
                            onClick={() => navigate(`/${rolePath}/plan-documento/${item._id}`)}
                            title="Ver Documento"
                          >
                            <FaEye />
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn-eye"
                            style={{ color: '#17a2b8' }}
                            onClick={() => navigate(`/${rolePath}/editar-plan/${item._id}`)}
                            title="Editar Ejercicios"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListaPlanesPaciente;
