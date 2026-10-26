import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import api, { SERVER_URL } from "../../api";
import { showError, showSuccess } from "../../utils/alerts";
import Swal from "sweetalert2";
import {
  FaPlus,
  FaTimes,
  FaTrashAlt,
  FaDownload,
  FaSearchPlus,
  FaSearchMinus,
  FaRedo,
  FaUndo,
  FaPrint,
  FaFilePdf,
  FaImage,
  FaFileMedical,
  FaXRay,
  FaPills,
  FaVial,
  FaCamera,
  FaCloudUploadAlt,
  FaCheckCircle,
  FaCalendarAlt,
  FaStickyNote
} from "react-icons/fa";
import LoadingSpinner from "../layout/LoadingSpinner";

const CATEGORIAS = [
  { id: "Radiografía", label: "Radiografía / Rayos X", icon: FaXRay, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
  { id: "Receta Médica", label: "Receta Médica", icon: FaPills, color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
  { id: "Estudio de Laboratorio", label: "Estudio / Laboratorio", icon: FaVial, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  { id: "Foto Clínica / Lesión", label: "Foto Clínica / Evolución", icon: FaCamera, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
  { id: "Documento / Otro", label: "Documento / Otro", icon: FaFileMedical, color: "#64748b", bg: "rgba(100, 116, 139, 0.12)" }
];

const getCategoryMeta = (catName) => {
  return CATEGORIAS.find(c => c.id === catName) || CATEGORIAS[4];
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function ArchivosExpediente({ identificadorPaciente, readOnly = false, initialFiles = null }) {
  const [archivos, setArchivos] = useState(initialFiles || []);
  const [loading, setLoading] = useState(!initialFiles);
  const [uploading, setUploading] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");

  // Modal de Subida
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Radiografía");
  const [descripcion, setDescripcion] = useState("");
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Lightbox / Visualizador a pantalla completa
  const [lightboxFile, setLightboxFile] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const cargarArchivos = async () => {
    if (!identificadorPaciente) return;
    try {
      setLoading(true);
      const res = await api.get(`/expediente-archivos/paciente/${identificadorPaciente}`);
      if (res.data && res.data.archivos) {
        setArchivos(res.data.archivos);
      }
    } catch (err) {
      console.error("Error al cargar archivos del expediente:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (identificadorPaciente) {
      cargarArchivos();
    }
  }, [identificadorPaciente]);

  // Manejo de archivos seleccionados
  const handleFilesChosen = (filesList) => {
    const validFiles = Array.from(filesList).filter(file => {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      return isImg || isPdf;
    });

    if (validFiles.length === 0) {
      showError("Formato no compatible", "Por favor selecciona imágenes (JPG, PNG, WEBP) o documentos PDF.");
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Generar vistas previas para imágenes
    validFiles.forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => [...prev, { name: file.name, size: file.size, url: e.target.result, isPdf: false }]);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => [...prev, { name: file.name, size: file.size, url: null, isPdf: true }]);
      }
    });
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  const handleSubirArchivos = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      showError("Sin archivos", "Por favor selecciona al menos una foto o archivo para guardar.");
      return;
    }

    if (!identificadorPaciente) {
      showError("Falta paciente", "No se detectó el identificador del expediente del paciente.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("identificadorPaciente", identificadorPaciente);
      formData.append("categoria", categoriaSeleccionada);
      formData.append("descripcion", descripcion.trim());

      selectedFiles.forEach(file => {
        formData.append("archivos", file);
      });

      const res = await api.post("/expediente-archivos/subir", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      showSuccess("¡Archivos guardados!", res.data.msg || "Fotos agregadas con éxito al expediente.");

      // Limpiar formulario y cerrar modal
      setSelectedFiles([]);
      setPreviews([]);
      setDescripcion("");
      setShowUploadModal(false);

      // Recargar lista
      cargarArchivos();
    } catch (err) {
      console.error("Error al subir fotos:", err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || "No se pudieron subir las fotos.";
      showError("Error al subir", errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleEliminarArchivo = async (archivo) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar archivo?",
      text: `Se eliminará "${archivo.nombreOriginal || archivo.categoria}" del expediente clínico.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/expediente-archivos/${archivo._id}`);
        showSuccess("Eliminado", "El archivo fue eliminado del expediente.");
        setArchivos(prev => prev.filter(a => a._id !== archivo._id));
        if (lightboxFile && lightboxFile._id === archivo._id) {
          closeLightbox();
        }
      } catch (err) {
        console.error("Error al eliminar archivo:", err);
        showError("Error", "No se pudo eliminar el archivo.");
      }
    }
  };

  const openLightbox = (archivo) => {
    setLightboxFile(archivo);
    setZoomLevel(1);
    setRotation(0);
  };

  const closeLightbox = () => {
    setLightboxFile(null);
    setZoomLevel(1);
    setRotation(0);
  };

  const handlePrint = () => {
    if (!lightboxFile) return;
    const printWindow = window.open("", "_blank");
    const fileUrl = `${SERVER_URL}${lightboxFile.url}`;
    printWindow.document.write(`
      <html>
        <head>
          <title>${lightboxFile.categoria} - ${lightboxFile.nombreOriginal}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; background: #fff; padding: 20px; }
            img { max-width: 95%; max-height: 85vh; object-fit: contain; }
            .header { margin-bottom: 15px; text-align: center; }
            h2 { margin: 0 0 5px 0; color: #1e1b4b; }
            p { margin: 0; color: #64748b; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${lightboxFile.categoria}</h2>
            <p>Paciente: ${identificadorPaciente} | Fecha: ${new Date(lightboxFile.fechaSubida).toLocaleDateString()}</p>
            ${lightboxFile.descripcion ? `<p style="font-style: italic; margin-top: 4px;">"${lightboxFile.descripcion}"</p>` : ""}
          </div>
          <img src="${fileUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtrar archivos
  const archivosFiltrados = archivos.filter(a => {
    if (filtroCategoria === "Todos") return true;
    return a.categoria === filtroCategoria;
  });

  return (
    <div className="archivos-expediente-container" style={{ width: "100%", marginTop: "1rem" }}>
      {/* Barra de cabecera con filtros y acción */}
      <div className="archivos-header-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              flexShrink: 0
            }}>
              <FaXRay size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#1e1b4b" }}>
                Radiografías y Recetas Médicas
              </h4>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {archivos.length} {archivos.length === 1 ? "archivo guardado" : "archivos guardados en el expediente"}
              </span>
            </div>
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            className="btn btn-primary hover-grow"
            onClick={() => setShowUploadModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0.55rem 1.15rem",
              fontSize: "0.88rem",
              fontWeight: "600",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)",
              boxShadow: "0 4px 12px var(--primary-glow)",
              color: "#fff",
              cursor: "pointer",
              border: "none"
            }}
          >
            <FaPlus size={13} /> Agregar Foto o Receta
          </button>
        )}
      </div>

      {/* Píldoras de filtro por categoría */}
      <div className="archivos-filtros-bar">
        <button
          type="button"
          onClick={() => setFiltroCategoria("Todos")}
          style={{
            padding: "5px 14px",
            borderRadius: "20px",
            fontSize: "0.8rem",
            fontWeight: "600",
            border: "1px solid",
            borderColor: filtroCategoria === "Todos" ? "var(--primary)" : "rgba(100, 116, 139, 0.2)",
            background: filtroCategoria === "Todos" ? "var(--primary)" : "#ffffff",
            color: filtroCategoria === "Todos" ? "#ffffff" : "#475569",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          Todos ({archivos.length})
        </button>
        {CATEGORIAS.map(cat => {
          const count = archivos.filter(a => a.categoria === cat.id).length;
          const isSelected = filtroCategoria === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFiltroCategoria(cat.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 14px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: "600",
                border: "1px solid",
                borderColor: isSelected ? cat.color : "rgba(100, 116, 139, 0.2)",
                background: isSelected ? cat.color : "#ffffff",
                color: isSelected ? "#ffffff" : "#475569",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Icon size={12} /> {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Contenido / Cuadrícula de fotos */}
      {loading ? (
        <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
          <LoadingSpinner size="medium" color="var(--primary)" />
        </div>
      ) : archivosFiltrados.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "3rem 1.5rem",
          background: "rgba(255, 255, 255, 0.6)",
          borderRadius: "16px",
          border: "2px dashed rgba(99, 102, 241, 0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "rgba(99, 102, 241, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)"
          }}>
            <FaXRay size={28} />
          </div>
          <h4 style={{ margin: 0, color: "#1e1b4b", fontSize: "1.05rem", fontWeight: "600" }}>
            {filtroCategoria === "Todos"
              ? "No hay radiografías ni recetas registradas en este expediente"
              : `No hay archivos en la categoría "${filtroCategoria}"`}
          </h4>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", maxWidth: "420px" }}>
            Puedes adjuntar radiografías, recetas médicas, tomografías, o fotos clínicas de la evolución del paciente para consultarlas en cualquier momento.
          </p>
          {!readOnly && (
            <button
              type="button"
              className="btn btn-primary hover-grow"
              onClick={() => {
                if (filtroCategoria !== "Todos") setCategoriaSeleccionada(filtroCategoria);
                setShowUploadModal(true);
              }}
              style={{ marginTop: "0.5rem", padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}
            >
              <FaPlus size={12} style={{ marginRight: "6px" }} /> Subir Primer Archivo
            </button>
          )}
        </div>
      ) : (
        <div className="archivos-cards-grid">
          {archivosFiltrados.map((archivo) => {
            const meta = getCategoryMeta(archivo.categoria);
            const Icon = meta.icon;
            const fileUrl = `${SERVER_URL}${archivo.url}`;
            const isImage = !archivo.mimetype?.includes("pdf") && !archivo.url.endsWith(".pdf");

            return (
              <div
                key={archivo._id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid rgba(99, 102, 241, 0.12)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                className="hover-grow"
              >
                {/* Zona de previsualización */}
                <div
                  style={{
                    position: "relative",
                    height: "175px",
                    background: "#0f172a",
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  onClick={() => openLightbox(archivo)}
                  title="Clic para ver en tamaño completo"
                >
                  {isImage ? (
                    <img
                      src={fileUrl}
                      alt={archivo.descripcion || archivo.categoria}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s"
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = '<div style="color: #94a3b8; font-size: 13px;">Vista previa no disponible</div>';
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center", color: "#ef4444" }}>
                      <FaFilePdf size={48} />
                      <p style={{ margin: "6px 0 0", color: "#f8fafc", fontSize: "0.8rem", fontWeight: "600" }}>Documento PDF</p>
                    </div>
                  )}

                  {/* Badge de Categoría flotante */}
                  <div style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(6px)",
                    color: meta.color,
                    fontSize: "0.75rem",
                    fontWeight: "700"
                  }}>
                    <Icon size={12} /> {archivo.categoria}
                  </div>

                  {/* Icono de zoom flotante */}
                  <div style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(15, 23, 42, 0.7)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem"
                  }}>
                    <FaSearchPlus />
                  </div>
                </div>

                {/* Detalles del archivo */}
                <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h5 style={{
                      margin: "0 0 4px",
                      fontSize: "0.92rem",
                      fontWeight: "700",
                      color: "#1e1b4b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }} title={archivo.nombreOriginal}>
                      {archivo.nombreOriginal || archivo.categoria}
                    </h5>

                    {archivo.descripcion && (
                      <p style={{
                        margin: "0 0 8px",
                        fontSize: "0.82rem",
                        color: "#475569",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: "1.3"
                      }}>
                        {archivo.descripcion}
                      </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem", color: "#94a3b8", marginTop: "4px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><FaCalendarAlt size={10} /> {new Date(archivo.fechaSubida).toLocaleDateString()}</span>
                      {archivo.tamano > 0 && <span>{formatFileSize(archivo.tamano)}</span>}
                    </div>
                  </div>

                  {/* Acciones del archivo */}
                  <div style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "0.85rem",
                    paddingTop: "0.65rem",
                    borderTop: "1px solid rgba(226, 232, 240, 0.8)"
                  }}>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={archivo.nombreOriginal}
                      style={{
                        padding: "5px 9px",
                        borderRadius: "6px",
                        background: "rgba(99, 102, 241, 0.08)",
                        color: "var(--primary)",
                        border: "1px solid rgba(99, 102, 241, 0.15)",
                        fontSize: "0.78rem",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        textDecoration: "none"
                      }}
                      className="hover-grow"
                      title="Descargar archivo"
                    >
                      <FaDownload size={11} /> Descargar
                    </a>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleEliminarArchivo(archivo)}
                        style={{
                          padding: "5px 9px",
                          borderRadius: "6px",
                          background: "rgba(239, 68, 68, 0.08)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.15)",
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer"
                        }}
                        className="hover-grow"
                        title="Eliminar del expediente"
                      >
                        <FaTrashAlt size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL PARA SUBIR FOTOS/ARCHIVOS ================= */}
      {showUploadModal && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div className="archivos-upload-modal-content">
            {/* Header del Modal */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(13, 148, 136, 0.05) 100%)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(99, 102, 241, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)"
                }}>
                  <FaCamera size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1e1b4b" }}>
                    Agregar al historial del Paciente
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                  setPreviews([]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "6px",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubirArchivos} style={{ padding: "1.5rem" }}>
              {/* Selección de Tipo / Categoría */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                  Tipo de archivo / Documento:
                </label>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                  gap: "0.5rem"
                }}>
                  {CATEGORIAS.map(cat => {
                    const isSelected = categoriaSeleccionada === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoriaSeleccionada(cat.id)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "10px",
                          border: isSelected ? `2px solid ${cat.color}` : "1px solid #e2e8f0",
                          background: isSelected ? cat.bg : "#f8fafc",
                          color: isSelected ? cat.color : "#475569",
                          fontWeight: isSelected ? "700" : "500",
                          fontSize: "0.82rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <Icon size={16} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zona Drag & Drop / Input de Archivo */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ fontWeight: "700", marginBottom: "0.5rem", display: "block" }}>
                  Seleccionar una o varias fotos:
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: dragActive ? "2px dashed var(--primary)" : "2px dashed #cbd5e1",
                    borderRadius: "14px",
                    background: dragActive ? "rgba(99, 102, 241, 0.08)" : "#f8fafc",
                    padding: "1.75rem 1rem",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesChosen(e.target.files);
                      }
                    }}
                  />
                  <FaCloudUploadAlt size={38} style={{ color: "var(--primary)", marginBottom: "8px" }} />
                  <p style={{ margin: "0 0 4px", fontSize: "0.92rem", fontWeight: "600", color: "#1e1b4b" }}>
                    Arrastra aquí tus fotos o <span style={{ color: "var(--primary)", textDecoration: "underline" }}>haz clic para examinar</span>
                  </p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>
                    Puedes subir múltiples fotos simultáneamente (Radiografías, Recetas, Fotos desde tu celular, PDF)
                  </p>
                </div>
              </div>

              {/* Lista de archivos seleccionados con vista previa */}
              {previews.length > 0 && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <label className="form-label" style={{ fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>
                    Archivos a subir ({previews.length}):
                  </label>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "0.65rem",
                    maxHeight: "180px",
                    overflowY: "auto",
                    padding: "6px",
                    background: "#f1f5f9",
                    borderRadius: "10px"
                  }}>
                    {previews.map((prev, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          background: "#fff",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid #cbd5e1",
                          height: "100px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {prev.isPdf ? (
                          <div style={{ textAlign: "center", color: "#ef4444" }}>
                            <FaFilePdf size={28} />
                            <span style={{ display: "block", fontSize: "0.68rem", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {prev.name}
                            </span>
                          </div>
                        ) : (
                          <img
                            src={prev.url}
                            alt={prev.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedFile(idx);
                          }}
                          style={{
                            position: "absolute",
                            top: "3px",
                            right: "3px",
                            background: "rgba(239, 68, 68, 0.9)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "10px"
                          }}
                          title="Quitar"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción o notas clínicas del archivo */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" style={{ fontWeight: "700", marginBottom: "0.4rem", display: "block" }}>
                  Descripción o notas adicionales (Opcional):
                </label>
                <textarea
                  className="textarea"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Radiografía AP de tórax, prescripción médica de analgésicos, estudio de resonancia magnética..."
                  style={{
                    width: "100%",
                    height: "75px",
                    borderRadius: "10px",
                    padding: "0.65rem",
                    fontSize: "0.85rem",
                    border: "1px solid #cbd5e1"
                  }}
                />
              </div>

              {/* Botones de acción */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles([]);
                    setPreviews([]);
                  }}
                  style={{
                    padding: "0.6rem 1.25rem",
                    borderRadius: "10px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    flex: "1 1 auto",
                    maxWidth: "150px"
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="btn btn-primary"
                  style={{
                    padding: "0.6rem 1.5rem",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: (uploading || selectedFiles.length === 0) ? 0.6 : 1,
                    cursor: (uploading || selectedFiles.length === 0) ? "not-allowed" : "pointer",
                    flex: "2 1 auto"
                  }}
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner size="small" color="#fff" />
                      <span>Subiendo {selectedFiles.length} archivo(s)...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Guardar en Expediente
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ================= LIGHTBOX / VISUALIZADOR DE ALTA DEFINICIÓN ================= */}
      {lightboxFile && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(10, 15, 29, 0.94)",
          backdropFilter: "blur(12px)",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          animation: "fadeIn 0.2s ease-out"
        }}>
          {/* Barra superior de herramientas del Lightbox */}
          <div className="archivos-lightbox-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: "1 1 200px" }}>
              <span style={{
                padding: "4px 10px",
                borderRadius: "20px",
                background: getCategoryMeta(lightboxFile.categoria).bg,
                color: getCategoryMeta(lightboxFile.categoria).color,
                fontSize: "0.78rem",
                fontWeight: "700",
                flexShrink: 0
              }}>
                {lightboxFile.categoria}
              </span>
              <h4 style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: "600",
                color: "#f8fafc",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }} title={lightboxFile.nombreOriginal}>
                {lightboxFile.nombreOriginal}
              </h4>
            </div>

            {/* Controles de Zoom, Rotación e Impresión */}
            <div className="archivos-lightbox-tools">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                title="Acercar (+)"
              >
                <FaSearchPlus /> <span className="tool-label">Zoom In</span>
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                title="Alejar (-)"
              >
                <FaSearchMinus /> <span className="tool-label">Zoom Out</span>
              </button>

              <button
                type="button"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
                title="Girar 90°"
              >
                <FaRedo /> <span className="tool-label">Girar</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                title="Imprimir"
              >
                <FaPrint /> <span className="tool-label">Imprimir</span>
              </button>

              <a
                href={`${SERVER_URL}${lightboxFile.url}`}
                target="_blank"
                rel="noopener noreferrer"
                download={lightboxFile.nombreOriginal}
                style={{
                  background: "var(--primary)",
                  fontWeight: "600"
                }}
                title="Descargar archivo original"
              >
                <FaDownload /> <span className="tool-label">Descargar</span>
              </a>

              <button
                type="button"
                onClick={closeLightbox}
                style={{
                  background: "rgba(239, 68, 68, 0.85)"
                }}
                title="Cerrar visualizador"
              >
                <FaTimes size={14} /> <span className="tool-label">Cerrar</span>
              </button>
            </div>
          </div>

          {/* Área principal del visor con zoom y rotación */}
          <div className="archivos-lightbox-body">
            {lightboxFile.mimetype?.includes("pdf") || lightboxFile.url.endsWith(".pdf") ? (
              <iframe
                src={`${SERVER_URL}${lightboxFile.url}`}
                title={lightboxFile.nombreOriginal}
                style={{
                  width: "95%",
                  height: "85vh",
                  border: "none",
                  borderRadius: "12px",
                  background: "#fff"
                }}
              />
            ) : (
              <img
                src={`${SERVER_URL}${lightboxFile.url}`}
                alt={lightboxFile.descripcion || lightboxFile.categoria}
                style={{
                  maxWidth: "92%",
                  maxHeight: "82vh",
                  objectFit: "contain",
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: "transform 0.25s ease-out",
                  borderRadius: "8px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)"
                }}
              />
            )}
          </div>

          {/* Pie del Lightbox con metadatos */}
          {(lightboxFile.descripcion || lightboxFile.subidoPor) && (
            <div className="archivos-lightbox-footer">
              <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                {lightboxFile.descripcion && (
                  <p style={{
                    margin: 0,
                    fontWeight: "500",
                    color: "#f1f5f9",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    wordBreak: "break-word"
                  }}>
                    <FaStickyNote size={12} style={{ color: "var(--primary)", flexShrink: 0 }} /> {lightboxFile.descripcion}
                  </p>
                )}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", flexShrink: 0 }}>
                <span>Subido por: <strong>{lightboxFile.subidoPor || "Especialista"}</strong></span>
                <span style={{ margin: "0 8px" }}>•</span>
                <span>{new Date(lightboxFile.fechaSubida).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
