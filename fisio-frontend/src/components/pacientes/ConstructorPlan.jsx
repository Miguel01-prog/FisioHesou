import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { showError, showSuccess } from "../../utils/alerts";
import { FaPlus, FaTrash, FaDumbbell, FaCamera } from "react-icons/fa";
import {
  deobfuscateId,
  resolveExerciseImage,
  compressImageToBase64,
  saveExerciseImageCache,
  getExerciseImageCache
} from "../../utils/utils.js";

const ConstructorPlan = () => {
  const { id: rawId, idPlan } = useParams();
  const id = deobfuscateId(rawId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ejerciciosCatalogo, setEjerciciosCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pacienteIdState, setPacienteIdState] = useState(id || "");
  const [failedImages, setFailedImages] = useState({});
  const replaceInputRef = useRef(null);
  const [ejercicioParaImagen, setEjercicioParaImagen] = useState(null);
  
  // Estado del Plan
  const [notasGenerales, setNotasGenerales] = useState("");
  const [ejerciciosPlan, setEjerciciosPlan] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  const customStyles = `
    .plan-exercise-card {
      background: var(--card-bg, rgba(255,255,255,0.02));
      border: 1px solid var(--border-light, rgba(255,255,255,0.08));
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-sm);
    }
    .plan-exercise-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: rgba(139, 92, 246, 0.25) !important;
    }
    .plan-exercise-card:hover .exercise-img {
      transform: scale(1.04);
    }
    .add-to-plan-btn:hover {
      background: var(--primary-hover, #7c3aed) !important;
      transform: translateY(-1px);
    }
  `;

  useEffect(() => {
    cargarDatos();
  }, [idPlan]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const resCat = await api.get("/ejercicios");
      setEjerciciosCatalogo(resCat.data.ejercicios || []);

      if (idPlan) {
        const resPlan = await api.get(`/planes/${idPlan}`);
        const plan = resPlan.data.plan;
        
        setNotasGenerales(plan.notasGenerales || "");
        if (plan.identificadorPaciente) {
          setPacienteIdState(plan.identificadorPaciente);
        }
        
        const ejerciciosCargados = plan.ejercicios.map(e => ({
          ejercicio: e.ejercicio,
          series: e.series || "",
          repeticiones: e.repeticiones || "",
          frecuencia: e.frecuencia || "",
          notas: e.notas || ""
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

  const handleTriggerImagen = (ej) => {
    if (!ej) return;
    setEjercicioParaImagen(ej);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  const handleReemplazarImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !ejercicioParaImagen) return;

    const targetEj = ejercicioParaImagen;
    try {
      const base64DataUrl = await compressImageToBase64(file);
      saveExerciseImageCache(targetEj, base64DataUrl);

      setEjerciciosPlan((prev) =>
        prev.map((item) =>
          item.ejercicio?._id === targetEj._id
            ? { ...item, ejercicio: { ...item.ejercicio, imagenUrl: base64DataUrl, imagenBase64: base64DataUrl } }
            : item
        )
      );
      setEjerciciosCatalogo((prev) =>
        prev.map((item) =>
          item._id === targetEj._id
            ? { ...item, imagenUrl: base64DataUrl, imagenBase64: base64DataUrl }
            : item
        )
      );
      setFailedImages((prev) => ({ ...prev, [targetEj._id]: false }));

      if (targetEj._id) {
        const formData = new FormData();
        formData.append("nombre", targetEj.nombre || "");
        formData.append("descripcion", targetEj.descripcion || "");
        formData.append("imagen", file);
        formData.append("imagenBase64", base64DataUrl);
        formData.append("imagenUrl", base64DataUrl);
        try {
          await api.put(`/ejercicios/${targetEj._id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } catch (putErr) {
          console.warn("Imagen guardada en caché local:", putErr);
        }
      }

      showSuccess("Imagen actualizada", `Se asignó la imagen a "${targetEj.nombre}".`);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo cargar la imagen.");
    } finally {
      setEjercicioParaImagen(null);
    }
  };

  const agregarEjercicioAlPlan = (ejercicio) => {
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

    const finalPacienteId = id || pacienteIdState;

    setGuardando(true);
    try {
      const payload = {
        identificadorPaciente: finalPacienteId,
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
      const rolePath = user?.role || 'fisioterapeuta';
      if (idPlan) {
        res = await api.put(`/planes/${idPlan}`, payload);
        showSuccess("¡Plan Actualizado!", "Los cambios han sido guardados.");
      } else {
        res = await api.post("/planes", payload);
        showSuccess("¡Plan Creado!", "El plan de tratamiento ha sido guardado.");
      }
      
      navigate(`/${rolePath}/plan-documento/${res.data.plan._id}`);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo guardar el plan.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="auth-wrapper-content">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        style={{ display: "none" }}
        onChange={handleReemplazarImagen}
      />
      
      <div className="cards-column">
        <div className="auth-card auth-card-detail">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '1rem' }}>
            <h2 className="title_card" style={{ margin: 0 }}>
              {idPlan ? "Editar Plan de Tratamiento" : "Nuevo Plan de Tratamiento"}
            </h2>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setMostrarModal(true)} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FaPlus size={12} /> Añadir Ejercicio
              </button>
              <button 
                className="btn btn-primary glow-pulse-purple" 
                onClick={guardarPlan} 
                disabled={guardando} 
                style={{ minWidth: '140px' }}
              >
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

          <h3 className="title_card" style={{ fontSize: '1rem', marginTop: '20px' }}>Ejercicios Asignados ({ejerciciosPlan.length})</h3>
          
          {ejerciciosPlan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed var(--border-light)', color: 'var(--text-muted)' }}>
              Presiona <strong>"+ Añadir Ejercicio"</strong> para seleccionar los ejercicios del catálogo y armar el plan.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ejerciciosPlan.map((item, idx) => {
                const ejId = item.ejercicio?._id || `plan-${idx}`;
                const cached = getExerciseImageCache(item.ejercicio);
                const imgSrc = cached || resolveExerciseImage(item.ejercicio);
                const hasValidImage = Boolean(imgSrc) && (!failedImages[ejId] || Boolean(cached));

                return (
                  <div key={idx} style={{ border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', position: 'relative', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <button 
                      onClick={() => quitarEjercicio(idx)}
                      style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--danger, #ef4444)', cursor: 'pointer', fontSize: '1rem' }}
                      title="Eliminar ejercicio del plan"
                    >
                      <FaTrash />
                    </button>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                      {hasValidImage ? (
                        <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                          <img
                            src={imgSrc}
                            alt={item.ejercicio?.nombre}
                            onError={() => setFailedImages((prev) => ({ ...prev, [ejId]: true }))}
                            style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleTriggerImagen(item.ejercicio)}
                            style={{
                              position: 'absolute',
                              bottom: '3px',
                              right: '3px',
                              background: 'rgba(15, 23, 42, 0.78)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 5px',
                              fontSize: '0.65rem',
                              cursor: 'pointer'
                            }}
                            title="Cambiar imagen"
                          >
                            <FaCamera size={10} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleTriggerImagen(item.ejercicio)}
                          style={{ width: '90px', height: '90px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.05)', border: '1px dashed var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
                          title="Subir imagen para este ejercicio"
                        >
                          <FaCamera size={18} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: '600', textAlign: 'center' }}>Subir foto</span>
                        </div>
                      )}
                      <div style={{ flex: '1 1 200px' }}>
                          <h4 style={{ margin: '0 0 5px 0', color: 'var(--primary)', fontWeight: '700' }}>{item.ejercicio?.nombre}</h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.ejercicio?.descripcion}</p>
                      </div>
                    </div>
                    
                    <div className="form-row" style={{ gap: '10px', flexWrap: 'wrap' }}>
                      <div className="form-col" style={{ flex: '1 1 80px' }}>
                        <label className="form-label" style={{fontSize: '12px'}}>Series:</label>
                        <input type="text" className="input" placeholder="Ej. 3" value={item.series} onChange={(e) => handleChangeIndicaciones(idx, "series", e.target.value)} />
                      </div>
                      <div className="form-col" style={{ flex: '1 1 80px' }}>
                        <label className="form-label" style={{fontSize: '12px'}}>Reps:</label>
                        <input type="text" className="input" placeholder="Ej. 10" value={item.repeticiones} onChange={(e) => handleChangeIndicaciones(idx, "repeticiones", e.target.value)} />
                      </div>
                      <div className="form-col" style={{ flex: '1 1 120px' }}>
                        <label className="form-label" style={{fontSize: '12px'}}>Frecuencia:</label>
                        <input type="text" className="input" placeholder="Ej. 2 veces al día" value={item.frecuencia} onChange={(e) => handleChangeIndicaciones(idx, "frecuencia", e.target.value)} />
                      </div>
                      <div className="form-col" style={{ flex: '2 1 200px' }}>
                        <label className="form-label" style={{fontSize: '12px'}}>Notas específicas:</label>
                        <input type="text" className="input" placeholder="Ej. Mantener 5 segundos..." value={item.notas || item.notes || ""} onChange={(e) => handleChangeIndicaciones(idx, "notas", e.target.value)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal del Catálogo de Ejercicios */}
      {mostrarModal && createPortal(
        <div className="modal-backdrop" onClick={() => setMostrarModal(false)}>
          <style>{customStyles}</style>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '90%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', border: '1px solid var(--border-light)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 className="title_card" style={{ margin: 0, color: 'var(--primary)' }}>Catálogo de Ejercicios</h2>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                  {ejerciciosCatalogo.map((ej) => {
                    const cached = getExerciseImageCache(ej);
                    const imgSrc = cached || resolveExerciseImage(ej);
                    const hasValidImage = Boolean(imgSrc) && (!failedImages[ej._id] || Boolean(cached));

                    return (
                      <div
                        key={ej._id}
                        className="plan-exercise-card"
                      >
                        {hasValidImage ? (
                          <div style={{ width: '100%', height: '110px', overflow: 'hidden', position: 'relative', background: 'rgba(139, 92, 246, 0.05)' }}>
                            <img
                              src={imgSrc}
                              alt={ej.nombre}
                              onError={() => setFailedImages((prev) => ({ ...prev, [ej._id]: true }))}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                              className="exercise-img"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => handleTriggerImagen(ej)}
                            style={{ width: '100%', height: '110px', background: 'rgba(139, 92, 246, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
                            title="Haz clic para subir imagen"
                          >
                            <FaDumbbell size={22} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>Subir foto</span>
                          </div>
                        )}
                        <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'space-between' }}>
                          <h4 style={{ margin: '0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700', textAlign: 'center', lineHeight: '1.3' }}>{ej.nombre}</h4>
                          <button 
                            onClick={() => agregarEjercicioAlPlan(ej)}
                            style={{
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              width: '100%',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            className="add-to-plan-btn"
                          >
                            <FaPlus size={8}/> Agregar al plan
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ConstructorPlan;
