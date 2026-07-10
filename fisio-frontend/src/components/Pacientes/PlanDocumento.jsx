import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { showError } from "../../utils/alerts";
import { useReactToPrint } from "react-to-print";
import { FaPrint, FaArrowLeft, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { formatDateDDMMYYYY } from "../../utils/utils";

const PlanDocumento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [cargando, setCargando] = useState(true);

  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Plan_Ejercicios_${paciente ? paciente.nombres : "Paciente"}`,
  });

  const handleShareWhatsApp = () => {
    const text = `Hola ${paciente ? paciente.nombres : ""}, te envío tu plan de ejercicios y rehabilitación. Por favor, revisa el archivo PDF que te adjuntaré a continuación.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = `Tu Plan de Ejercicios - FisioHesou`;
    const body = `Hola ${paciente ? paciente.nombres : ""},\n\nTe envío tu plan de ejercicios y rehabilitación. Por favor, revisa el archivo PDF adjunto.\n\nSaludos,\nFisioHesou`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      // Obtener el plan
      const resPlan = await api.get(`/planes/${id}`);
      const planData = resPlan.data.plan;
      setPlan(planData);

      // Obtener detalles del paciente
      const resPaciente = await api.get(`/citas/detalles-paciente/${planData.identificadorPaciente}`);
      if (resPaciente.data.historial && resPaciente.data.historial.length > 0) {
        setPaciente(resPaciente.data.historial[0]);
      } else {
        // Fallback local storage
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
        <LoadingSpinner size="large" color="#42133B" />
      </div>
    );
  }

  if (!plan) {
    return <div className="auth-wrapper-content">Plan no encontrado.</div>;
  }

  return (
    <div className="auth-wrapper-content" style={{ padding: '40px 20px 120px 20px', flexDirection: 'column', alignItems: 'center' }}>

      {/* BARRA FLOTANTE DE ACCIONES (NO SE IMPRIME) */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '15px 25px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          borderRadius: '50px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.6)',
          zIndex: 1000
        }}
      >
        <button
          onClick={handleShareWhatsApp}
          style={{
            border: 'none',
            padding: '12px 20px',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#25D366',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          title="Compartir por WhatsApp"
        >
          <FaWhatsapp size={20} />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={handleShareEmail}
          style={{
            border: 'none',
            padding: '12px 20px',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#EA4335',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 10px rgba(234, 67, 53, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          title="Compartir por Correo"
        >
          <FaEnvelope size={20} />
          <span>Correo</span>
        </button>

        <div style={{ width: '1px', height: '30px', background: '#ddd', margin: '0 5px' }}></div>

        <button
          onClick={handlePrint}
          style={{
            border: 'none',
            padding: '12px 24px',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#42133B',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(66, 19, 59, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <FaPrint size={18} />
          <span>Imprimir / PDF</span>
        </button>
      </div>
      {/* DOCUMENTO A IMPRIMIR */}
      <div
        ref={componentRef}
        style={{
          background: 'white',
          width: '100%',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '60px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          color: '#333',
          minHeight: '1056px' /* Tamaño aproximado A4 para darle aspecto de hoja real */
        }}
      >
        {/* Encabezado Profesional */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #42133B', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ color: '#42133B', margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>FisioHesou</h1>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>Clínica de Fisioterapia y Rehabilitación</p>
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
          {plan.ejercicios.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
              {item.ejercicio?.imagenUrl ? (
                <img
                  src={`http://localhost:5000${item.ejercicio.imagenUrl}`}
                  alt={item.ejercicio.nombre}
                  style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              ) : (
                <div style={{ width: '180px', height: '180px', background: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                  Sin imagen
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
          ))}
        </div>

        <div style={{ marginTop: '50px', textAlign: 'center', color: '#888', fontSize: '12px' }}>
          <p>Este documento es una guía de ejercicios complementaria a su tratamiento. Si presenta dolor agudo, suspenda el ejercicio y consulte a su fisioterapeuta.</p>
        </div>
      </div>
    </div>
  );
};

export default PlanDocumento;
