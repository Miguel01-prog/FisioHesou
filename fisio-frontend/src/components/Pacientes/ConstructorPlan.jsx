import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { showError, showSuccess } from "../../utils/alerts";
import { FaPlus, FaTrash } from "react-icons/fa";

const ConstructorPlan = () => {
  const { id, idPlan } = useParams();
  const navigate = useNavigate();
  const [ejerciciosCatalogo, setEjerciciosCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado del Plan
  const [notasGenerales, setNotasGenerales] = useState("");
  const [ejerciciosPlan, setEjerciciosPlan] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [idPlan]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // 1. Cargar catálogo
      const resCat = await api.get("/ejercicios");
      setEjerciciosCatalogo(resCat.data.ejercicios || []);

      // 2. Si estamos editando, cargar plan existente
      if (idPlan) {
        const resPlan = await api.get(`/planes/${idPlan}`);
        const plan = resPlan.data.plan;
        
        setNotasGenerales(plan.notasGenerales || "");
        
        // Mapear los ejercicios del plan al formato del estado
        const ejerciciosCargados = plan.ejercicios.map(e => ({
          ejercicio: e.ejercicio, // El populate ya trae el objeto completo
          series: e.series,
          repeticiones: e.repeticiones,
          frecuencia: e.frecuencia,
          notas: e.notas
        }));
        setEjerciciosPlan(ejerciciosCargados);
      }
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo cargar la información necesaria.");
    } finally {
      setCargando(false);
    }
  };

  const agregarEjercicioAlPlan = (ejercicio) => {
    // Verificar si ya está
    if (ejerciciosPlan.find(e => e.ejercicio._id === ejercicio._id)) {
        showError("Aviso", "Este ejercicio ya está en el plan.");
        return;
    }

    setEjerciciosPlan([
      ...ejerciciosPlan,
      {
        ejercicio: ejercicio,
        series: "",
        repeticiones: "",
        frecuencia: "",
        notas: ""
      }
    ]);
    
    // Opcional: cerrar el modal después de agregar, o dejarlo abierto para agregar varios.
    // Dejémoslo abierto, pero agregamos una alerta sutil
    // showError("Éxito", "Ejercicio agregado al plan"); // (O showSuccess, pero no queremos spam)
  };

  const quitarEjercicio = (index) => {
    const nuevoPlan = [...ejerciciosPlan];
    nuevoPlan.splice(index, 1);
    setEjerciciosPlan(nuevoPlan);
  };

  const handleChangeIndicaciones = (index, campo, valor) => {
    const nuevoPlan = [...ejerciciosPlan];
    nuevoPlan[index][campo] = valor;
    setEjerciciosPlan(nuevoPlan);
  };

  const guardarPlan = async () => {
    if (ejerciciosPlan.length === 0) {
      showError("Plan vacío", "Agrega al menos un ejercicio al plan.");
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        identificadorPaciente: id,
        notasGenerales,
        ejercicios: ejerciciosPlan.map(e => ({
          ejercicio: e.ejercicio._id,
          series: e.series,
          repeticiones: e.repeticiones,
          frecuencia: e.frecuencia,
          notas: e.notas
        }))
      };

      let res;
      if (idPlan) {
        // Actualizar plan existente
        res = await api.put(`/planes/${idPlan}`, payload);
        showSuccess("¡Plan Actualizado!", "Los cambios han sido guardados.");
      } else {
        // Crear plan nuevo
        res = await api.post("/planes", payload);
        showSuccess("¡Plan Creado!", "El plan de tratamiento ha sido guardado.");
      }
      
      navigate(`/fisioterapeuta/plan-documento/${res.data.plan._id}`);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo guardar el plan.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="auth-wrapper-content">
      
      <div className="cards-column">
        <div className="auth-card auth-card-detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="title_card">
              {idPlan ? "Editar Plan de Tratamiento" : "Nuevo Plan de Tratamiento"}
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="save-btn" onClick={() => setMostrarModal(true)} style={{ width: 'auto', backgroundColor: '#17a2b8' }}>
                + Añadir Ejercicio
              </button>
              <button className="save-btn" onClick={guardarPlan} disabled={guardando} style={{ width: '150px' }}>
                {guardando ? <LoadingSpinner size="small" color="#fff" /> : "Guardar y Ver"}
              </button>
            </div>
          </div>
          <hr />

          <div className="form-row">
            <div className="form-col full-width">
              <label className="form-label">Notas Generales (Recomendaciones globales):</label>
              <textarea 
                className="textarea" 
                value={notasGenerales} 
                onChange={(e) => setNotasGenerales(e.target.value)}
                placeholder="Ej. Aplicar hielo después de la sesión..."
              />
            </div>
          </div>

          <h3 className="title_card" style={{ fontSize: '16px', marginTop: '20px' }}>Ejercicios Asignados ({ejerciciosPlan.length})</h3>
          
          {ejerciciosPlan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '8px', color: '#6c757d' }}>
              Selecciona ejercicios del catálogo de la izquierda para armar el plan.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {ejerciciosPlan.map((item, idx) => (
                <div key={idx} style={{ border: '1px solid #42133B', borderRadius: '8px', padding: '15px', position: 'relative', background: '#fafafa' }}>
                  <button 
                    onClick={() => quitarEjercicio(idx)}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                  >
                    <FaTrash />
                  </button>
                  
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    {item.ejercicio.imagenUrl && (
                        <img src={`http://localhost:5000${item.ejercicio.imagenUrl}`} alt={item.ejercicio.nombre} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#42133B' }}>{item.ejercicio.nombre}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>{item.ejercicio.descripcion}</p>
                    </div>
                  </div>

                  <div className="form-row" style={{ gap: '10px' }}>
                    <div className="form-col">
                      <label className="form-label" style={{fontSize: '12px'}}>Series:</label>
                      <input type="text" className="input" placeholder="Ej. 3" value={item.series} onChange={(e) => handleChangeIndicaciones(idx, "series", e.target.value)} />
                    </div>
                    <div className="form-col">
                      <label className="form-label" style={{fontSize: '12px'}}>Reps:</label>
                      <input type="text" className="input" placeholder="Ej. 10" value={item.repeticiones} onChange={(e) => handleChangeIndicaciones(idx, "repeticiones", e.target.value)} />
                    </div>
                    <div className="form-col">
                      <label className="form-label" style={{fontSize: '12px'}}>Frecuencia:</label>
                      <input type="text" className="input" placeholder="Ej. 2 veces al día" value={item.frecuencia} onChange={(e) => handleChangeIndicaciones(idx, "frecuencia", e.target.value)} />
                    </div>
                    <div className="form-col" style={{ flex: '2' }}>
                      <label className="form-label" style={{fontSize: '12px'}}>Notas específicas:</label>
                      <input type="text" className="input" placeholder="Ej. Mantener 5 segundos..." value={item.notas} onChange={(e) => handleChangeIndicaciones(idx, "notas", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal del Catálogo de Ejercicios */}
      {mostrarModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 className="title_card" style={{ margin: 0 }}>Catálogo de Ejercicios</h2>
              <button className="close-btn" onClick={() => setMostrarModal(false)} style={{ position: 'relative', right: '0', top: '0', margin: '0' }}>✕</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
              {cargando ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <LoadingSpinner size="large" color="#42133B"/>
                </div>
              ) : ejerciciosCatalogo.length === 0 ? (
                <p className="text-muted">No hay ejercicios en el catálogo.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                  {ejerciciosCatalogo.map((ej) => (
                    <div key={ej._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
                      {ej.imagenUrl && (
                        <img src={`http://localhost:5000${ej.imagenUrl}`} alt={ej.nombre} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                      <h4 style={{ margin: '0', fontSize: '14px', color: '#42133B' }}>{ej.nombre}</h4>
                      <button 
                        onClick={() => agregarEjercicioAlPlan(ej)}
                        style={{ background: '#42133B', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <FaPlus size={10}/> Agregar al plan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ConstructorPlan;
