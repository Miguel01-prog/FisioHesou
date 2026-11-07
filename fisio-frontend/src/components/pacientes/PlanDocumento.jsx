import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api";
import LoadingSpinner from "../layout/LoadingSpinner";
import { showError, showSuccess } from "../../utils/alerts";
import { FaPrint, FaWhatsapp, FaEnvelope, FaEdit } from "react-icons/fa";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  formatDateDDMMYYYY,
  deobfuscateId,
  resolveExerciseImage,
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
  const [generandoPdf, setGenerandoPdf] = useState(null); // 'whatsapp' | 'email' | null
  const [failedImages, setFailedImages] = useState({});

  const componentRef = useRef(null);

  const getPdfFileName = () => {
    const rawName = paciente
      ? `${paciente.nombres || ""}_${paciente.apellidos || ""}`.trim()
      : "Paciente";
    const safeName =
      rawName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "") || "Paciente";
    return `Plan_Ejercicios_${safeName}.pdf`;
  };

  const renderElementToCanvasSafe = async (el) => {
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false
      });
      // Verificar que toDataURL no falle por imágenes externas sin CORS
      canvas.toDataURL("image/jpeg", 0.95);
      return canvas;
    } catch {
      return await html2canvas(el, {
        scale: 2,
        useCORS: false,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        ignoreElements: (node) =>
          node.tagName === "IMG" &&
          node.src &&
          !node.src.startsWith("data:") &&
          !node.src.startsWith(window.location.origin)
      });
    }
  };

  const generarArchivoPDF = async () => {
    const sheet = componentRef.current;
    if (!sheet) throw new Error("No se encontró el documento para generar el PDF.");

    const fileName = getPdfFileName();
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const marginX = 14;
    const marginTop = 14;
    const marginBottom = 14;
    const contentWidthMm = pageWidth - marginX * 2;
    const maxY = pageHeight - marginBottom;

    const blocks = Array.from(
      sheet.querySelectorAll(
        ".plan-header-block, .plan-title-heading, .plan-notes-block, .plan-exercise-item, .plan-footer-block"
      )
    );

    let currentY = marginTop;

    if (blocks.length > 0) {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const canvas = await renderElementToCanvasSafe(block);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const blockHeightMm = (canvas.height * contentWidthMm) / canvas.width;

        if (currentY > marginTop && currentY + blockHeightMm > maxY) {
          pdf.addPage();
          currentY = marginTop;
        }

        pdf.addImage(imgData, "JPEG", marginX, currentY, contentWidthMm, blockHeightMm);
        currentY += blockHeightMm + 4;
      }
    } else {
      const canvas = await renderElementToCanvasSafe(sheet);
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgHeightMm = (canvas.height * contentWidthMm) / canvas.width;
      pdf.addImage(imgData, "JPEG", marginX, marginTop, contentWidthMm, imgHeightMm);
    }

    const arrayBuffer = pdf.output("arraybuffer");
    const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" });
    const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

    return { pdf, pdfBlob, pdfFile, fileName };
  };

  const copiarImagenAlPortapapeles = async () => {
    try {
      const sheet = componentRef.current;
      if (!sheet || !navigator.clipboard || typeof ClipboardItem === "undefined") return false;
      const fullCanvas = await renderElementToCanvasSafe(sheet);
      const pngBlob = await new Promise((resolve) => fullCanvas.toBlob(resolve, "image/png"));
      if (!pngBlob) return false;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      return true;
    } catch {
      return false;
    }
  };

  const descargarPdfBinario = (pdfBlob, fileName) => {
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 8000);
  };

  const isMobileOrTabletDevice = () => {
    const ua = navigator.userAgent || "";
    const isTouchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || isTouchMac;
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    const prevUrl = window.location.pathname + window.location.search + window.location.hash;

    document.title = `Plan_Ejercicios_${paciente ? paciente.nombres : "Paciente"}`;
    try {
      window.history.replaceState(window.history.state, "", "/");
    } catch {
      // ignore history errors
    }

    const restoreUrlAndTitle = () => {
      document.title = prevTitle;
      try {
        window.history.replaceState(window.history.state, "", prevUrl);
      } catch {
        // ignore history errors
      }
      window.removeEventListener("afterprint", restoreUrlAndTitle);
    };

    window.addEventListener("afterprint", restoreUrlAndTitle);
    window.print();
    setTimeout(restoreUrlAndTitle, 1200);
  };

  const handleShareWhatsApp = async () => {
    if (generandoPdf) return;
    const nombrePac = paciente ? paciente.nombres : "";
    const text = `Hola ${nombrePac}, te comparto tu Plan de Ejercicios y Rehabilitación de Clínica HESOU.`;

    try {
      setGenerandoPdf("whatsapp");
      const { pdfBlob, pdfFile, fileName } = await generarArchivoPDF();

      // En celular o tablet (iOS / Android / iPad), abre el menú nativo con el PDF ya adjunto
      if (isMobileOrTabletDevice() && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: "Plan de Ejercicios - HESOU",
          text
        });
        return;
      }

      // En PC:
      // 1) Copiar el documento como imagen al portapapeles para poder pegarlo con Ctrl + V directo en WhatsApp
      const copiadoPortapapeles = await copiarImagenAlPortapapeles();
      // 2) Descargar el archivo PDF binario (.pdf)
      descargarPdfBinario(pdfBlob, fileName);

      const rawPhone = (paciente?.telefono || "").replace(/\D/g, "");
      const waPhone = rawPhone.length === 10 ? `52${rawPhone}` : rawPhone;
      const waUrl = waPhone
        ? `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;

      await showSuccess(
        "¡Plan listo para enviar!",
        copiadoPortapapeles
          ? `Se descargó "${fileName}" y además se copió el plan al portapapeles: al abrirse WhatsApp solo presiona Ctrl + V (Pegar) en el chat o arrastra el PDF descargado.`
          : `Se descargó "${fileName}" en tu carpeta de Descargas. Al abrirse WhatsApp, arrastra el archivo PDF descargado al chat.`
      );

      window.open(waUrl, "_blank");
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Error al compartir por WhatsApp:", err);
      showError("Error", "No se pudo generar el archivo PDF para compartir.");
    } finally {
      setGenerandoPdf(null);
    }
  };

  const handleShareEmail = async () => {
    if (generandoPdf) return;
    const subject = `Tu Plan de Ejercicios - HESOU`;
    const body = `Hola ${paciente ? paciente.nombres : ""},\n\nTe envío tu plan de ejercicios y rehabilitación en el archivo PDF adjunto.\n\nSaludos,\nHESOU`;

    try {
      setGenerandoPdf("email");
      const { pdfBlob, pdfFile, fileName } = await generarArchivoPDF();

      // En celular o tablet, abre el menú nativo con el PDF ya adjunto
      if (isMobileOrTabletDevice() && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: subject,
          text: body
        });
        return;
      }

      // En PC: descargar el archivo PDF binario (.pdf)
      descargarPdfBinario(pdfBlob, fileName);

      const destEmail = paciente?.email || paciente?.correoElectronico || "";
      const mailtoUrl = `mailto:${encodeURIComponent(destEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      await showSuccess(
        "PDF descargado listo para adjuntar",
        `Se descargó "${fileName}" automáticamente. A continuación se abrirá tu correo para que adjuntes el archivo.`
      );

      window.location.href = mailtoUrl;
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Error al compartir por correo:", err);
      showError("Error", "No se pudo generar el archivo PDF para enviar por correo.");
    } finally {
      setGenerandoPdf(null);
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

      let resolvedPaciente = null;
      try {
        const resPac = await api.get(`/pacientes/${planData.identificadorPaciente}`);
        if (resPac.data && resPac.data.nombres) {
          resolvedPaciente = resPac.data;
        }
      } catch {
        // continuar con fallback
      }

      if (!resolvedPaciente) {
        try {
          const resPaciente = await api.get(`/citas/detalles-paciente/${planData.identificadorPaciente}`);
          if (resPaciente.data.historial && resPaciente.data.historial.length > 0) {
            resolvedPaciente = resPaciente.data.historial[0];
          }
        } catch {
          // continuar con fallback localStorage
        }
      }

      if (!resolvedPaciente) {
        const localData = JSON.parse(localStorage.getItem("dataPaciente"));
        if (localData && localData.identificadorPaciente === planData.identificadorPaciente) {
          resolvedPaciente = localData;
        }
      }

      if (resolvedPaciente) {
        setPaciente(resolvedPaciente);
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
    <div className="auth-wrapper-content plan-documento-page" style={{ padding: '20px 20px 120px 20px', flexDirection: 'column', alignItems: 'center' }}>
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
          type="button"
          onClick={handleShareWhatsApp}
          disabled={Boolean(generandoPdf)}
          style={{
            border: 'none',
            padding: '10px 18px',
            borderRadius: '30px',
            cursor: generandoPdf ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#25D366',
            color: 'white',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
            transition: 'all 0.2s ease',
            opacity: generandoPdf && generandoPdf !== 'whatsapp' ? 0.65 : 1
          }}
          onMouseEnter={(e) => !generandoPdf && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          title="Descargar PDF y compartir por WhatsApp"
        >
          {generandoPdf === "whatsapp" ? (
            <>
              <LoadingSpinner size="small" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <FaWhatsapp size={18} />
              <span>WhatsApp</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShareEmail}
          disabled={Boolean(generandoPdf)}
          style={{
            border: 'none',
            padding: '10px 18px',
            borderRadius: '30px',
            cursor: generandoPdf ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#EA4335',
            color: 'white',
            fontWeight: '600',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(234, 67, 53, 0.3)',
            transition: 'all 0.2s ease',
            opacity: generandoPdf && generandoPdf !== 'email' ? 0.65 : 1
          }}
          onMouseEnter={(e) => !generandoPdf && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          title="Descargar PDF y compartir por Correo"
        >
          {generandoPdf === "email" ? (
            <>
              <LoadingSpinner size="small" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <FaEnvelope size={16} />
              <span>Correo</span>
            </>
          )}
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
          padding: '48px 50px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          color: '#333'
        }}
      >
        {/* Tabla contenedora para repetir márgenes limpios en cada página impresa sin mostrar encabezados/URL del navegador */}
        <table className="plan-print-layout-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <thead className="plan-print-margin-thead">
            <tr>
              <td style={{ padding: 0, border: 'none' }}>
                <div className="plan-print-top-spacer" />
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 0, border: 'none', verticalAlign: 'top' }}>
                {/* Encabezado Profesional */}
                <div
                  className="plan-header-block"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: '3px solid #42133B',
                    paddingBottom: '16px',
                    marginBottom: '22px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src="/logo_hesou.svg" alt="HESOU" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    <div>
                      <h1 style={{ color: '#42133B', margin: '0 0 4px 0', fontSize: '26px', fontWeight: 'bold' }}>HESOU</h1>
                      <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Clínica de Fisioterapia y Rehabilitación</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '13px' }}>
                    <p style={{ margin: '0 0 4px 0' }}><strong>Fecha:</strong> {formatDateDDMMYYYY(plan.fechaCreacion)}</p>
                    <p style={{ margin: '0' }}><strong>Paciente:</strong> {paciente ? `${paciente.nombres} ${paciente.apellidos}` : plan.identificadorPaciente}</p>
                  </div>
                </div>

                <h2
                  className="plan-title-heading"
                  style={{ textAlign: 'center', color: '#333', fontSize: '20px', marginBottom: '22px' }}
                >
                  PLAN DE EJERCICIOS Y REHABILITACIÓN
                </h2>

                {plan.notasGenerales && (
                  <div
                    className="plan-notes-block"
                    style={{
                      background: '#f8f9fa',
                      borderLeft: '4px solid #42133B',
                      padding: '12px 15px',
                      marginBottom: '22px',
                      borderRadius: '0 5px 5px 0'
                    }}
                  >
                    <h4 style={{ margin: '0 0 6px 0', color: '#42133B', fontSize: '14px' }}>Indicaciones Generales</h4>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.45' }}>{plan.notasGenerales}</p>
                  </div>
                )}

                {/* Contenedor en bloque (NO flex) para que Safari/iPad y Chrome respeten los saltos de página */}
                <div className="plan-exercises-list" style={{ display: 'block', width: '100%' }}>
                  {plan.ejercicios.map((item, index) => {
                    const ejKey = item.ejercicio?._id || `doc-${index}`;
                    const cached = getExerciseImageCache(item.ejercicio);
                    const imgSrc = cached || resolveExerciseImage(item.ejercicio);
                    const hasValidImage = Boolean(imgSrc) && (!failedImages[ejKey] || Boolean(cached));

                    return (
                      <div
                        key={index}
                        className="plan-exercise-item"
                        style={{
                          display: 'block',
                          width: '100%',
                          borderBottom: '1px solid #e5e7eb',
                          paddingBottom: '18px',
                          marginBottom: '20px',
                          pageBreakInside: 'avoid',
                          breakInside: 'avoid',
                          WebkitColumnBreakInside: 'avoid'
                        }}
                      >
                        <div
                          className="plan-exercise-item-inner"
                          style={{
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'flex-start',
                            width: '100%'
                          }}
                        >
                          {hasValidImage ? (
                            <div
                              className="plan-exercise-img-box"
                              style={{
                                position: 'relative',
                                width: '165px',
                                height: '165px',
                                flexShrink: 0,
                                background: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <img
                                className="plan-exercise-img"
                                src={imgSrc}
                                alt={item.ejercicio?.nombre}
                                onError={() => setFailedImages((prev) => ({ ...prev, [ejKey]: true }))}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  borderRadius: '6px',
                                  display: 'block'
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className="plan-exercise-img-box"
                              style={{
                                width: '165px',
                                height: '165px',
                                background: '#f0f0f0',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                                flexShrink: 0
                              }}
                            >
                              <span>Sin imagen</span>
                            </div>
                          )}

                          <div className="plan-exercise-details" style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#42133B', fontSize: '17px', lineHeight: '1.3' }}>
                              {index + 1}. {item.ejercicio?.nombre || "Ejercicio Desconocido"}
                            </h3>

                            <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#555', lineHeight: '1.45' }}>
                              {item.ejercicio?.descripcion}
                            </p>

                            <div
                              className="plan-exercise-metrics"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '10px',
                                background: '#f8f9fa',
                                padding: '12px 14px',
                                borderRadius: '6px'
                              }}
                            >
                              <div>
                                <span style={{ display: 'block', fontSize: '10.5px', color: '#888', textTransform: 'uppercase' }}>Series</span>
                                <strong style={{ fontSize: '14px' }}>{item.series || "-"}</strong>
                              </div>
                              <div>
                                <span style={{ display: 'block', fontSize: '10.5px', color: '#888', textTransform: 'uppercase' }}>Repeticiones</span>
                                <strong style={{ fontSize: '14px' }}>{item.repeticiones || "-"}</strong>
                              </div>
                              <div>
                                <span style={{ display: 'block', fontSize: '10.5px', color: '#888', textTransform: 'uppercase' }}>Frecuencia</span>
                                <strong style={{ fontSize: '14px' }}>{item.frecuencia || "-"}</strong>
                              </div>

                              {item.notas && (
                                <div style={{ gridColumn: '1 / -1', marginTop: '8px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
                                  <span style={{ display: 'block', fontSize: '10.5px', color: '#888', textTransform: 'uppercase' }}>Nota específica</span>
                                  <span style={{ fontSize: '12.5px', color: '#444' }}>{item.notas}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="plan-footer-block"
                  style={{
                    marginTop: '30px',
                    textAlign: 'center',
                    color: '#888',
                    fontSize: '11.5px',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                  }}
                >
                  <p style={{ margin: 0 }}>
                    Este documento es una guía de ejercicios complementaria a su tratamiento. Si presenta dolor agudo, suspenda el ejercicio y consulte a su fisioterapeuta.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot className="plan-print-margin-tfoot">
            <tr>
              <td style={{ padding: 0, border: 'none' }}>
                <div className="plan-print-bottom-spacer" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PlanDocumento;
