import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { showError, showSuccess } from "../../utils/alerts";
import { FaPrint, FaWhatsapp, FaEnvelope, FaEdit, FaCamera } from "react-icons/fa";
import {
  formatDateDDMMYYYY,
  deobfuscateId,
  resolveExerciseImage,
  compressImageToBase64,
  saveExerciseImageCache,
  getExerciseImageCache
} from "../../utils/utils";

const PlanDocumento = () => {
  const { id: rawId } = useParams();
  const id = deobfuscateId(rawId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [failedImages, setFailedImages] = useState({});
  const replaceInputRef = useRef(null);
  const [ejercicioParaImagen, setEjercicioParaImagen] = useState(null);

  const componentRef = useRef(null);

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = `Plan_Ejercicios_${paciente ? paciente.nombres : "Paciente"}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  const handleShareWhatsApp = () => {
    const text = `Hola ${paciente ? paciente.nombres : ""}, te envío tu plan de ejercicios y rehabilitación. Por favor, revisa el archivo PDF que te adjuntaré a continuación.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = `Tu Plan de Ejercicios - HESOU`;
    const body = `Hola ${paciente ? paciente.nombres : ""},\n\nTe envío tu plan de ejercicios y rehabilitación. Por favor, revisa el archivo PDF adjunto.\n\nSaludos,\nHESOU`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
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

      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ejercicios: prev.ejercicios.map((item) =>
            item.ejercicio?._id === targetEj._id
              ? { ...item, ejercicio: { ...item.ejercicio, imagenUrl: base64DataUrl, imagenBase64: base64DataUrl } }
              : item
          )
        };
      });
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

      showSuccess("Imagen cargada", `Se actualizó la imagen de "${targetEj.nombre}".`);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo procesar la imagen seleccionada.");
    } finally {
      setEjercicioParaImagen(null);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      const resPlan = await api.get(`/planes/${id}`);
      const planData = resPlan.data.plan;
      setPlan(planData);

      const resPaciente = await api.get(`/citas/detalles-paciente/${planData.identificadorPaciente}`);
      if (resPaciente.data.historial && resPaciente.data.historial.length > 0) {
        setPaciente(resPaciente.data.historial[0]);
      } else {
        const localData = JSON.parse(localStorage.getItem("dataPaciente"));
        if (localData && localData.identificadorPaciente === planData.identificadorPaciente) {
          setPaciente(localData);
        }
      }
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo cargar el documento del plan.");
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="auth-wrapper-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!plan) {
    return <div className="auth-wrapper-content">Plan no encontrado.</div>;
  }

  return (
    <div className="auth-wrapper-content" style={{ padding: '20px 20px 120px 20px', flexDirection: 'column', alignItems: 'center' }}>
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        style={{ display: "none" }}
        onChange={handleReemplazarImagen}
      />

      {/* BOTÓN SUPERIOR EDITAR PLAN (NO SE IMPRIME) */}
      <div className="no-print" style={{ width: '100%', maxWidth: '800px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={() => navigate(`/${user?.role || 'fisioterapeuta'}/editar-plan/${plan._id}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <FaEdit /> Editar Plan
        </button>
      </div>

      {/* BARRA FLOTANTE DE ACCIONES (NO SE IMPRIME) */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 24px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          borderRadius: '50px',
          boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.5))',
          border: '1px solid var(--border-light, rgba(255,255,255,0.15))',
          zIndex: 1000
        }}
      >

        <button
          onClick={handleShareWhatsApp}
          style={{
            border: 'none',
            padding: '10px 18px',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#25D366',
            color: 'white',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          title="Compartir por WhatsApp"
        >
          <FaWhatsapp size={18} />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={handleShareEmail}
          style={{
            border: 'none',
            padding: '10px 18px',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#EA4335',
            color: 'white',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(234, 67, 53, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          title="Compartir por Correo"
        >
          <FaEnvelope size={16} />
          <span>Correo</span>
        </button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)', margin: '0 2px' }}></div>

        <button
          type="button"
          onClick={handlePrint}
          style={{
            border: 'none',
            padding: '10px 20px',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <FaPrint size={16} />
          <span>Imprimir / PDF</span>
        </button>
      </div>
      {/* DOCUMENTO A IMPRIMIR */}
      <div
        ref={componentRef}
        className="plan-printable-sheet"
        style={{
          background: 'white',
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '60px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          color: '#333',
          minHeight: '1056px'
        }}
      >
        {/* Encabezado Profesional */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #42133B', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/logo_hesou.svg" alt="HESOU" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ color: '#42133B', margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold' }}>HESOU</h1>
              <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>Clínica de Fisioterapia y Rehabilitación</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '14px' }}>
            <p style={{ margin: '0 0 5px 0' }}><strong>Fecha:</strong> {formatDateDDMMYYYY(plan.fechaCreacion)}</p>
            <p style={{ margin: '0 0 5px 0' }}><strong>Paciente:</strong> {paciente ? `${paciente.nombres} ${paciente.apellidos}` : plan.identificadorPaciente}</p>
          </div>
        </div>

        <h2 style={{ textAlign: 'center', color: '#333', fontSize: '22px', marginBottom: '30px' }}>PLAN DE EJERCICIOS Y REHABILITACIÓN</h2>

        {plan.notasGenerales && (
          <div style={{ background: '#f8f9fa', borderLeft: '4px solid #42133B', padding: '15px', marginBottom: '30px', borderRadius: '0 5px 5px 0' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#42133B' }}>Indicaciones Generales</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>{plan.notasGenerales}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {plan.ejercicios.map((item, index) => {
            const ejKey = item.ejercicio?._id || `doc-${index}`;
            const cached = getExerciseImageCache(item.ejercicio);
            const imgSrc = cached || resolveExerciseImage(item.ejercicio);
            const hasValidImage = Boolean(imgSrc) && (!failedImages[ejKey] || Boolean(cached));

            return (
              <div key={index} style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px', breakInside: 'avoid' }}>
                {hasValidImage ? (
                  <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
                    <img
                      src={imgSrc}
                      alt={item.ejercicio?.nombre}
                      onError={() => setFailedImages((prev) => ({ ...prev, [ejKey]: true }))}
                      style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => handleTriggerImagen(item.ejercicio)}
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        background: 'rgba(15, 23, 42, 0.78)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Cambiar imagen"
                    >
                      <FaCamera size={10} /> Cambiar
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => handleTriggerImagen(item.ejercicio)}
                    style={{ width: '180px', height: '180px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
                    title="Haz clic para subir la imagen de este ejercicio"
                  >
                    <span>Sin imagen</span>
                    <button
                      type="button"
                      className="no-print"
                      style={{
                        background: '#6366f1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <FaCamera size={11} /> Subir imagen
                    </button>
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#42133B', fontSize: '18px' }}>
                    {index + 1}. {item.ejercicio?.nombre || "Ejercicio Desconocido"}
                  </h3>

                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#555', lineHeight: '1.5' }}>
                    {item.ejercicio?.descripcion}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Series</span>
                      <strong style={{ fontSize: '15px' }}>{item.series || "-"}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Repeticiones</span>
                      <strong style={{ fontSize: '15px' }}>{item.repeticiones || "-"}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Frecuencia</span>
                      <strong style={{ fontSize: '15px' }}>{item.frecuencia || "-"}</strong>
                    </div>

                    {item.notas && (
                      <div style={{ gridColumn: '1 / -1', marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Nota específica</span>
                        <span style={{ fontSize: '13px', color: '#444' }}>{item.notas}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '50px', textAlign: 'center', color: '#888', fontSize: '12px' }}>
          <p>Este documento es una guía de ejercicios complementaria a su tratamiento. Si presenta dolor agudo, suspenda el ejercicio y consulte a su fisioterapeuta.</p>
        </div>
      </div>
    </div>
  );
};

export default PlanDocumento;
