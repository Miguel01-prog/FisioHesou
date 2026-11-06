import React, { useState, useEffect, useRef } from "react";
import api from "../../api";
import LoadingSpinner from "./LoadingSpinner";
import { showError, showSuccess } from "../../utils/alerts";
import { FaTrash, FaCloudUploadAlt, FaDumbbell, FaCamera, FaEdit, FaTimes, FaSave } from "react-icons/fa";
import {
  resolveExerciseImage,
  compressImageToBase64,
  saveExerciseImageCache,
  getExerciseImageCache
} from "../../utils/utils";

const ConfiguracionEjercicios = () => {
  const [ejercicios, setEjercicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [failedImages, setFailedImages] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const replaceInputRef = useRef(null);
  const formCardRef = useRef(null);
  const [ejercicioParaImagen, setEjercicioParaImagen] = useState(null);

  // Estado para el formulario (Crear o Editar)
  const [ejercicioEditando, setEjercicioEditando] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarEjercicios();
  }, []);

  const cargarEjercicios = async () => {
    try {
      const res = await api.get("/ejercicios");
      setEjercicios(res.data.ejercicios || []);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudieron cargar los ejercicios.");
    } finally {
      setCargando(false);
    }
  };

  const handleImagenChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      try {
        const preview = await compressImageToBase64(file);
        setImagenPreview(preview);
      } catch (err) {
        setImagenPreview("");
      }
    }
  };

  const iniciarEdicion = (ej) => {
    setEjercicioEditando(ej);
    setNombre(ej.nombre || "");
    setDescripcion(ej.descripcion || "");
    setImagen(null);
    const cached = getExerciseImageCache(ej);
    const currentImg = cached || resolveExerciseImage(ej);
    setImagenPreview(!failedImages[ej._id] ? currentImg : "");
    if (formCardRef.current) {
      formCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const cancelarEdicion = () => {
    setEjercicioEditando(null);
    setNombre("");
    setDescripcion("");
    setImagen(null);
    setImagenPreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      showError("Faltan campos", "El nombre del ejercicio es obligatorio.");
      return;
    }

    setGuardando(true);
    
    const formData = new FormData();
    formData.append("nombre", nombre.trim());
    formData.append("descripcion", descripcion);
    let base64DataUrl = "";
    if (imagen) {
      formData.append("imagen", imagen);
      try {
        base64DataUrl = await compressImageToBase64(imagen);
        formData.append("imagenBase64", base64DataUrl);
        formData.append("imagenUrl", base64DataUrl);
        saveExerciseImageCache(nombre.trim(), base64DataUrl);
      } catch (compressErr) {
        console.warn("No se pudo convertir imagen a base64:", compressErr);
      }
    }

    try {
      if (ejercicioEditando) {
        if (base64DataUrl) {
          saveExerciseImageCache({ _id: ejercicioEditando._id, nombre: nombre.trim() }, base64DataUrl);
        }

        let putSucceeded = false;
        try {
          const res = await api.put(`/ejercicios/${ejercicioEditando._id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          putSucceeded = true;
          if (base64DataUrl && res.data?.ejercicio) {
            saveExerciseImageCache(res.data.ejercicio, base64DataUrl);
          }
        } catch (putErr) {
          console.warn("Actualizado localmente:", putErr);
        }

        setEjercicios((prev) =>
          prev.map((item) =>
            item._id === ejercicioEditando._id
              ? {
                  ...item,
                  nombre: nombre.trim(),
                  descripcion,
                  ...(base64DataUrl ? { imagenUrl: base64DataUrl, imagenBase64: base64DataUrl } : {})
                }
              : item
          )
        );
        if (base64DataUrl) {
          setFailedImages((prev) => ({ ...prev, [ejercicioEditando._id]: false }));
        }

        showSuccess("¡Ejercicio actualizado!", `Se guardaron los cambios de "${nombre.trim()}".`);
        cancelarEdicion();
        if (putSucceeded) {
          cargarEjercicios();
        }
      } else {
        const res = await api.post("/ejercicios", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        if (base64DataUrl && res.data?.ejercicio) {
          saveExerciseImageCache(res.data.ejercicio, base64DataUrl);
        }
        
        showSuccess("¡Éxito!", "Ejercicio guardado correctamente en el catálogo.");
        
        cancelarEdicion();
        cargarEjercicios();
      }
    } catch (err) {
      console.error(err);
      showError("Error", "Hubo un problema al guardar el ejercicio.");
    } finally {
      setGuardando(false);
    }
  };

  const handleTriggerCambiarImagen = (ej) => {
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
    setUpdatingId(targetEj._id);

    try {
      const base64DataUrl = await compressImageToBase64(file);
      saveExerciseImageCache(targetEj, base64DataUrl);

      setEjercicios((prev) =>
        prev.map((item) =>
          item._id === targetEj._id
            ? { ...item, imagenUrl: base64DataUrl, imagenBase64: base64DataUrl }
            : item
        )
      );
      setFailedImages((prev) => ({ ...prev, [targetEj._id]: false }));

      const formData = new FormData();
      formData.append("nombre", targetEj.nombre);
      formData.append("descripcion", targetEj.descripcion || "");
      formData.append("imagen", file);
      formData.append("imagenBase64", base64DataUrl);
      formData.append("imagenUrl", base64DataUrl);

      try {
        await api.put(`/ejercicios/${targetEj._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } catch (putErr) {
        console.warn("Actualización guardada en caché local:", putErr);
      }

      showSuccess("Imagen actualizada", `Se actualizó la imagen de "${targetEj.nombre}".`);
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo procesar la imagen seleccionada.");
    } finally {
      setUpdatingId(null);
      setEjercicioParaImagen(null);
    }
  };

  const eliminarEjercicio = async (id) => {
    try {
      await api.delete(`/ejercicios/${id}`);
      if (ejercicioEditando?._id === id) {
        cancelarEdicion();
      }
      cargarEjercicios();
    } catch (err) {
      console.error(err);
      showError("Error", "No se pudo eliminar el ejercicio.");
    }
  };

  const customStyles = `
    .exercise-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: rgba(139, 92, 246, 0.25) !important;
    }
    .exercise-card:hover .exercise-card-img {
      transform: scale(1.05);
    }
    .delete-exercise-btn:hover {
      background: #ef4444 !important;
      color: white !important;
      transform: scale(1.1);
    }
    .edit-exercise-btn:hover {
      background: var(--primary) !important;
      color: white !important;
      transform: scale(1.1);
    }
    .file-upload-zone:hover {
      border-color: var(--primary) !important;
      background: rgba(139, 92, 246, 0.05) !important;
    }
  `;

  return (
    <div className="auth-wrapper-content">
      <style>{customStyles}</style>
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        style={{ display: "none" }}
        onChange={handleReemplazarImagen}
      />
      <div className="cards-column">
        <div
          ref={formCardRef}
          className="auth-card auth-card-detail"
          style={
            ejercicioEditando
              ? { border: "2px solid var(--primary)", boxShadow: "0 8px 25px rgba(99, 102, 241, 0.18)" }
              : undefined
          }
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 className="title_card" style={{ margin: 0 }}>
                {ejercicioEditando ? "Editar Ejercicio" : "Catálogo de Ejercicios"}
              </h2>
              {ejercicioEditando && (
                <span style={{
                  fontSize: "0.78rem",
                  background: "rgba(99, 102, 241, 0.12)",
                  color: "var(--primary)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontWeight: "700"
                }}>
                  Editando: {ejercicioEditando.nombre}
                </span>
              )}
            </div>
            {ejercicioEditando && (
              <button
                type="button"
                onClick={cancelarEdicion}
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FaTimes size={12} /> Cancelar edición
              </button>
            )}
          </div>
          <hr />
          
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-col full-width">
                <label className="form-label">Nombre del Ejercicio:</label>
                <input 
                  type="text" 
                  className="input" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  placeholder="Ej. Estiramiento de isquiotibiales" 
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-col full-width">
                <label className="form-label">Instrucciones / Descripción:</label>
                <textarea 
                  className="textarea" 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe cómo se debe realizar el ejercicio..."
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-col full-width">
                <label className="form-label">Imagen descriptiva (PNG/JPG/WEBP/GIF):</label>
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  border: '2px dashed rgba(139, 92, 246, 0.2)',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }} className="file-upload-zone">
                  {imagenPreview ? (
                    <img
                      src={imagenPreview}
                      alt="Vista previa"
                      style={{ width: "140px", height: "110px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px", border: "1px solid var(--border-light)" }}
                    />
                  ) : (
                    <FaCloudUploadAlt size={32} style={{ color: "var(--primary)", marginBottom: '8px' }} />
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    {imagen ? imagen.name : (ejercicioEditando ? "Haz clic para subir o reemplazar la imagen" : "Seleccionar archivo de imagen")}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Suelte un archivo aquí o haga clic para buscar
                  </span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif" 
                    onChange={handleImagenChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap" }}>
              <button type="submit" className="save-btn" disabled={guardando} style={{ margin: 0 }}>
                {guardando ? (
                  <LoadingSpinner size="small" color="#fff" />
                ) : ejercicioEditando ? (
                  <><FaSave /> Guardar cambios del ejercicio</>
                ) : (
                  "Añadir al catálogo"
                )}
              </button>
              {ejercicioEditando && (
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="btn btn-outline"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Ejercicios */}
        <div className="auth-card auth-card-detail" style={{ marginTop: '20px' }}>
          <h3 className="title_card" style={{ fontSize: '18px' }}>Ejercicios Registrados ({ejercicios.length})</h3>
          <hr />
          
          {cargando ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <LoadingSpinner size="large" />
            </div>
          ) : ejercicios.length === 0 ? (
            <p className="text-muted">No hay ejercicios en el catálogo. Agrega uno arriba.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {ejercicios.map((ej) => {
                const cached = getExerciseImageCache(ej);
                const imgSrc = cached || resolveExerciseImage(ej);
                const hasValidImage = Boolean(imgSrc) && (!failedImages[ej._id] || Boolean(cached));
                const isBeingEdited = ejercicioEditando?._id === ej._id;

                return (
                  <div
                    key={ej._id}
                    className="exercise-card"
                    style={{
                      background: "var(--card-bg, rgba(255,255,255,0.02))",
                      border: isBeingEdited
                        ? "2px solid var(--primary)"
                        : "1px solid var(--border-light, rgba(255,255,255,0.08))",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "var(--shadow-sm)"
                    }}
                  >
                    <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "6px", zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(ej)}
                        style={{
                          background: "rgba(99, 102, 241, 0.9)",
                          border: "none",
                          color: "#ffffff",
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                        }}
                        className="edit-exercise-btn"
                        title="Editar ejercicio"
                      >
                        <FaEdit size={13} />
                      </button>

                      <button 
                        type="button"
                        onClick={() => {
                            if(window.confirm("¿Seguro que deseas eliminar este ejercicio?")) {
                                eliminarEjercicio(ej._id);
                            }
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.9)',
                          border: 'none',
                          color: '#ffffff',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                        }}
                        className="delete-exercise-btn"
                        title="Eliminar del catálogo"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>

                    {hasValidImage ? (
                      <div style={{ position: 'relative', width: '100%', height: '160px', overflow: 'hidden', background: 'rgba(139, 92, 246, 0.05)' }}>
                        <img 
                          src={imgSrc} 
                          alt={ej.nombre} 
                          onError={() => setFailedImages((prev) => ({ ...prev, [ej._id]: true }))}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} 
                          className="exercise-card-img"
                        />
                        <button
                          type="button"
                          onClick={() => handleTriggerCambiarImagen(ej)}
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(15, 23, 42, 0.78)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          title="Cambiar imagen"
                        >
                          <FaCamera size={11} /> Cambiar foto
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleTriggerCambiarImagen(ej)}
                        style={{ width: '100%', height: '160px', background: 'rgba(139, 92, 246, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                        title="Haz clic para subir imagen"
                      >
                        <FaDumbbell size={30} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                          <FaCamera size={11} /> {updatingId === ej._id ? "Guardando..." : "Subir imagen"}
                        </span>
                      </div>
                    )}

                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', color: 'var(--primary)', fontWeight: '700', fontSize: '1.05rem', lineHeight: '1.4' }}>{ej.nombre}</h4>
                        {ej.descripcion && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0', lineHeight: '1.5', textAlign: 'justify', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {ej.descripcion}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => iniciarEdicion(ej)}
                        style={{
                          width: "100%",
                          padding: "7px 12px",
                          borderRadius: "8px",
                          border: "1px solid rgba(99, 102, 241, 0.25)",
                          background: "rgba(99, 102, 241, 0.08)",
                          color: "var(--primary)",
                          fontWeight: "700",
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "all 0.2s"
                        }}
                      >
                        <FaEdit size={12} /> Editar ejercicio
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionEjercicios;
